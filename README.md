# SurakshaAI – AI-Powered Digital Public Safety Intelligence Platform

**Predict. Prevent. Protect.**

SurakshaAI is an AI-powered Digital Public Safety Intelligence Platform designed to proactively detect, prevent, and respond to digital fraud, counterfeit currency circulation, digital arrest scams, and organized cybercrime networks before citizens become victims.

## Overview

Instead of simply allowing citizens to report fraud after losing money, SurakshaAI proactively identifies suspicious activities, generates AI-powered risk assessments, issues real-time alerts, visualizes fraud intelligence, and assists authorities in preventing large-scale fraud operations.

## Key Modules
1. Digital Arrest Scam Detection Engine (Speech analysis, impersonation detection)
2. Counterfeit Currency Detection (CV model for fake currency)
3. Citizen Fraud Shield (AI Assistant for SMS/URLs/QR)
4. Fraud Network Intelligence (Graph DB visualization)
5. Geospatial Crime Intelligence (GIS Dashboard)
6. AI Risk Prediction (XGBoost/LightGBM based forecasting)
7. Voice AI (Deepfake/voice cloning detection)
8. Deepfake Detection (Video/Image/Voice manipulation analysis)
9. Dashboards for Police, Banks, Telecom, and Citizens.

## Technology Stack

- **Frontend:** Next.js (React), Tailwind CSS, Mobile-first responsive design
- **Backend:** FastAPI (Python), REST APIs, WebSockets
- **Database:** PostgreSQL (Relational), Neo4j (Graph), Redis
- **AI Models:** YOLOv8, Whisper, Gemini API, DistilBERT, NetworkX
- **Deployment:** Docker, Kubernetes

## Installation

### Prerequisites
- Node.js (v18+)
- Python 3.9+
- Docker and docker-compose

### Running Locally
1. Clone the repository
2. Run `docker-compose up --build`
3. Access the Citizen Mobile App at `http://localhost:3000/citizen`
4. Access the Police Dashboard at `http://localhost:3000/police`
5. Access the API documentation at `http://localhost:8000/docs`

## Contributing
Follow the SOLID principles, ensure robust security practices, and maintain proper documentation.
