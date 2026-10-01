# ResearchDesk — Intelligent Academic Research Assistant

ResearchDesk is a production-style, competition-ready AI Research Assistant backend and productivity workspace designed for researchers and student teams. It allows users to upload academic PDF documents, persist files in Azure Blob Storage, store structured metadata in PostgreSQL, index document embeddings, and query selected literature using an evidence-grounded AI/RAG engine powered by Hugging Face models.

---

## Complete Architecture Overview

ResearchDesk consists of:
1. **Spring Boot 3 Backend** (Java 21): Monolithic orchestration, PostgreSQL JPA entities, JWT authentication, and REST APIs.
2. **Python FastAPI AI / RAG Engine** (`ai-service`): Text extraction, chunking, Hugging Face embeddings, vector index with strict document isolation, and grounded LLM generation.
3. **Azure Functions Blob Trigger** (`azure-functions`): Event-driven asynchronous blob ingestion into the vector store.
4. **React + TypeScript + Tailwind CSS Frontend** (`frontend`): Interactive inquiry workspace, cross-document synthesis presets, and source citation explorer.

```
                               +---------------------------------------+
                               |          ResearchDesk Frontend         |
                               |   (React 18 + TypeScript + Tailwind)   |
                               +---------------------------------------+
                                                  |
                                      REST APIs / JSON / Multipart
                                                  |
                                                  v
                               +---------------------------------------+
                               |         ResearchDesk Backend          |
                               |      (Spring Boot 3.3.4, Java 21)     |
                               +---------------------------------------+
                                  /               |                  \
                                 /                |                   \
                     Spring Data JPA      BlobStorageService      RestClient
                               /                  |                     \
                              v                   v                      v
                   +--------------------+ +--------------------+ +--------------------+
                   |     PostgreSQL     | | Azure Blob Storage | |  Python AI / RAG   |
                   |   Metadata/History | |   PDF Container    | |    Service API     |
                   +--------------------+ +--------------------+ +--------------------+
                                                  |                        ^
                                            Blob Upload                    |
                                                  v                        |
                                        +--------------------+             |
                                        |   Azure Function   |-------------+
                                        |    Blob Trigger    |
                                        +--------------------+
```

### RAG Pipeline Flow
```
PDF Upload
  ↓
Azure Blob Storage
  ↓
Text Extraction (pypdf, page-preserving)
  ↓
Chunking (Sliding window with configurable size & overlap)
  ↓
Embeddings (Hugging Face MiniLM-L6-v2)
  ↓
Vector Index (Strict Document ID Filtering)
  ↓
Query Similarity Search (Cosine similarity)
  ↓
Hugging Face LLM Generation (Strict Grounding & Refusal Logic)
  ↓
Numbered Source Citations (Document ID, Page, Snippet)
  ↓
ResearchDesk UI Display
```

---

## Tech Stack

### Backend
- **Java 21 LTS** & **Spring Boot 3.3.4**
- **Maven**
- **Spring Web (MVC)** & **Spring Data JPA & Hibernate**
- **PostgreSQL 16** (Containerized on port `5433`)
- **Azure Blob Storage Java SDK (`azure-storage-blob` 12.28.0)** with automatic local disk fallback
- **Apache PDFBox 3.0.3** (Page count and PDF structure extraction)
- **Spring RestClient** (HTTP client for external AI service)
- **Bean Validation & BCrypt**
- **JUnit 5 & Mockito** (22 automated tests)

### AI / RAG Service (`ai-service`)
- **Python 3.14 / 3.11+**
- **FastAPI** & **Uvicorn**
- **pypdf** (Page-by-page text extraction)
- **NumPy** & **Hugging Face Inference API** (`sentence-transformers/all-MiniLM-L6-v2`, `mistralai/Mistral-7B-Instruct-v0.3`)
- **Vector Index** with strict multi-document filtering and persistent storage
- **Pytest** test suite (`ai-service/tests/test_rag.py`)

### Serverless Event Processing (`azure-functions`)
- **Azure Functions Python v2 Model** (`@app.blob_trigger`)
- Automatically indexes new PDF blobs uploaded to `researchdesk-docs` container.

### Frontend
- **React 18**, **TypeScript 5**, **Vite 5**
- **Tailwind CSS 3** (Academic minimal theme)
- **React Router 6**, **Axios**, **Lucide React**

---

## Quickstart Guide

### 1. Database Setup (Docker)

Start the local PostgreSQL container on port `5433`:

```bash
docker-compose up -d
```

### 2. Run the AI / RAG Service

```bash
cd ai-service
# Activate venv:
source venv/bin/activate
# Run tests:
PYTHONPATH=. pytest tests/
# Start server on http://localhost:8000:
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Run the Spring Boot Backend

```bash
cd backend

# Run the 22 automated tests:
mvn test

# Run the backend application:
mvn spring-boot:run
```

The Spring Boot backend will start on **`http://localhost:8080`**.

### 4. Run the React Frontend

```bash
cd frontend

# Install dependencies:
npm install

# Run Vite dev server:
npm run dev
```

The frontend will be live at **`http://localhost:5173`**.

---

## Environment Variables

Copy `.env.example` and set custom values if connecting to cloud infrastructure:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `8080` | Spring Boot server port |
| `DATABASE_URL` | `jdbc:postgresql://localhost:5433/researchdesk` | PostgreSQL JDBC Connection String |
| `DATABASE_USERNAME` | `researchdesk` | Database username |
| `DATABASE_PASSWORD` | `researchdesk` | Database password |
| `AZURE_STORAGE_CONNECTION_STRING` | *(empty)* | Azure Blob Storage connection string (leave empty for local fallback) |
| `AZURE_STORAGE_CONTAINER_NAME` | `researchdesk-docs` | Private container name for PDFs |
| `AI_SERVICE_URL` | `http://localhost:8000` | External AI / RAG microservice endpoint |
| `HF_API_TOKEN` | *(empty)* | Hugging Face API Token (optional, uses local semantic synthesis if omitted) |
| `HF_EMBEDDING_MODEL` | `sentence-transformers/all-MiniLM-L6-v2` | Embedding model |
| `HF_GENERATION_MODEL` | `mistralai/Mistral-7B-Instruct-v0.3` | Grounded generation LLM |
| `TOP_K` | `5` | Retrieved passages per query |
| `SIMILARITY_THRESHOLD` | `0.25` | Cosine similarity cutoff |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed CORS origins |

---

## REST API Specification

### Authentication API
- `POST /api/auth/register`: Create new user account with BCrypt password hashing.
- `POST /api/auth/login`: Authenticate and receive JWT bearer token.
- `GET /api/auth/me`: Fetch authenticated user profile.

### Documents API
- `POST /api/documents`: Multipart PDF upload -> saves to storage -> triggers AI indexing -> status `READY`.
- `POST /api/documents/seed-samples`: 1-click loading of seminal papers (*Attention Is All You Need*, *RAG*, *ResNet*).
- `GET /api/documents`: List user's documents with status, file size, and page count.
- `GET /api/documents/{id}`: Fetch single document metadata.
- `DELETE /api/documents/{id}`: Delete metadata, storage blob, and vector store embeddings.
- `GET /api/documents/stats`: Total, ready, processing docs, and queries asked.

### Research / Query API
- `POST /api/research/ask`: Ask evidence-grounded questions across selected `documentIds`.
- `POST /api/research/synthesize`: Cross-document academic presets (`executive`, `methodology`, `limitations`, `comparison`).
- `GET /api/research/history`: Audit log of research inquiries with answers and timestamps.

### AI Service Direct Endpoints
- `POST /ai/index`: Chunk, embed, and index a PDF document.
- `POST /ai/query`: Similarity search with strict `documentIds` filtering & grounded LLM generation.
- `POST /ai/synthesize`: Cross-document synthesis matrix.
- `DELETE /ai/documents/{documentId}`: Purge document vectors from index.
- `GET /ai/health`: Real-time indexing statistics and service status.

---

## Automated Verification

Run all test suites:

```bash
# 1. Backend tests (22 test cases)
cd backend && mvn test

# 2. AI Service tests (Chunking, Strict Vector Isolation, RAG Indexing, Grounding Refusals)
cd ../ai-service && PYTHONPATH=. pytest tests/

# 3. Frontend compilation
cd ../frontend && npm run build
```
