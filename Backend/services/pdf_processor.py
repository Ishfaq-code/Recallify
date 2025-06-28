import PyPDF2
import io
import re
from typing import List

# Simple text splitter implementation (to avoid langchain dependency for now)
class SimpleTextSplitter:
    def __init__(self, chunk_size=1000, chunk_overlap=200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
    
    def split_text(self, text: str) -> List[str]:
        """Simple text splitting by sentences and paragraphs"""
        # Split by paragraphs first
        paragraphs = text.split('\n\n')
        chunks = []
        current_chunk = ""
        
        for paragraph in paragraphs:
            # If adding this paragraph would exceed chunk size
            if len(current_chunk) + len(paragraph) > self.chunk_size:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                    # Add overlap from previous chunk
                    overlap_start = max(0, len(current_chunk) - self.chunk_overlap)
                    current_chunk = current_chunk[overlap_start:] + "\n\n" + paragraph
                else:
                    current_chunk = paragraph
            else:
                if current_chunk:
                    current_chunk += "\n\n" + paragraph
                else:
                    current_chunk = paragraph
        
        # Add the last chunk
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks

class PDFProcessor:
    def __init__(self):
        # Initialize text splitter for chunking
        self.text_splitter = SimpleTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
    
    def extract_text(self, pdf_content: bytes) -> str:
        """
        Extract text from PDF bytes content
        """
        try:
            # Create a BytesIO object from the PDF content
            pdf_file = io.BytesIO(pdf_content)
            
            # Create PDF reader
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            # Extract text from all pages
            text_content = ""
            
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                page_text = page.extract_text()
                
                if page_text:
                    text_content += f"\n--- Page {page_num + 1} ---\n"
                    text_content += page_text
            
            # Clean up the text
            cleaned_text = self._clean_text(text_content)
            
            return cleaned_text
            
        except Exception as e:
            raise Exception(f"Error extracting text from PDF: {str(e)}")
    
    def _clean_text(self, text: str) -> str:
        """
        Clean and normalize extracted text
        """
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove weird characters that sometimes appear in PDFs
        text = re.sub(r'[^\w\s\.\,\;\:\!\?\-\(\)\[\]\"\'\/\@\#\$\%\&\*\+\=]', '', text)
        
        # Normalize line breaks
        text = re.sub(r'\n\s*\n', '\n\n', text)
        
        return text.strip()
    
    def chunk_text(self, text: str) -> List[dict]:
        """
        Split text into chunks for vector storage
        """
        try:
            # Split text into chunks
            chunks = self.text_splitter.split_text(text)
            
            # Create chunk objects with metadata
            chunk_objects = []
            for i, chunk in enumerate(chunks):
                chunk_objects.append({
                    "content": chunk,
                    "chunk_index": i,
                    "character_count": len(chunk),
                    "word_count": len(chunk.split())
                })
            
            return chunk_objects
            
        except Exception as e:
            raise Exception(f"Error chunking text: {str(e)}")
    
    def get_text_stats(self, text: str) -> dict:
        """
        Get statistics about the extracted text
        """
        return {
            "character_count": len(text),
            "word_count": len(text.split()),
            "line_count": len(text.split('\n')),
            "paragraph_count": len([p for p in text.split('\n\n') if p.strip()])
        } 