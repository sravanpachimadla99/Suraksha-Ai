FROM python:3.11-slim

WORKDIR /app

# System packages: gcc for native extensions, tesseract for OCR fallback
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libssl-dev \
    libffi-dev \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
