# System Architecture

## High-Level Component Diagram

```mermaid
graph TD
    Client[Citizen Mobile App / Web Dashboards]
    APIGateway[FastAPI Gateway]
    Auth[JWT Authentication]
    
    subgraph Microservices
        AI[AI Orchestration Service]
        Core[Core Fraud Intelligence]
        Data[Data Ingestion Service]
    end
    
    subgraph Machine Learning
        NLP[Speech/NLP Models]
        CV[Computer Vision YOLOv8]
        Graph[Graph Neural Networks]
        Predict[XGBoost Forecasting]
    end
    
    subgraph Databases
        PG[(PostgreSQL - Relational)]
        Neo4j[(Neo4j - Graph Intelligence)]
        Redis[(Redis - Caching)]
    end

    Client -->|REST/WebSockets| APIGateway
    APIGateway --> Auth
    APIGateway --> Microservices
    
    AI --> NLP
    AI --> CV
    Core --> Graph
    Core --> Predict
    
    Data --> PG
    Core --> Neo4j
    AI --> Redis
```

## Data Flow Diagram: Digital Arrest Scam Detection

1. Citizen receives a suspicious VoIP call.
2. The Citizen Mobile App captures a snippet of the audio locally.
3. Audio is streamed to the FastAPI backend.
4. The AI Orchestration Service routes the audio to the Speech-to-Text model (Whisper).
5. The transcript is analyzed by the NLP Model (DistilBERT) for keywords ("Aadhaar", "Customs", "Money Laundering").
6. The AI engine generates a Confidence Score and Risk Percentage.
7. A WebSocket event is fired back to the Citizen App, triggering a flashing Red SOS Warning.
8. If the risk is >90%, the metadata (phone number) is ingested into Neo4j to update the Fraud Network Intelligence graph.
9. An alert is propagated to the Police Dashboard in real-time.
