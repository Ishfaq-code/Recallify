# ChromaDB Vector Database Utilities
# Handles storage, retrieval, and management of document embeddings in ChromaDB
# ChromaDB is optimized for vector similarity search and semantic retrieval

import chromadb
from chromadb.config import Settings

# Initialize ChromaDB client and create/get collection for lecture notes
# Collections in ChromaDB are like tables in traditional databases
client = chromadb.Client()
collection = client.get_or_create_collection(name="lecture_notes")


def clear_collection():
    """
    Remove all documents from the ChromaDB collection
    
    This is useful for:
    - Starting fresh with new documents
    - Clearing outdated content
    - Resetting the knowledge base
    
    Returns:
        bool: True if clearing successful, False otherwise
        
    Note:
        This operation is irreversible. All stored embeddings and metadata will be lost.
    """
    try:
        # Retrieve all document IDs currently in the collection
        result = collection.get()
        
        if result["ids"]:
            # Delete all documents by their IDs
            collection.delete(ids=result["ids"])
            print(f"Cleared {len(result['ids'])} documents from collection")
        
        return True
    except Exception as e:
        print(f"Error clearing collection: {e}")
        return False


def add_to_db(embedding_list, clear_first=True):
    """
    Add document embeddings to the ChromaDB collection
    
    Args:
        embedding_list (list): List of embedding dictionaries containing:
                              - id: Unique identifier
                              - text: Original text content
                              - embedding: Vector representation
        clear_first (bool): Whether to clear existing documents before adding new ones
                           Default: True (replaces all content)
    
    Process:
        1. Optionally clear existing content
        2. Add each embedding with its text and metadata
        3. Store in vector database for similarity search
        
    Note:
        ChromaDB automatically handles vector indexing for fast similarity queries
    """
    # Clear existing documents if requested (default behavior)
    if clear_first:
        clear_collection()
    
    # Add each embedding to the collection
    for embedding_data in embedding_list:
        collection.add(
            documents=[embedding_data["text"]],      # Original text for retrieval
            embeddings=[embedding_data["embedding"]], # Vector for similarity search
            ids=[embedding_data["id"]],              # Unique identifier
            metadatas=[{"source": "lecture_pdf"}]    # Metadata for filtering/organization
        )


def get_notes(limit: int):
    """
    Retrieve a limited number of documents from the collection for AI context
    
    Args:
        limit (int): Maximum number of documents to retrieve
        
    Returns:
        str: Combined text from retrieved documents, joined with double line breaks
             for clear separation between different document chunks
    
    Usage:
        This function is primarily used to provide context to the AI model
        when generating questions or responses during teaching sessions.
    """
    # Fetch documents from ChromaDB with specified limit
    initial_docs = collection.get(include=["documents"], limit=limit)
    
    # Extract document text (handle case where no documents exist)
    documents = initial_docs["documents"] or []
    
    # Combine all documents into a single string with clear separators
    notes_summary = "\n\n".join(documents)

    return notes_summary


def get_all_documents():
    """
    Retrieve all documents with their metadata for frontend display
    
    Returns:
        list: List of dictionaries containing:
              - document_id: Unique identifier
              - filename: Original file name (if available)
              - source: Document source information
              - content_preview: First 100 characters of content for preview
              
    Note:
        This function is used by the frontend to display available documents
        and allow users to select specific documents for teaching sessions.
    """
    # Retrieve all documents with their metadata
    result = collection.get(include=["documents", "metadatas"])
    documents = []
    
    # Process results if documents exist
    if result["documents"] and result["ids"]:
        for i, doc in enumerate(result["documents"]):
            # Get metadata for this document (with fallbacks for missing data)
            metadata = result["metadatas"][i] if result["metadatas"] and i < len(result["metadatas"]) else {}
            
            # Create document summary for frontend
            documents.append({
                "document_id": result["ids"][i],
                "filename": metadata.get("filename", "unknown"),
                "source": metadata.get("source", "unknown"),
                "content_preview": doc[:100] + "..." if len(doc) > 100 else doc
            })
    
    return documents


def get_document_chunks(document_id: str):
    """
    Retrieve all content for a specific document by its ID
    
    Args:
        document_id (str): Unique identifier of the document to retrieve
        
    Returns:
        dict or None: Dictionary containing:
                     - document_id: The requested ID
                     - content: Full text content
                     - metadata: Associated metadata
                     Returns None if document not found
    
    Usage:
        Used when a user selects a specific document for detailed viewing
        or when starting a teaching session with particular content.
    """
    # Query ChromaDB for the specific document
    result = collection.get(
        ids=[document_id],
        include=["documents", "metadatas"]
    )
    
    # Return document data if found
    if result["documents"]:
        return {
            "document_id": document_id,
            "content": result["documents"][0],
            "metadata": result["metadatas"][0] if result["metadatas"] else {}
        }
    
    # Return None if document doesn't exist
    return None


def delete_document(document_id: str):
    """
    Remove a specific document from the ChromaDB collection
    
    Args:
        document_id (str): Unique identifier of the document to delete
        
    Returns:
        bool: True if deletion successful, False if document not found or error occurred
        
    Note:
        This permanently removes the document and its embeddings from the vector database.
        The operation cannot be undone.
    """
    try:
        # Attempt to delete the document by ID
        collection.delete(ids=[document_id])
        return True
    except Exception:
        # Return False if deletion fails (document not found, connection error, etc.)
        return False









