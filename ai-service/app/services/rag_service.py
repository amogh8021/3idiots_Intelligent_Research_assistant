import io
import os
import base64
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional

from azure.storage.blob import BlobServiceClient
from app.config import settings
from app.models.schemas import (
    IndexRequest,
    IndexResponse,
    QueryRequest,
    QueryResponse,
    SourceItem,
    SynthesizeRequest
)
from app.rag.pdf_extractor import extract_text_from_pdf
from app.rag.chunker import create_document_chunks
from app.rag.embeddings import embedding_service
from app.rag.vector_store import vector_store
from app.rag.generator import generation_service

logger = logging.getLogger(__name__)

class RagService:
    def __init__(self):
        self._blob_service_client = None

    def _get_blob_service_client(self) -> BlobServiceClient:
        if self._blob_service_client is None:
            conn_str = settings.AZURE_STORAGE_CONNECTION_STRING
            if not conn_str:
                raise ValueError("AZURE_STORAGE_CONNECTION_STRING is not set.")
            self._blob_service_client = BlobServiceClient.from_connection_string(conn_str)
        return self._blob_service_client

    def _download_blob_bytes(self, blob_name: str) -> bytes:
        """Download PDF bytes directly from Azure Blob Storage into memory."""
        client = self._get_blob_service_client()
        container_client = client.get_container_client(settings.AZURE_STORAGE_CONTAINER_NAME)
        blob_client = container_client.get_blob_client(blob_name)
        if not blob_client.exists():
            raise FileNotFoundError(f"Blob '{blob_name}' not found in container '{settings.AZURE_STORAGE_CONTAINER_NAME}'")
        return blob_client.download_blob().readall()

    async def index_document(self, request: IndexRequest) -> IndexResponse:
        """
        Extracts, chunks, embeds, and indexes a PDF document into the vector store.
        Retrieves PDF directly from Azure Blob Storage in-memory when blob_name is provided.
        """
        document_id = request.document_id
        pages_data = []

        try:
            logger.info(f"[INDEX_EXTRACTION_STARTED] document_id={document_id}, blob_name={request.blob_name}")
            
            # 1. Direct text content if provided
            if request.text_content:
                pages_data = [{"page_number": 1, "text": request.text_content}]

            # 2. Base64 PDF bytes
            elif request.file_bytes_base64:
                pdf_bytes = base64.b64decode(request.file_bytes_base64)
                pages_data = extract_text_from_pdf(io.BytesIO(pdf_bytes))

            # 3. Azure Blob Storage (in-memory streaming, no disk write)
            elif request.blob_name:
                logger.info(f"Fetching blob '{request.blob_name}' from Azure container '{settings.AZURE_STORAGE_CONTAINER_NAME}'")
                pdf_bytes = self._download_blob_bytes(request.blob_name)
                logger.info(f"Downloaded {len(pdf_bytes)} bytes from Azure Blob Storage for blob '{request.blob_name}'")
                pages_data = extract_text_from_pdf(io.BytesIO(pdf_bytes))

            # 4. Direct file path fallback if explicitly given
            elif request.file_path and os.path.exists(request.file_path):
                pages_data = extract_text_from_pdf(request.file_path)

            else:
                raise ValueError("No valid blob_name, document content, or file bytes provided for indexing.")

            if not pages_data:
                raise ValueError("PDF extraction produced 0 text pages.")

            total_chars = sum(len(p.get("text", "")) for p in pages_data)
            logger.info(f"[PDF_EXTRACTION_SUCCESS] document_id={document_id}, pages={len(pages_data)}, characters={total_chars}")

            # Chunk the document
            chunks = create_document_chunks(
                document_id=document_id,
                pages_data=pages_data,
                chunk_size=settings.CHUNK_SIZE,
                chunk_overlap=settings.CHUNK_OVERLAP
            )

            if not chunks:
                raise ValueError("No chunks generated from document text.")

            # Compute embeddings in batch
            chunk_texts = [c["content"] for c in chunks]
            embeddings = await embedding_service.get_embeddings(chunk_texts)

            # Attach embeddings to chunk records
            chunks_with_embeddings = []
            for chunk, emb in zip(chunks, embeddings):
                chunk_record = dict(chunk)
                chunk_record["embedding"] = emb
                chunks_with_embeddings.append(chunk_record)

            # Store in vector index
            vector_store.add_document_chunks(document_id, chunks_with_embeddings)

            total_pages = max(p["page_number"] for p in pages_data)
            logger.info(f"[INDEX_SUCCESS] document_id={document_id}, total_chunks={len(chunks)}, total_pages={total_pages}")

            return IndexResponse(
                document_id=document_id,
                status="READY",
                total_pages=total_pages,
                total_chunks=len(chunks),
                message=f"Successfully extracted, chunked, and indexed {len(chunks)} passages across {total_pages} page(s)."
            )

        except Exception as e:
            logger.error(f"[INDEX_FAILED] document_id={document_id}: {e}", exc_info=True)
            return IndexResponse(
                document_id=document_id,
                status="FAILED",
                total_pages=0,
                total_chunks=0,
                message=f"Indexing failed: {str(e)}"
            )

    async def query(self, request: QueryRequest) -> QueryResponse:
        """
        Executes semantic retrieval across requested documentIds and generates grounded response.
        """
        logger.info(f"[AI_QUERY_RECEIVED] question='{request.question}', documentIds={request.document_ids}")
        top_k = request.top_k or settings.TOP_K
        
        # 1. Get embedding for the user question
        query_emb = await embedding_service.get_query_embedding(request.question)

        # 2. Perform similarity search filtered strictly by document_ids
        logger.info("[RETRIEVAL_STARTED]")
        retrieved_chunks = vector_store.search(
            document_ids=request.document_ids,
            query_embedding=query_emb,
            top_k=top_k,
            min_similarity=settings.SIMILARITY_THRESHOLD
        )

        # Fallback with 0.0 threshold if no chunks met strict threshold but documents exist
        if not retrieved_chunks:
            retrieved_chunks = vector_store.search(
                document_ids=request.document_ids,
                query_embedding=query_emb,
                top_k=top_k,
                min_similarity=0.0
            )

        top_scores = [c.get("similarity") for c in retrieved_chunks[:3]]
        logger.info(f"[RETRIEVAL_RESULT_COUNT] count={len(retrieved_chunks)}, top_scores={top_scores}")

        all_doc_chunks = [c for doc_id in request.document_ids for c in vector_store.docs.get(str(doc_id), [])]

        # 3. Generate grounded answer
        answer, is_grounded = await generation_service.generate_answer(
            question=request.question,
            retrieved_chunks=retrieved_chunks,
            all_doc_chunks=all_doc_chunks
        )

        # 4. Map sources with exact page and snippet
        sources = []
        for chunk in retrieved_chunks:
            snippet = chunk["content"]
            if len(snippet) > 300:
                snippet = snippet[:297] + "..."
            sources.append(
                SourceItem(
                    document_id=chunk["document_id"],
                    page=chunk["page_number"],
                    chunk_id=chunk["chunk_id"],
                    snippet=snippet,
                    similarity=chunk.get("similarity")
                )
            )

        avg_confidence = None
        if retrieved_chunks:
            avg_confidence = round(sum(c.get("similarity", 0) for c in retrieved_chunks) / len(retrieved_chunks), 3)

        return QueryResponse(
            answer=answer,
            sources=sources,
            grounded=is_grounded,
            confidence=avg_confidence
        )

    async def synthesize(self, request: SynthesizeRequest) -> QueryResponse:
        """
        Cross-document synthesis preset handler.
        """
        focus_prompts = {
            "methodology": "Provide a comprehensive comparative analysis of experimental methodologies, model architectures, and empirical datasets used across these papers.",
            "limitations": "Extract and synthesize critical limitations, failure cases, threats to validity, and proposed future research directions from these papers.",
            "comparison": "Construct a comparative synthesis matrix detailing key benchmarks, performance trade-offs, and consensus versus divergence among the authors.",
            "executive": "Generate an executive academic literature summary synthesizing the primary contributions, breakthrough discoveries, and collective implications of these research works."
        }

        prompt = focus_prompts.get(request.focus.lower(), focus_prompts["executive"])
        
        query_req = QueryRequest(
            document_ids=request.document_ids,
            question=prompt,
            top_k=8
        )
        return await self.query(query_req)

rag_service = RagService()
