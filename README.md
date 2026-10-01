# ResearchDesk

**An intelligent academic research assistant that lets you upload, index, and semantically query collections of research papers — with grounded, source-cited answers backed by a full RAG (Retrieval-Augmented Generation) pipeline.**

---

## Problem

Researchers, students, and professionals working across multiple papers face a common bottleneck: finding the precise passage that answers a specific question, comparing how different authors approach the same problem, or synthesising findings across ten different papers in an afternoon. Keyword search is insufficient. Reading everything repeatedly is impractical.

---

## Solution

ResearchDesk provides a focused workspace for literature synthesis:

1. Upload your research PDFs — they are stored securely in Azure Blob Storage.
2. A processing pipeline extracts the text, splits it into overlapping chunks, and generates semantic embeddings.
3. You pose a natural-language question. The system retrieves the most relevant passages via vector similarity search.
4. A Hugging Face language model generates a precise answer grounded *exclusively* in the retrieved evidence — no hallucinations, only citations.
5. Every answer is returned with **page-level source citations** so you can verify the evidence directly.

---

## Key Features

| Feature | Description |
|---|---|
| **PDF Upload** | Drag-and-drop or file-picker upload with progress feedback |
| **Azure Blob Storage** | PDFs stored durably in Azure with no local disk dependency |
| **Async Document Processing** | Text extraction → chunking → embedding happens post-upload |
| **Multi-Document Selection** | Query across one or many papers simultaneously |
| **Evidence-Grounded Q&A** | Answers cite only the retrieved passages — refuses to guess |
| **Page-Level Citations** | Every source returned with document name and page number |
| **Multi-Doc Synthesis** | Four preset modes: Executive Summary, Methodology Comparison, Consensus vs Divergence, Limitations & Gaps |
| **Research History** | Every query and its answer is persisted and browsable |
| **Authentication** | JWT-based login/registration with bcrypt password hashing |
| **Document Lifecycle** | Real status tracking: UPLOADING → PROCESSING → READY / FAILED |
| **Export to Markdown** | Download your research session as a formatted `.md` report |
| **Azure Functions** | Blob-triggered serverless function for async indexing (optional) |
| **Demo Access** | One-click demo login for evaluators |

---

## Architecture

```
Browser (React + Vite)
        │
        │  REST API (JWT Bearer)
        ▼
Spring Boot 3.3.4 (Java 21)
        │
        ├── PostgreSQL ──── document metadata, user accounts,
        │                   research history, question/answer records
        │
        ├── Azure Blob Storage ──── actual PDF files
        │                           named: {documentId}-{filename}.pdf
        │
        └── AI / RAG Service (FastAPI + Python)
                    │
                    ├── PDF text extraction (pypdf)
                    ├── Sentence chunking with overlap
                    ├── sentence-transformers embeddings (HuggingFace)
                    ├── In-memory cosine similarity vector store
                    └── Mistral-7B-Instruct via HuggingFace Inference API
                              │
                              └── Grounded answer + source passages
                                        │
                              ◄─────────┘
                    Spring Boot assembles final response
                              │
                    ◄─────────┘
              React renders answer + citations

Optional (serverless path):
        Azure Blob Storage
                │
                │ Blob trigger event
                ▼
        Azure Functions (Python)
                │
                └── Calls AI Service /ai/index
```

---

## RAG Pipeline

```
PDF Upload
    │
    ▼
Azure Blob Storage
    │
    ▼ (on index request)
Text Extraction (pypdf)
    │
    ▼
Sentence-aware chunking (500 chars, 100 overlap)
    │
    ▼
Embeddings (sentence-transformers/all-MiniLM-L6-v2)
    │
    ▼
In-memory vector store (cosine similarity)
    │
    ▼  (on query)
Semantic retrieval (top-K = 5 passages, threshold = 0.25)
    │
    ▼
Context block assembled
    │
    ▼
Hugging Face Inference API (Mistral-7B-Instruct-v0.3)
    │
    ▼
Grounded answer + source passage metadata
    │
    ▼
Spring Boot formats + persists + returns
    │
    ▼
React renders answer + page citations
```

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.3.1 | UI framework |
| TypeScript | 5.6 | Type safety |
| Vite | 5.4 | Build tool & dev server |
| Tailwind CSS | 3.4 | Utility-first styling |
| React Router | 6.26 | Client-side routing |
| Axios | 1.7 | HTTP client |
| Lucide React | 0.446 | Icon library |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Spring Boot | 3.3.4 | REST API framework |
| Java | 21 | Runtime |
| Spring Security | (via Boot) | JWT authentication |
| Spring Data JPA | (via Boot) | ORM / database access |
| Hibernate | (via Boot) | JPA implementation |
| Azure Storage SDK | 12.x | Blob upload/download/delete |
| jjwt | 0.12 | JWT token generation/validation |
| BCrypt | (via Spring) | Password hashing |

### Database
| Technology | Purpose |
|---|---|
| PostgreSQL | Users, documents, research history, Q&A records |

### Cloud & Infrastructure
| Service | Purpose |
|---|---|
| Azure Blob Storage | PDF file storage |
| Azure Functions | Optional blob-triggered async indexing |
| Application Insights | Observability (configured in azure-functions) |
| Azurite | Local Azure Storage emulator for development |

### AI & NLP
| Technology | Purpose |
|---|---|
| sentence-transformers/all-MiniLM-L6-v2 | Semantic embeddings |
| mistralai/Mistral-7B-Instruct-v0.3 | Answer generation |
| Hugging Face Inference API | Hosted model inference |
| FastAPI | Python AI service HTTP framework |
| uvicorn | ASGI server |
| pypdf | PDF text extraction |
| httpx | Async HTTP in Python |

### Testing
| Framework | Scope |
|---|---|
| JUnit 5 + Mockito | Spring Boot unit & integration tests |
| pytest | Python AI service tests |

---

## Project Structure

```
focused-curie/
├── frontend/                   # React + Vite + Tailwind SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── documents/      # DocumentTable, DocumentRow, UploadModal, StatusBadge, Search
│   │   │   ├── layout/         # Sidebar, Header, PageContainer, ProtectedRoute
│   │   │   └── research/       # AnswerPanel, DocumentSelector, QuestionInput, SourceCard, LoadingState
│   │   ├── context/
│   │   │   └── AuthContext.tsx # JWT auth state, login/register/logout
│   │   ├── pages/
│   │   │   ├── AuthPage.tsx    # Login + Register
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── DocumentsPage.tsx
│   │   │   ├── ResearchPage.tsx # Main workspace
│   │   │   ├── HistoryPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── services/           # api.ts, authService, documentService, researchService
│   │   └── types/              # TypeScript type definitions
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── backend/                    # Spring Boot 3 REST API
│   └── src/main/java/com/researchdesk/
│       ├── controller/         # AuthController, DocumentController, ResearchController
│       ├── service/            # AuthServiceImpl, DocumentServiceImpl, BlobStorageServiceImpl, AiServiceImpl, ResearchServiceImpl
│       ├── entity/             # User, Document, DocumentChunk, ResearchQuestion, ResearchAnswer
│       ├── repository/         # JPA repositories
│       ├── dto/                # Request/response DTOs
│       ├── config/             # CorsConfig, JwtTokenService, UserContextResolver
│       └── exception/          # Global exception handler + typed exceptions
│   └── src/main/resources/
│       ├── application.yml     # All config via environment variables
│       └── schema.sql          # Database schema
│
├── ai-service/                 # Python FastAPI RAG service
│   └── app/
│       ├── api/routes.py       # /ai/index, /ai/query, /health
│       ├── rag/
│       │   ├── pdf_extractor.py
│       │   ├── chunker.py
│       │   ├── embeddings.py
│       │   ├── vector_store.py
│       │   └── generator.py
│       ├── services/rag_service.py
│       ├── config.py           # Settings via environment variables
│       └── main.py
│   ├── requirements.txt
│   └── tests/test_rag.py
│
├── azure-functions/            # Python Azure Functions (blob trigger)
│   ├── function_app.py
│   ├── host.json
│   ├── requirements.txt
│   └── local.settings.json.example
│
├── docker-compose.yml          # PostgreSQL + Azurite local setup
├── .env.example                # Environment variable template
├── .gitignore
└── README.md
```

---

## API Documentation

All endpoints require `Authorization: Bearer <token>` except `/api/auth/*`.

### Authentication

#### POST `/api/auth/register`
Register a new user.
```json
// Request
{
  "name": "Alice Researcher",
  "email": "alice@university.edu",
  "password": "securepassword"
}

// Response 200
{
  "token": "eyJ...",
  "user": { "id": "...", "name": "Alice Researcher", "email": "alice@university.edu", "createdAt": "..." }
}
```

#### POST `/api/auth/login`
```json
// Request
{ "email": "alice@university.edu", "password": "securepassword" }

// Response 200
{ "token": "eyJ...", "user": { ... } }
```

#### GET `/api/auth/me`
Returns the currently authenticated user profile.

---

### Documents

#### GET `/api/documents`
Returns all documents belonging to the authenticated user.
```json
[
  {
    "id": "4710ef5f-...",
    "fileName": "attention_is_all_you_need.pdf",
    "status": "READY",
    "fileSize": 1048576,
    "pageCount": 15,
    "uploadedAt": "2024-01-15T10:30:00"
  }
]
```

#### POST `/api/documents`
Upload a PDF document (`multipart/form-data`, field name: `file`).
```json
// Response 201
{
  "id": "4710ef5f-...",
  "fileName": "paper.pdf",
  "status": "PROCESSING"
}
```

#### DELETE `/api/documents/{id}`
Delete a document and its blob from Azure Storage.

#### GET `/api/documents/stats`
```json
{
  "totalDocuments": 5,
  "readyDocuments": 4,
  "processingDocuments": 1,
  "questionsAsked": 12
}
```

#### POST `/api/documents/seed-samples`
Seeds 3 curated academic papers for demo purposes (downloads from public sources).

---

### Research

#### POST `/api/research/ask`
Ask a question across selected documents.
```json
// Request
{
  "documentIds": ["uuid-1", "uuid-2"],
  "question": "What are the key differences in methodology between these papers?"
}

// Response 200
{
  "answer": "Based on the provided research, the first paper employs...",
  "sources": [
    {
      "documentId": "uuid-1",
      "fileName": "attention_is_all_you_need.pdf",
      "page": 4,
      "snippet": "We use multi-head attention in three different ways..."
    }
  ]
}
```

#### POST `/api/research/synthesize`
Cross-document synthesis with preset modes.
```json
// Request
{
  "documentIds": ["uuid-1", "uuid-2"],
  "focus": "executive"   // "executive" | "methodology" | "comparison" | "limitations"
}
// Response: same shape as /ask
```

#### GET `/api/research/history`
Returns the authenticated user's past research queries with answers and sources.

---

## Environment Variables

### Backend (`backend/` or root `.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `AZURE_STORAGE_CONNECTION_STRING` | **Yes** | — | Full Azure Blob Storage connection string |
| `AZURE_STORAGE_CONTAINER_NAME` | No | `research-documents` | Blob container name |
| `DATABASE_URL` | No | `jdbc:postgresql://localhost:5433/researchdesk` | PostgreSQL JDBC URL |
| `DATABASE_USERNAME` | No | `researchdesk` | Database username |
| `DATABASE_PASSWORD` | No | `researchdesk` | Database password |
| `AI_SERVICE_URL` | No | `http://localhost:8000` | URL of the Python AI/RAG service |
| `AI_SERVICE_TIMEOUT` | No | `30` | AI service request timeout in seconds |
| `AI_FALLBACK_MOCK_ENABLED` | No | `true` | Return mock response if AI service unreachable |
| `PORT` | No | `8080` | Spring Boot server port |
| `MAX_FILE_SIZE` | No | `50MB` | Maximum upload file size |
| `FRONTEND_URL` | No | `http://localhost:5173` | CORS allowed origin(s) |

### AI Service (`ai-service/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `AZURE_STORAGE_CONNECTION_STRING` | **Yes** | — | Same as backend — used to download PDFs for indexing |
| `AZURE_STORAGE_CONTAINER_NAME` | No | `research-documents` | Blob container name |
| `HF_API_TOKEN` | No | `""` | Hugging Face API token (required for private models or rate limits) |
| `HF_EMBEDDING_MODEL` | No | `sentence-transformers/all-MiniLM-L6-v2` | Embedding model |
| `HF_GENERATION_MODEL` | No | `mistralai/Mistral-7B-Instruct-v0.3` | Generation model |
| `CHUNK_SIZE` | No | `500` | Characters per chunk |
| `CHUNK_OVERLAP` | No | `100` | Overlap between consecutive chunks |
| `TOP_K` | No | `5` | Number of passages to retrieve per query |
| `SIMILARITY_THRESHOLD` | No | `0.25` | Minimum cosine similarity for retrieval |

### Frontend (`frontend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | No | `http://localhost:8080` | Spring Boot backend URL |
| `VITE_AZURE_CONTAINER_NAME` | No | `research-documents` | Display-only container name in Settings UI |

> **Security**: Never commit `.env` files. Copy `.env.example` to `.env` and fill in secrets locally.

---

## Local Development

### Prerequisites

- Java 21+
- Maven 3.9+
- Node.js 20+ and npm
- Python 3.11+
- Docker (for PostgreSQL and optional Azurite)

### 1. Clone the repository

```bash
git clone https://github.com/amogh8021/3idiots_Intelligent_Research_assistant.git
cd 3idiots_Intelligent_Research_assistant
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and set AZURE_STORAGE_CONNECTION_STRING
```

Also set the same connection string for the AI service:
```bash
cp .env.example ai-service/.env
# Edit ai-service/.env and set AZURE_STORAGE_CONNECTION_STRING
```

### 3. Start PostgreSQL (and optional Azurite)

```bash
# Using docker-compose (PostgreSQL on port 5433):
docker compose up postgres -d

# Or manually:
docker run -d --name researchdesk-postgres \
  -e POSTGRES_DB=researchdesk \
  -e POSTGRES_USER=researchdesk \
  -e POSTGRES_PASSWORD=researchdesk \
  -p 5433:5432 \
  postgres:16-alpine

# Optional: local Azure Storage emulator (instead of real Azure)
docker run -d --name azurite \
  -p 10000:10000 \
  mcr.microsoft.com/azure-storage/azurite:latest \
  azurite-blob --blobHost 0.0.0.0 --skipApiVersionCheck
```

### 4. Start the Backend

```bash
cd backend
AZURE_STORAGE_CONNECTION_STRING="<your-connection-string>" mvn spring-boot:run
```

The backend starts on `http://localhost:8080`. On first startup it will:
- Create all database tables via `schema.sql`
- Create the Azure Blob Storage container if it doesn't exist
- Seed a demo user (`researcher@researchdesk.ai` / `password123`)

### 5. Start the AI Service

```bash
cd ai-service
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The AI service starts on `http://localhost:8000`. Health check: `GET http://localhost:8000/health`.

### 6. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on `http://localhost:5173`.

### 7. Open the application

Navigate to `http://localhost:5173`.

Use the **"1-Click Demo Access"** button on the login page, or register your own account.

---

## Docker

A `docker-compose.yml` is provided for local infrastructure dependencies:

```bash
# Start PostgreSQL + Azurite
docker compose up -d

# Stop and remove
docker compose down
```

The application services (Spring Boot, Python, React) are run directly for development rather than containerised, to allow hot-reload.

---

## Azure Setup

### Storage Account

1. Create an Azure Storage Account in the Azure Portal (or via CLI).
2. Create a blob container named `research-documents` (or your chosen name).
3. Copy the **connection string** from `Settings → Access Keys`.
4. Set `AZURE_STORAGE_CONNECTION_STRING` in your backend and AI service `.env`.

```bash
# Azure CLI example
az storage account create --name research2 --resource-group myRG --location eastus --sku Standard_LRS
az storage container create --name research-documents --account-name research2
az storage account show-connection-string --name research2 --resource-group myRG
```

### Azure Functions (Optional)

The `azure-functions/` directory contains a Python blob-triggered function that fires when a PDF lands in the container and triggers the AI indexing pipeline asynchronously.

```bash
cd azure-functions
pip install azure-functions httpx
func start  # requires Azure Functions Core Tools
```

Set `AzureWebJobsStorage` in `local.settings.json` to your storage connection string.

### Application Insights

Configured in `azure-functions/host.json`. If you have an Application Insights resource, add its instrumentation key to the Functions environment.

---

## Hugging Face Setup

The AI service uses Hugging Face's Inference API for:

- **Embeddings**: `sentence-transformers/all-MiniLM-L6-v2` (free tier available)
- **Generation**: `mistralai/Mistral-7B-Instruct-v0.3` (requires Hugging Face account + model acceptance)

```bash
# Optional: set HF_API_TOKEN for higher rate limits or private models
export HF_API_TOKEN=hf_xxxxxxxxxxxxxxxxxxxx
```

If no token is set or the Hugging Face API is unavailable, the AI service falls back to a local offline embedding mode using `numpy`-based cosine similarity, but generation will be limited.

---

## Testing

### Backend (Spring Boot)

```bash
cd backend
mvn test
```

Tests cover: `AuthController`, `DocumentController`, `ResearchController`, `DocumentService`, `ResearchService`.

### AI Service (Python)

```bash
cd ai-service
source venv/bin/activate
PYTHONPATH=. pytest tests/ -v
```

### Build verification

```bash
# Frontend TypeScript + build
cd frontend
npm run build
```

---

## Security

- **No secrets in source code** — all credentials are loaded from environment variables.
- **`.env` files are git-ignored** — never committed.
- **Azure connection strings** — stored server-side only; the frontend never receives blob credentials.
- **JWT authentication** — stateless tokens signed with a server-side secret.
- **BCrypt password hashing** — passwords are never stored in plaintext.
- **CORS** — restricted to configured `FRONTEND_URL` origins.
- **File validation** — only `.pdf` files up to 50 MB are accepted.

---

## Troubleshooting

### Backend won't start

```
Error: AZURE_STORAGE_CONNECTION_STRING is not set
```
Set the `AZURE_STORAGE_CONNECTION_STRING` environment variable. See [Azure Setup](#azure-setup).

```
Error: Could not connect to PostgreSQL
```
Ensure PostgreSQL is running on port 5433 (or configure `DATABASE_URL`).

### AI service unavailable

If the Python service is down, Spring Boot returns a fallback mock response (configurable via `AI_FALLBACK_MOCK_ENABLED=false` to disable).

Check the AI service is running:
```bash
curl http://localhost:8000/health
```

### Frontend can't reach the API

Check `VITE_API_BASE_URL` in your frontend environment. Default is `http://localhost:8080`. Make sure CORS is configured to allow your frontend origin.

### Document stuck in PROCESSING

1. Check AI service logs for indexing errors.
2. Verify `AZURE_STORAGE_CONNECTION_STRING` is correctly set in **both** backend and AI service.
3. Check the blob exists in your Azure container.

### Azure storage errors

```
BlobStorageException: Failed to upload blob
```
Verify the connection string is valid and the container exists. For Azurite, ensure it is running on port 10000.

---

## Demo Flow

1. Open `http://localhost:5173`
2. Click **"1-Click Demo Researcher Access"** (or create an account)
3. Go to **Documents** → click **"Load Sample Papers"** to seed 3 ML research papers
4. Wait for all documents to show **Ready** status (auto-refresh every 8 seconds)
5. Go to **Research** — the ready documents are pre-selected
6. In the **Interactive Inquiry** tab, try: *"What are the main contributions of these papers?"*
7. Observe the grounded answer with **page-level source citations**
8. Switch to **Multi-Doc Synthesis** → click **"Executive Summary"**
9. View the synthesized findings across all selected papers
10. Check **History** to browse past queries and revisit answers

---

## Future Improvements

The following are ideas for future development — **not currently implemented**:

- Persistent vector store (e.g. Pinecone, pgvector, Chroma) to survive service restarts
- Fine-grained per-user document isolation in the vector store
- Streaming responses for long-running generation
- PDF annotation / highlight export
- Collection / folder organisation for documents
- Batch export of research sessions (PDF, Word)
- Support for non-PDF formats (DOCX, EPUB)
- Citation graph visualisation
- Collaborative workspaces (multi-user per document set)
- Scheduled document re-indexing on model updates

---

## License

This project was built for the **3 Idiots** team submission — Intelligent Research Assistant.

---

*Built with Spring Boot · React · Python FastAPI · Azure Blob Storage · Hugging Face*
