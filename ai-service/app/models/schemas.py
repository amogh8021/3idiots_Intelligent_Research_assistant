from typing import List, Optional, Any
from pydantic import BaseModel, Field, ConfigDict

class IndexRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    document_id: str = Field(..., alias="documentId")
    blob_name: Optional[str] = Field(None, alias="blobName")
    file_path: Optional[str] = Field(None, alias="filePath")
    text_content: Optional[str] = Field(None, alias="textContent")
    file_bytes_base64: Optional[str] = Field(None, alias="fileBytesBase64")

class IndexResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    document_id: str = Field(..., alias="documentId")
    status: str
    total_pages: int = Field(0, alias="totalPages")
    total_chunks: int = Field(0, alias="totalChunks")
    message: str

class SourceItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    document_id: str = Field(..., alias="documentId")
    page: int
    chunk_id: str = Field(..., alias="chunkId")
    snippet: str
    similarity: Optional[float] = None

class QueryRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    document_ids: List[str] = Field(..., alias="documentIds")
    question: str
    top_k: Optional[int] = Field(None, alias="topK")

class QueryResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    answer: str
    sources: List[SourceItem] = []
    grounded: bool = True
    confidence: Optional[float] = None

class SynthesizeRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    document_ids: List[str] = Field(..., alias="documentIds")
    focus: str = "executive"  # 'executive' | 'methodology' | 'limitations' | 'comparison'

class ChunkMetadata(BaseModel):
    chunk_id: str
    document_id: str
    page_number: int
    chunk_index: int
    content: str
