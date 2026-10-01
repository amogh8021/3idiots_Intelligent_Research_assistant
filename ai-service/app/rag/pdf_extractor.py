import io
import re
import logging
from typing import List, Dict, Any, Union
from pypdf import PdfReader

logger = logging.getLogger(__name__)

def clean_text(text: str) -> str:
    """Normalize whitespace and remove non-printable characters."""
    if not text:
        return ""
    # Replace weird unicode dashes and spaces
    text = text.replace("\u00a0", " ").replace("\u2013", "-").replace("\u2014", "-")
    # Collapse multiple whitespaces / newlines
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s*\n+", "\n\n", text)
    return text.strip()

def extract_text_from_pdf(source: Union[str, bytes, io.BytesIO]) -> List[Dict[str, Any]]:
    """
    Extract text page-by-page from a PDF path, bytes, or stream.
    Returns: List of dicts with 'page_number' (1-indexed) and 'text'.
    """
    pages_data = []
    
    try:
        if isinstance(source, bytes):
            stream = io.BytesIO(source)
            reader = PdfReader(stream)
        elif isinstance(source, io.BytesIO):
            reader = PdfReader(source)
        elif isinstance(source, str):
            reader = PdfReader(source)
        else:
            raise ValueError(f"Unsupported PDF source type: {type(source)}")

        total_pages = len(reader.pages)
        logger.info(f"Extracting text from PDF with {total_pages} pages")

        for idx, page in enumerate(reader.pages):
            page_num = idx + 1
            try:
                extracted = page.extract_text() or ""
                cleaned = clean_text(extracted)
                if cleaned:
                    pages_data.append({
                        "page_number": page_num,
                        "text": cleaned
                    })
                else:
                    logger.debug(f"Page {page_num} yielded empty text (may be image/diagram)")
            except Exception as e:
                logger.warning(f"Error extracting text from page {page_num}: {e}")

    except Exception as e:
        logger.error(f"Failed to read PDF document: {e}")
        raise RuntimeError(f"PDF extraction error: {e}")

    return pages_data
