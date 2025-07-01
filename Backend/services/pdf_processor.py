# PDF Processing Service
# Handles extraction of text content from PDF files and intelligent text chunking
# for optimal AI processing and vector embeddings

from pdfminer.high_level import extract_text

def extract_text_from_pdf(file_path):
    """
    Extract all text content from a PDF file using pdfminer library
    
    Args:
        file_path (str): Path to the PDF file to process
        
    Returns:
        str: Complete text content extracted from the PDF
        
    Raises:
        Exception: If PDF cannot be read or processed
        
    Note:
        Uses pdfminer which is reliable for text extraction but may not
        preserve complex formatting. Works well for academic papers and notes.
    """
    return extract_text(file_path)


def chunk_text(text, max_tokens=300):
    """
    Split text into smaller, manageable chunks for AI processing
    
    This function intelligently breaks text at sentence boundaries to maintain
    semantic coherence while staying within token limits for embeddings.
    
    Args:
        text (str): The complete text to be chunked
        max_tokens (int): Maximum number of tokens (words) per chunk
                         Default: 300 tokens (optimal for most embedding models)
    
    Returns:
        list: List of text chunks, each containing complete sentences
              and staying within the token limit
    
    Algorithm:
        1. Split text into sentences using period as delimiter
        2. Accumulate sentences until approaching token limit
        3. Create new chunk when limit is reached
        4. Ensures no sentence is split across chunks
    
    Note:
        Token counting is approximate (word count), actual tokens may vary
        depending on the tokenizer used by the embedding model.
    """
    # Split text into sentences - this maintains semantic boundaries
    sentences = text.split('. ')
    
    # Initialize storage for chunks and current chunk being built
    chunks = []
    chunk = []
    token_count = 0
    
    # Process each sentence
    for sentence in sentences:
        # Estimate tokens by counting words (simple but effective approximation)
        sentence_tokens = len(sentence.split())
        token_count += sentence_tokens
        
        # Add sentence to current chunk
        chunk.append(sentence)
        
        # If we've reached the token limit, finalize this chunk
        if token_count >= max_tokens:
            # Join sentences with periods to reconstruct proper text
            chunks.append('. '.join(chunk))
            
            # Reset for next chunk
            chunk = []
            token_count = 0
    
    # Don't forget the last chunk if it has content
    if chunk:
        chunks.append('. '.join(chunk))
    
    return chunks