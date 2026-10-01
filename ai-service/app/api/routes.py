import logging
from fastapi import APIRouter, HTTPException, status
from app.models.schemas import (
    IndexRequest,
    IndexResponse,
    QueryRequest,
    QueryResponse,
    SynthesizeRequest
)
from app.services.rag_service import rag_service
from app.rag.vector_store import vector_store

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/index", response_model=IndexResponse, status_code=status.HTTP_200_OK)
async def index_document(request: IndexRequest):
    """
    Index a research PDF document: extracts text, chunks it, generates embeddings, and saves into vector store.
    """
    logger.info(f"Received indexing request for document {request.document_id}")
    result = await rag_service.index_document(request)
    if result.status == "FAILED":
        logger.warning(f"Indexing failed for doc {request.document_id}: {result.message}")
    return result

@router.post("/query", response_model=QueryResponse, status_code=status.HTTP_200_OK)
async def query_documents(request: QueryRequest):
    """
    Execute evidence-grounded similarity search and LLM response generation over selected documents.
    """
    if not request.document_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one documentId must be provided for research querying."
        )
    if not request.question or not request.question.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question cannot be empty."
        )

    logger.info(f"Query request across {len(request.document_ids)} documents: '{request.question[:60]}...'")
    return await rag_service.query(request)

@router.post("/synthesize", response_model=QueryResponse, status_code=status.HTTP_200_OK)
async def synthesize_documents(request: SynthesizeRequest):
    """
    Perform automated academic synthesis presets (Executive Summary, Methodology, Limitations, Comparison).
    """
    if not request.document_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one documentId must be provided for synthesis."
        )
    logger.info(f"Synthesize request across {len(request.document_ids)} documents with focus '{request.focus}'")
    return await rag_service.synthesize(request)

@router.delete("/documents/{document_id}", status_code=status.HTTP_200_OK)
async def delete_indexed_document(document_id: str):
    """
    Remove document chunks from vector index.
    """
    vector_store.delete_document(document_id)
    return {"message": f"Document {document_id} removed from vector store"}

@router.get("/health")
async def health_check():
    return {
        "status": "UP",
        "service": "ResearchDesk AI/RAG Engine",
        "indexed_documents_count": len(vector_store.docs),
        "total_chunks_indexed": sum(len(c) for c in vector_store.docs.values())
    }
