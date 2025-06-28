from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn
import os
from dotenv import load_dotenv

# Import our services
from services.pdf_processor import PDFProcessor
from services.vector_store import VectorStore

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Entaract API",
    description="AI Teaching Assistant - PDF Processing and Chat API",
    version="1.0.0"
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # Vite default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class SearchRequest(BaseModel):
    query: str
    limit: int = 5

class TeachingSessionRequest(BaseModel):
    document_id: str

class MessageRequest(BaseModel):
    session_id: str
    message: str

# Initialize services
pdf_processor = PDFProcessor()
vector_store = VectorStore()

@app.get("/")
async def root():
    return {"message": "Entaract API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "API is operational"}

@app.post("/api/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Upload and process a PDF file.
    Extracts text, chunks it, and stores in vector database.
    """
    try:
        # Validate file type
        if not file.filename or not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Read file content
        file_content = await file.read()
        
        # Process PDF
        text_content = pdf_processor.extract_text(file_content)
        
        if not text_content:
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")
        
        # Chunk the text
        chunks = pdf_processor.chunk_text(text_content)
        
        # Store in vector database
        filename = file.filename or "unknown_file.pdf"
        document_id = await vector_store.store_document(
            filename=filename,
            chunks=chunks
        )
        
        return {
            "success": True,
            "message": "PDF processed successfully",
            "document_id": document_id,
            "filename": filename,
            "chunks_count": len(chunks),
            "total_characters": len(text_content)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@app.get("/api/documents")
async def get_documents():
    """Get list of uploaded documents"""
    try:
        documents = await vector_store.get_all_documents()
        return {"documents": documents}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching documents: {str(e)}")

@app.get("/api/documents/{document_id}/chunks")
async def get_document_chunks(document_id: str):
    """Get all chunks for a specific document"""
    try:
        chunks = await vector_store.get_document_chunks(document_id)
        return {"document_id": document_id, "chunks": chunks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching document chunks: {str(e)}")

@app.delete("/api/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a document and all its chunks"""
    try:
        success = await vector_store.delete_document(document_id)
        if success:
            return {"success": True, "message": "Document deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Document not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")

@app.post("/api/search")
async def search_similar(request: SearchRequest):
    """Search for similar document chunks"""
    try:
        results = await vector_store.search_similar(request.query, request.limit)
        return {"query": request.query, "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

# Teaching session endpoints (placeholder for future implementation)
@app.post("/api/teaching/start")
async def start_teaching_session(request: TeachingSessionRequest):
    """Start a teaching session with a document"""
    try:
        # For now, just return a session ID
        # In the future, this will initialize Gemini and generate first questions
        session_id = f"session_{request.document_id}"
        return {
            "success": True,
            "session_id": session_id,
            "document_id": request.document_id,
            "message": "Teaching session started! Gemini integration coming soon..."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting teaching session: {str(e)}")

@app.post("/api/teaching/message")
async def send_message(request: MessageRequest):
    """Send a message in a teaching session"""
    try:
        # Placeholder for Gemini integration
        return {
            "success": True,
            "session_id": request.session_id,
            "user_message": request.message,
            "ai_response": "Gemini integration coming soon! This will be where the AI responds to your teaching.",
            "timestamp": "2024-01-01T00:00:00Z"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending message: {str(e)}")

@app.get("/api/teaching/session/{session_id}/history")
async def get_session_history(session_id: str):
    """Get conversation history for a teaching session"""
    try:
        # Placeholder for session history
        return {
            "session_id": session_id,
            "history": [],
            "message": "Session history feature coming soon!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching session history: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 