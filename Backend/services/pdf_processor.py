from pdfminer.high_level import extract_text

def extract_text_from_pdf(file_path):
    return extract_text(file_path)


def chunk_text(text, max_tokens=300):
    sentences = text.split('. ')
    chunks, chunk = [], []
    token_count = 0
    for s in sentences:
        token_count += len(s.split())
        chunk.append(s)
        if token_count >= max_tokens:
            chunks.append('. '.join(chunk))
            chunk, token_count = [], 0
    if chunk:
        chunks.append('. '.join(chunk))
    return chunks