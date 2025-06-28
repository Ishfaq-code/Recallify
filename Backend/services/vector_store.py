import chromadb
import uuid
from typing import List, Dict, Any
from datetime import datetime
import json

class VectorStore:
    def __init__(self):
        # Initialize ChromaDB client
        self.client = chromadb.PersistentClient(path="./chroma_db")
        
        # Create or get collection for documents
        self.collection = self.client.get_or_create_collection(
            name="documents",
            metadata={"description": "PDF document chunks for teaching assistant"}
        )
    
    async def store_document(self, filename: str, chunks: List[dict]) -> str:
        """
        Store document chunks in the vector database
        """
        try:
            document_id = str(uuid.uuid4())
            
            # Prepare data for ChromaDB
            documents = []
            metadatas = []
            ids = []
            
            for i, chunk in enumerate(chunks):
                chunk_id = f"{document_id}_chunk_{i}"
                
                documents.append(chunk["content"])
                metadatas.append({
                    "document_id": document_id,
                    "filename": filename,
                    "chunk_index": i,
                    "character_count": chunk["character_count"],
                    "word_count": chunk["word_count"],
                    "upload_timestamp": datetime.now().isoformat()
                })
                ids.append(chunk_id)
            
            # Add to ChromaDB collection
            self.collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )
            
            return document_id
            
        except Exception as e:
            raise Exception(f"Error storing document in vector database: {str(e)}")
    
    async def get_all_documents(self) -> List[Dict[str, Any]]:
        """
        Get list of all uploaded documents
        """
        try:
            # Get all documents from collection
            results = self.collection.get()
            
            # Group by document_id
            documents = {}
            
            if results["metadatas"]:
                for i, metadata in enumerate(results["metadatas"]):
                    doc_id = metadata["document_id"]
                
                if doc_id not in documents:
                    documents[doc_id] = {
                        "document_id": doc_id,
                        "filename": metadata["filename"],
                        "upload_timestamp": metadata["upload_timestamp"],
                        "chunk_count": 0,
                        "total_characters": 0,
                        "total_words": 0
                    }
                
                documents[doc_id]["chunk_count"] += 1
                documents[doc_id]["total_characters"] += metadata["character_count"]
                documents[doc_id]["total_words"] += metadata["word_count"]
            
            return list(documents.values())
            
        except Exception as e:
            raise Exception(f"Error fetching documents: {str(e)}")
    
    async def search_similar(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Search for similar document chunks based on query
        """
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=limit
            )
            
            search_results = []
            if results["documents"] and results["documents"][0] and results["metadatas"]:
                for i, document in enumerate(results["documents"][0]):
                    search_results.append({
                        "content": document,
                        "metadata": results["metadatas"][0][i],
                        "distance": results["distances"][0][i] if results["distances"] and results["distances"][0] else None
                    })
            
            return search_results
            
        except Exception as e:
            raise Exception(f"Error searching documents: {str(e)}")
    
    async def get_document_chunks(self, document_id: str) -> List[Dict[str, Any]]:
        """
        Get all chunks for a specific document
        """
        try:
            results = self.collection.get(
                where={"document_id": document_id}
            )
            
            chunks = []
            if results["documents"] and results["metadatas"] and results["ids"]:
                for i, document in enumerate(results["documents"]):
                    chunks.append({
                        "content": document,
                        "metadata": results["metadatas"][i],
                        "id": results["ids"][i]
                    })
            
            # Sort by chunk_index
            chunks.sort(key=lambda x: x["metadata"]["chunk_index"])
            
            return chunks
            
        except Exception as e:
            raise Exception(f"Error fetching document chunks: {str(e)}")
    
    async def delete_document(self, document_id: str) -> bool:
        """
        Delete a document and all its chunks
        """
        try:
            # Get all chunk IDs for this document
            results = self.collection.get(
                where={"document_id": document_id}
            )
            
            if results["ids"]:
                self.collection.delete(ids=results["ids"])
                return True
            
            return False
            
        except Exception as e:
            raise Exception(f"Error deleting document: {str(e)}") 