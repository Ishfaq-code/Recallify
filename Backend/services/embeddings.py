# Text Embedding Service
# Generates vector embeddings using Google's Gemini API for semantic search and AI understanding
# These embeddings enable the AI to understand document content contextually

import os
from dotenv import load_dotenv

from google import genai
from google.genai import types



load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
client = genai.Client(api_key=GOOGLE_API_KEY)


def embed_text(chunk):
    """
    Generate vector embedding for a single text chunk using Gemini's embedding model
    
    Args:
        chunk (str): Text chunk to convert into vector representation
        
    Returns:
        list: Vector embedding as a list of float values
              (typically 768 or 1024 dimensions depending on model)
        
    Raises:
        Exception: If embedding generation fails or API error occurs
        
    Technical Details:
        - Uses Gemini's latest embedding model optimized for document retrieval
        - Task type set to RETRIEVAL_DOCUMENT for optimal performance with academic content
        - Returns dense vector representation that captures semantic meaning
    """
    # Model configuration - using experimental model for better performance
    EMBEDDING_MODEL_ID = "models/gemini-embedding-exp-03-07"
    TASK_TYPE_ID = "RETRIEVAL_DOCUMENT"  # Optimized for document search and retrieval
    
    # Call Gemini API to generate embedding
    response = client.models.embed_content(
        model=EMBEDDING_MODEL_ID,
        contents=chunk,
        config=types.EmbedContentConfig(task_type=TASK_TYPE_ID)
    )

    # Extract embedding values from response
    if response.embeddings and len(response.embeddings) > 0:
        return response.embeddings[0].values
    else:
        raise Exception(f"Failed to get embeddings: {response}")



def get_embeddings(chunked_text):
    """
    Process multiple text chunks and generate embeddings for each
    
    Args:
        chunked_text (list): List of text chunks from PDF processing
        
    Returns:
        list: List of dictionaries containing:
              - id: Unique identifier for the chunk
              - text: Original text content
              - embedding: Vector representation of the text
              
    Note:
        This function processes chunks sequentially. For large documents,
        consider implementing batch processing or async calls for better performance.
    """
    embeddings = []
    
    # Process each chunk individually
    for i, chunk in enumerate(chunked_text):
        # Generate embedding for this chunk
        embedded_data = embed_text(chunk)
        
        # Store chunk with its metadata and embedding
        embeddings.append({
            "id": f"chunk_{i}",          # Sequential ID for easy tracking
            "text": chunk,               # Original text for reference and display
            "embedding": embedded_data   # Vector representation for similarity search
        })
    
    return embeddings