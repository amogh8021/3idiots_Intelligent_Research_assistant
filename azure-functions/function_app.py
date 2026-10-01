import logging
import os
import json
import httpx
import azure.functions as func

app = func.FunctionApp()

AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://localhost:8000")

@app.blob_trigger(
    arg_name="myblob",
    path="researchdesk-docs/{name}",
    connection="AzureWebJobsStorage"
)
def process_uploaded_research_pdf(myblob: func.InputStream):
    """
    Azure Function Blob Trigger:
    Fires when a research PDF is uploaded to Azure Blob Storage container 'researchdesk-docs'.
    Calls the ResearchDesk AI/RAG service to index passages, generate embeddings, and update document status.
    """
    blob_name = myblob.name
    blob_size = myblob.length
    logging.info(f"Azure Function processed blob: {blob_name}, Size: {blob_size} bytes")

    # Extract document ID from blob name format: {documentId}-{safeFilename}
    parts = blob_name.split("/")[-1].split("-", 1)
    document_id = parts[0] if len(parts) > 0 else "unknown-doc"

    try:
        # Forward indexing request to AI/RAG service
        index_payload = {
            "documentId": document_id,
            "blobName": blob_name.split("/")[-1]
        }

        with httpx.Client(timeout=60.0) as client:
            response = client.post(
                f"{AI_SERVICE_URL}/ai/index",
                json=index_payload
            )
            logging.info(f"AI indexing service response [{response.status_code}]: {response.text}")

    except Exception as ex:
        logging.error(f"Error triggering AI indexing for blob {blob_name}: {ex}")
