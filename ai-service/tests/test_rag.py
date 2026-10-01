import pytest
import asyncio
from app.rag.chunker import split_text_into_chunks, create_document_chunks
from app.rag.embeddings import embedding_service
from app.rag.vector_store import VectorStore
from app.rag.generator import generation_service
from app.services.rag_service import rag_service
from app.models.schemas import IndexRequest, QueryRequest

@pytest.mark.asyncio
async def test_chunking():
    sample_text = (
        "Retrieval-Augmented Generation (RAG) is an AI framework for improving the quality of LLM responses. "
        "It grounds the model on external sources of knowledge to supplement the model's internal representation. "
        "Implementing RAG in an academic research assistant requires high precision and strict document isolation. "
        "Page numbers and citations must be preserved accurately."
    )
    pages = [{"page_number": 1, "text": sample_text}]
    chunks = create_document_chunks("doc-1", pages, chunk_size=150, chunk_overlap=30)
    
    assert len(chunks) > 0
    assert chunks[0]["document_id"] == "doc-1"
    assert chunks[0]["page_number"] == 1
    assert "chunk_id" in chunks[0]

@pytest.mark.asyncio
async def test_vector_store_strict_isolation():
    vs = VectorStore(persist_path="./tests_vector_store.json")
    
    # Doc 1: Physics
    emb1 = await embedding_service.get_embeddings(["Quantum entanglement occurs when pairs of particles interact."])
    vs.add_document_chunks("doc-physics", [{
        "chunk_id": "c1",
        "document_id": "doc-physics",
        "page_number": 1,
        "chunk_index": 0,
        "content": "Quantum entanglement occurs when pairs of particles interact.",
        "embedding": emb1[0]
    }])
    
    # Doc 2: Biology
    emb2 = await embedding_service.get_embeddings(["Photosynthesis is used by plants to convert light energy into chemical energy."])
    vs.add_document_chunks("doc-biology", [{
        "chunk_id": "c2",
        "document_id": "doc-biology",
        "page_number": 1,
        "chunk_index": 0,
        "content": "Photosynthesis is used by plants to convert light energy into chemical energy.",
        "embedding": emb2[0]
    }])
    
    # Query for physics with only doc-physics selected
    q_emb = await embedding_service.get_query_embedding("What is quantum entanglement?")
    results = vs.search(document_ids=["doc-physics"], query_embedding=q_emb, top_k=5)
    
    assert len(results) == 1
    assert results[0]["document_id"] == "doc-physics"
    
    # Query with only doc-biology selected: should NEVER return physics chunk
    results_bio = vs.search(document_ids=["doc-biology"], query_embedding=q_emb, top_k=5)
    for r in results_bio:
        assert r["document_id"] == "doc-biology"
        assert "entanglement" not in r["content"]

@pytest.mark.asyncio
async def test_end_to_end_indexing_and_query():
    # Index document with direct text content
    index_req = IndexRequest(
        document_id="test-paper-101",
        text_content="Transformer models use self-attention mechanisms to weigh the significance of each part of the input data. The attention mechanism was introduced by Vaswani et al. in 2017."
    )
    
    index_res = await rag_service.index_document(index_req)
    assert index_res.status == "READY"
    assert index_res.total_chunks >= 1
    
    # Query the indexed paper
    query_req = QueryRequest(
        document_ids=["test-paper-101"],
        question="What mechanisms do transformer models use?"
    )
    
    query_res = await rag_service.query(query_req)
    assert query_res.grounded is True
    assert len(query_res.sources) >= 1
    assert query_res.sources[0].document_id == "test-paper-101"
    assert query_res.sources[0].page == 1
    assert "self-attention" in query_res.answer or "attention" in query_res.sources[0].snippet

@pytest.mark.asyncio
async def test_empty_or_unrelated_query_refusal():
    # Query for a document that doesn't exist
    query_req = QueryRequest(
        document_ids=["non-existent-doc"],
        question="What is the speed of light?"
    )
    query_res = await rag_service.query(query_req)
    assert query_res.grounded is False
    assert "could not find sufficient evidence" in query_res.answer.lower()
    assert len(query_res.sources) == 0
