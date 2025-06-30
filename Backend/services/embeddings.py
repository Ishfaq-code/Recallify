import os
from dotenv import load_dotenv

from google import genai
from google.genai import types



load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
client = genai.Client(api_key=GOOGLE_API_KEY)


def embed_text(chunk):
    EMBEDDING_MODEL_ID = "models/gemini-embedding-exp-03-07"
    TASK_TYPE_ID = "RETRIEVAL_DOCUMENT"
    response = client.models.embed_content(
        model=EMBEDDING_MODEL_ID,
        contents=chunk,
        config=types.EmbedContentConfig(task_type=TASK_TYPE_ID)
    )

    if response.embeddings and len(response.embeddings) > 0:
        return response.embeddings[0].values
    else:
        raise Exception(f"Failed to get embeddings: {response}")



def get_embeddings(chunked_text):
    embeddings = []
    for i, chunk in enumerate(chunked_text):
        embedded_data = embed_text(chunk)
        embeddings.append({
            "id": f"chunk_{i}",
            "text": chunk,
            "embedding": embedded_data
        })
    
    return embeddings