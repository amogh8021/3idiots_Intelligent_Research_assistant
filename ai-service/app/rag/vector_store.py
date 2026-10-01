import os
import json
import logging
from typing import List, Dict, Any, Optional, Set
import numpy as np
from pathlib import Path

logger = logging.getLogger(__name__)

class VectorStore:
    def __init__(self, persist_path: Optional[str] = None):
        self.persist_path = persist_path or os.getenv("VECTOR_STORE_PATH", "./data/vector_store.json")
        # Structure: document_id -> list of chunk records
        # chunk record: {"chunk_id": str, "document_id": str, "page_number": int, "chunk_index": int, "content": str, "embedding": list[float]}
        self.docs: Dict[str, List[Dict[str, Any]]] = {}
        self._load_from_disk()

    def add_document_chunks(self, document_id: str, chunks_with_embeddings: List[Dict[str, Any]]):
        """
        Store chunks and embeddings for a document. Replaces any existing chunks for this document.
        """
        self.docs[str(document_id)] = chunks_with_embeddings
        logger.info(f"Vector store indexed {len(chunks_with_embeddings)} chunks for document {document_id}")
        self._save_to_disk()

    def delete_document(self, document_id: str):
        """
        Remove a document and all its chunks from the vector store.
        """
        doc_id_str = str(document_id)
        if doc_id_str in self.docs:
            del self.docs[doc_id_str]
            self._save_to_disk()
            logger.info(f"Vector store deleted document {doc_id_str}")

    def search(
        self,
        document_ids: List[str],
        query_embedding: List[float],
        top_k: int = 5,
        min_similarity: float = 0.0
    ) -> List[Dict[str, Any]]:
        """
        Performs cosine similarity search filtered strictly to the specified document_ids.
        """
        if not document_ids or not query_embedding:
            return []

        doc_id_set: Set[str] = {str(d) for d in document_ids}
        query_vec = np.array(query_embedding, dtype=np.float32)
        q_norm = np.linalg.norm(query_vec)
        if q_norm > 1e-6:
            query_vec = query_vec / q_norm

        candidate_chunks = []

        for doc_id, chunks in self.docs.items():
            # STRICT FILTERING: Only include chunks from requested documents
            if doc_id not in doc_id_set:
                continue

            for chunk in chunks:
                emb = chunk.get("embedding")
                if not emb:
                    continue

                chunk_vec = np.array(emb, dtype=np.float32)
                c_norm = np.linalg.norm(chunk_vec)
                if c_norm > 1e-6:
                    chunk_vec = chunk_vec / c_norm

                similarity = float(np.dot(query_vec, chunk_vec))

                if similarity >= min_similarity:
                    candidate_chunks.append({
                        "document_id": chunk["document_id"],
                        "chunk_id": chunk["chunk_id"],
                        "page_number": chunk["page_number"],
                        "chunk_index": chunk["chunk_index"],
                        "content": chunk["content"],
                        "similarity": round(similarity, 4)
                    })

        # Sort descending by similarity
        candidate_chunks.sort(key=lambda x: x["similarity"], reverse=True)

        return candidate_chunks[:top_k]

    def _save_to_disk(self):
        try:
            path = Path(self.persist_path)
            path.parent.mkdir(parents=True, exist_ok=True)
            with open(path, "w", encoding="utf-8") as f:
                json.dump(self.docs, f, ensure_ascii=False)
        except Exception as e:
            logger.warning(f"Could not persist vector store to disk: {e}")

    def _load_from_disk(self):
        try:
            path = Path(self.persist_path)
            if path.exists():
                with open(path, "r", encoding="utf-8") as f:
                    self.docs = json.load(f)
                total_chunks = sum(len(c) for c in self.docs.values())
                logger.info(f"Loaded vector store with {len(self.docs)} documents and {total_chunks} chunks.")
        except Exception as e:
            logger.warning(f"Could not load vector store from disk: {e}")

vector_store = VectorStore()
