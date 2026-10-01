import re
import logging
from typing import List, Dict, Any
from app.config import settings

logger = logging.getLogger(__name__)

def split_text_into_chunks(
    text: str,
    chunk_size: int = 500,
    chunk_overlap: int = 100
) -> List[str]:
    """
    Splits text into chunks respecting sentence boundaries where possible.
    """
    if not text:
        return []
        
    if len(text) <= chunk_size:
        return [text]

    # Split into paragraphs or sentences
    sentences = re.split(r'(?<=[.!?\n])\s+', text)
    chunks = []
    current_chunk = []
    current_length = 0

    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue

        sent_len = len(sentence)
        if current_length + sent_len > chunk_size and current_chunk:
            # Commit current chunk
            chunk_str = " ".join(current_chunk)
            chunks.append(chunk_str)

            # Slide window back for overlap
            overlap_len = 0
            overlap_chunk = []
            for s in reversed(current_chunk):
                if overlap_len + len(s) <= chunk_overlap:
                    overlap_chunk.insert(0, s)
                    overlap_len += len(s)
                else:
                    break
            
            current_chunk = overlap_chunk
            current_length = sum(len(s) for s in current_chunk)

        current_chunk.append(sentence)
        current_length += sent_len

    if current_chunk:
        chunks.append(" ".join(current_chunk))

    # Fallback if any chunk is still drastically too long (e.g. giant sentence)
    refined_chunks = []
    for c in chunks:
        if len(c) > chunk_size * 2:
            step = chunk_size - chunk_overlap
            for i in range(0, len(c), step):
                refined_chunks.append(c[i:i + chunk_size])
        else:
            refined_chunks.append(c)

    return refined_chunks

def create_document_chunks(
    document_id: str,
    pages_data: List[Dict[str, Any]],
    chunk_size: int = None,
    chunk_overlap: int = None
) -> List[Dict[str, Any]]:
    """
    Splits pages text into document chunks with full traceability.
    """
    c_size = chunk_size or settings.CHUNK_SIZE
    c_overlap = chunk_overlap or settings.CHUNK_OVERLAP

    all_chunks = []
    global_chunk_idx = 0

    for page in pages_data:
        page_num = page["page_number"]
        page_text = page["text"]

        page_chunks = split_text_into_chunks(page_text, chunk_size=c_size, chunk_overlap=c_overlap)

        for p_idx, chunk_text in enumerate(page_chunks):
            chunk_id = f"{document_id}_p{page_num}_c{global_chunk_idx}"
            all_chunks.append({
                "chunk_id": chunk_id,
                "document_id": document_id,
                "page_number": page_num,
                "chunk_index": global_chunk_idx,
                "content": chunk_text
            })
            global_chunk_idx += 1

    logger.info(f"Generated {len(all_chunks)} chunks for document {document_id}")
    return all_chunks
