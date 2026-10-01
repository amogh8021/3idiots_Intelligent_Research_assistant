import math
import hashlib
import logging
import re
from typing import List, Union
import httpx
import numpy as np
from app.config import settings

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        self.hf_token = settings.HF_API_TOKEN
        self.model_name = settings.HF_EMBEDDING_MODEL
        # 384 dimensional space (matching standard MiniLM-L6-v2)
        self.embedding_dim = 384

    async def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate dense vector embeddings for a list of texts.
        Attempts Hugging Face API first if token is configured; falls back to local semantic vectorizer.
        """
        if not texts:
            return []

        if self.hf_token and self.hf_token.strip():
            try:
                embeddings = await self._fetch_hf_embeddings(texts)
                if embeddings and len(embeddings) == len(texts):
                    return embeddings
            except Exception as e:
                logger.warning(f"Hugging Face embedding API error: {e}. Falling back to local semantic vectorizer.")

        # Local fallback vectorizer
        return [self._generate_local_embedding(t) for t in texts]

    async def get_query_embedding(self, query: str) -> List[float]:
        """
        Generate dense vector embedding for a single query string.
        """
        results = await self.get_embeddings([query])
        return results[0] if results else [0.0] * self.embedding_dim

    async def _fetch_hf_embeddings(self, texts: List[str]) -> List[List[float]]:
        # Hugging Face Feature Extraction endpoint
        url = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{self.model_name}"
        headers = {
            "Authorization": f"Bearer {self.hf_token}",
            "Content-Type": "application/json"
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                headers=headers,
                json={"inputs": texts, "options": {"wait_for_model": True}}
            )
            
            if response.status_code == 200:
                data = response.json()
                # If output is 3D (batch, seq_len, hidden_dim), average pool across tokens
                if isinstance(data, list) and len(data) > 0 and isinstance(data[0], list):
                    if isinstance(data[0][0], list):
                        # 3D: Mean pooling
                        pooled = []
                        for seq in data:
                            arr = np.array(seq)
                            mean_vec = np.mean(arr, axis=0).tolist()
                            pooled.append(mean_vec)
                        return pooled
                    else:
                        # 2D: Already pooled vectors
                        return data
            else:
                logger.warning(f"HF API returned status {response.status_code}: {response.text}")
                raise RuntimeError(f"HF API status {response.status_code}")

    def _generate_local_embedding(self, text: str) -> List[float]:
        """
        Deterministic local semantic hashing + subword TF-IDF n-gram vectorizer.
        Generates normalized 384-dimensional dense vectors for semantic cosine similarity.
        """
        cleaned = text.lower().strip()
        words = re.findall(r'\b[a-z0-9_-]{2,}\b', cleaned)
        
        vec = np.zeros(self.embedding_dim, dtype=np.float32)
        
        if not words:
            # Avoid divide-by-zero on empty input
            vec[0] = 1.0
            return vec.tolist()

        # Word level + Character 3-gram hashing
        for word in words:
            # Word hash
            h_word = int(hashlib.md5(word.encode('utf-8')).hexdigest(), 16) % self.embedding_dim
            # Weight rare/longer domain terms more heavily
            weight = 1.0 + math.log(1.0 + len(word))
            vec[h_word] += weight

            # Character tri-grams for subword semantics
            for i in range(len(word) - 2):
                ngram = word[i:i+3]
                h_ngram = int(hashlib.sha256(ngram.encode('utf-8')).hexdigest(), 16) % self.embedding_dim
                vec[h_ngram] += 0.35

        # L2 Normalize
        norm = np.linalg.norm(vec)
        if norm > 1e-6:
            vec = vec / norm
        else:
            vec[0] = 1.0

        return vec.tolist()

embedding_service = EmbeddingService()
