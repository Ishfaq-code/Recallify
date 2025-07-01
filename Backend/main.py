# Import required FastAPI and utility libraries
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import uvicorn
import os
from dotenv import load_dotenv
import shutil

# Import our custom services for PDF processing, embeddings, and AI functionality
from services.pdf_processor import extract_text_from_pdf, chunk_text
from services.embeddings import get_embeddings
from services.chroma_utils import add_to_db, get_all_documents, get_document_chunks, delete_document
from services.gemini_utils import generate_initial_question, generate_followup_question

# Load environment variables from .env file (API keys, configuration)
load_dotenv()

# Initialize FastAPI application with metadata
app = FastAPI(
    title="Recallify API",  # Updated from "Entaract" to match new repository name
    description="AI Teaching Assistant - PDF Processing and Learning API",
    version="1.0.0"
)

# Configure CORS middleware to allow frontend communication
# This enables the React frontend to make API calls from different ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # Vite and Create React App default ports
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Pydantic models for API request/response validation
class FollowupQuestionRequest(BaseModel):
    """Request model for generating follow-up questions in teaching sessions"""
    user_answer: str  # The student's answer to the previous question
    previous_question: str  # The AI's previous question for context
    conversation_history: list = []  # Optional conversation history for better context

# API Routes
# ===========

@app.get("/")
async def root():
    """
    Root endpoint - Basic health check and welcome message
    Returns: Dictionary with welcome message
    """
    return {"message": "Recallify API is running!"}

@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring and deployment systems
    Returns: Dictionary with status and operational message
    """
    return {
        "status": "healthy", 
        "message": "API is operational"
    }

@app.post("/api/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Upload and process a PDF file for teaching sessions
    
    Args:
        file: PDF file uploaded by the user
        
    Returns:
        Dictionary containing:
        - text: Extracted text from PDF
        - chunks: Text split into manageable chunks
        - embedded_chunks: Chunks with vector embeddings for AI processing
        
    Raises:
        HTTPException: If PDF processing fails or file is invalid
    """
    try:
        # Create temporary file for PDF processing
        temp_path = f"temp_{file.filename}"
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Extract text content from PDF using pdfminer
        text = extract_text_from_pdf(temp_path)
        
        # Clean up temporary file immediately after processing
        os.remove(temp_path)

        # Split text into smaller chunks for better AI processing
        chunks = chunk_text(text)
        
        # Generate vector embeddings for semantic search and AI understanding
        embedded_chunks = get_embeddings(chunks)
        
        # Store embeddings in ChromaDB vector database
        add_to_db(embedded_chunks)
        
        return {"text": text, "chunks": chunks, "embedded_chunks": embedded_chunks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

@app.get("/api/documents")
async def get_documents():
    """
    Retrieve list of all uploaded documents from the vector database
    
    Returns:
        Dictionary containing list of documents with metadata
        
    Raises:
        HTTPException: If database query fails
    """
    try:
        documents = get_all_documents()
        return {"documents": documents}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching documents: {str(e)}")

@app.get("/api/documents/{document_id}/chunks")
async def get_document_chunks_route(document_id: str):
    """
    Retrieve all text chunks for a specific document
    
    Args:
        document_id: Unique identifier for the document
        
    Returns:
        Dictionary containing document chunks and metadata
        
    Raises:
        HTTPException: If document not found or database error
    """
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
    """
    Delete a document and all its associated data from the database
    
    Args:
        document_id: Unique identifier for the document to delete
        
    Returns:
        Dictionary with success status and message
        
    Raises:
        HTTPException: If document not found or deletion fails
    """
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
    """
    Generate an initial question for starting a teaching session
    Uses Gemini AI to create contextual questions based on uploaded document content
    
    Returns:
        Dictionary containing the generated question
        
    Raises:
        HTTPException: If AI service fails or no content available
    """
    try:
        question = generate_initial_question()
        return {"question": question}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating question: {str(e)}")

@app.post("/api/gemini/followup-question")
async def generate_followup(request: FollowupQuestionRequest):
    """
    Generate a contextual follow-up question based on the user's previous answer
    This creates an interactive teaching session where AI acts as a curious student
    
    Args:
        request: Contains user's answer, previous question, and conversation history
        
    Returns:
        Dictionary containing the generated follow-up question
        
    Raises:
        HTTPException: If AI service fails or request is invalid
    """
    try:
        question = generate_followup_question(
            user_answer=request.user_answer,
            previous_question=request.previous_question,
            conversation_history=request.conversation_history
        )
        return {"question": question}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating follow-up question: {str(e)}")

# Application entry point
if __name__ == "__main__":
    # Start the FastAPI server with uvicorn
    # This allows running the app directly with: python main.py
    uvicorn.run(app, host="0.0.0.0", port=8000) 