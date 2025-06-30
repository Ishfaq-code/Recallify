from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import uvicorn
import os
from dotenv import load_dotenv
import shutil

# Import our services
from services.pdf_processor import extract_text_from_pdf, chunk_text
from services.embeddings import get_embeddings
from services.chroma_utils import add_to_db, get_all_documents, get_document_chunks, delete_document
from services.gemini_utils import generate_initial_question, generate_followup_question
# Load environment variables
load_dotenv()

app = FastAPI(
    title="Entaract API",
    description="AI Teaching Assistant - PDF Processing API",
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

# Pydantic models for requests
class FollowupQuestionRequest(BaseModel):
    user_answer: str
    previous_question: str
    conversation_history: list = []

# Initialize services

@app.get("/")
async def root():
    return {"message": "Entaract API is running!"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "message": "API is operational"
    }

@app.post("/api/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    try:
        temp_path = f"temp_{file.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        text = extract_text_from_pdf(temp_path)
        os.remove(temp_path)

        chunks = chunk_text(text)
        embedded_chunks = get_embeddings(chunks)
        add_to_db(embedded_chunks)
        return {"text": text, "chunks": chunks, "embedded_chunks": embedded_chunks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@app.get("/api/documents")
async def get_documents():
    """Get list of all uploaded documents"""
    try:
        documents = get_all_documents()
        return {"documents": documents}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching documents: {str(e)}")

@app.get("/api/documents/{document_id}/chunks")
async def get_document_chunks_route(document_id: str):
    """Get chunks for a specific document"""
    try:
        chunks = get_document_chunks(document_id)
        if chunks:
            return chunks
        else:
            raise HTTPException(status_code=404, detail="Document not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching document chunks: {str(e)}")

@app.delete("/api/documents/{document_id}")
async def delete_document_route(document_id: str):
    """Delete a document by ID"""
    try:
        success = delete_document(document_id)
        if success:
            return {"success": True, "message": "Document deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Document not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")


@app.get("/api/gemini/generate-question")
async def generate_question():
    """Generate an initial question using Gemini AI"""
    try:
        question = generate_initial_question()
        return {"question": question}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating question: {str(e)}")

@app.post("/api/gemini/followup-question")
async def generate_followup(request: FollowupQuestionRequest):
    """Generate a follow-up question based on user's answer"""
    try:
        question = generate_followup_question(
            user_answer=request.user_answer,
            previous_question=request.previous_question,
            conversation_history=request.conversation_history
        )
        return {"question": question}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating follow-up question: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 