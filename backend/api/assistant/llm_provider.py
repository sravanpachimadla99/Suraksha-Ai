import os
import google.generativeai as genai

class LLMProvider:
    def __init__(self):
        self.provider = os.getenv("LLM_PROVIDER", "mock")
        if self.provider == "gemini":
            genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
            self.model = genai.GenerativeModel('gemini-1.5-pro-latest')

    def generate_response(self, prompt: str, context: str = "") -> str:
        if self.provider == "gemini":
            try:
                full_prompt = f"Context:\n{context}\n\nQuery:\n{prompt}"
                response = self.model.generate_content(full_prompt)
                return response.text
            except Exception as e:
                return f"Error from Gemini: {str(e)}"
        
        elif self.provider == "openai":
            # Placeholder for OpenAI integration
            return "OpenAI integration not fully configured. Please use Gemini or mock."
            
        else:
            # Fallback Mock
            return "This is a mock response from the AI Assistant. " \
                   "If you suspect fraud, immediately contact your bank and report it to cybercrime.gov.in."
