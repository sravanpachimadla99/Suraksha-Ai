from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# In-memory knowledge base for lightweight RAG
KNOWLEDGE_BASE = [
    "CERT-In Advisory: Do not share OTPs, PINs, or passwords with anyone. Banks will never ask for them.",
    "RBI Guidelines: If you notice an unauthorized transaction, report it to your bank within 3 days for zero liability.",
    "NPCI UPI Safety: Never enter your UPI PIN to receive money. PIN is only for sending money.",
    "Phishing Awareness: Verify the URL of the website before entering credentials. Look for HTTPS and correct spelling.",
]

class RAGEngine:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words='english')
        self.doc_vectors = self.vectorizer.fit_transform(KNOWLEDGE_BASE)

    def retrieve(self, query: str, top_k: int = 1) -> str:
        query_vec = self.vectorizer.transform([query])
        similarities = cosine_similarity(query_vec, self.doc_vectors).flatten()
        
        if np.max(similarities) < 0.1:
            return "" # No highly relevant document found
            
        top_indices = similarities.argsort()[-top_k:][::-1]
        return "\n".join([KNOWLEDGE_BASE[i] for i in top_indices])

rag_engine = RAGEngine()
