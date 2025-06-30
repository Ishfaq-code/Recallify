import chromadb
from chromadb.config import Settings

client = chromadb.Client()
collection = client.get_or_create_collection(name="lecture_notes")


def clear_collection():
    """Clear all documents from the collection"""
    try:
        # Get all document IDs
        result = collection.get()
        if result["ids"]:
            collection.delete(ids=result["ids"])
            print(f"Cleared {len(result['ids'])} documents from collection")
        return True
    except Exception as e:
        print(f"Error clearing collection: {e}")
        return False


def add_to_db(embedding_list, clear_first=True):
    """Add documents to database, optionally clearing existing documents first"""
    if clear_first:
        clear_collection()
    
    for e in embedding_list:
        collection.add(
            documents=[e["text"]],
            embeddings=[e["embedding"]],
            ids=[e["id"]],
            metadatas=[{"source": "lecture_pdf"}]
        )


def get_notes(lim: int):
    initial_docs = collection.get(include=["documents"], limit=lim)
    documents = initial_docs["documents"] or []
    notes_summary = "\n\n".join(documents)

    return notes_summary


def get_all_documents():
    """Get all documents with metadata"""
    result = collection.get(include=["documents", "metadatas"])
    documents = []
    if result["documents"] and result["ids"]:
        for i, doc in enumerate(result["documents"]):
            metadata = result["metadatas"][i] if result["metadatas"] and i < len(result["metadatas"]) else {}
            documents.append({
                "document_id": result["ids"][i],
                "filename": metadata.get("filename", "unknown"),
                "source": metadata.get("source", "unknown"),
                "content_preview": doc[:100] + "..." if len(doc) > 100 else doc
            })
    return documents


def get_document_chunks(document_id: str):
    """Get all chunks for a specific document ID"""
    result = collection.get(
        ids=[document_id],
        include=["documents", "metadatas"]
    )
    if result["documents"]:
        return {
            "document_id": document_id,
            "content": result["documents"][0],
            "metadata": result["metadatas"][0] if result["metadatas"] else {}
        }
    return None


def delete_document(document_id: str):
    """Delete a document by ID"""
    try:
        collection.delete(ids=[document_id])
        return True
    except:
        return False









