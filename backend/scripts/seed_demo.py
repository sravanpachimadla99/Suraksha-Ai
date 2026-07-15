import requests

def seed():
    # Reports bank account
    requests.post("http://localhost:8000/api/v1/bank/report-account", json={
        "account_number": "111222333444",
        "bank_name": "State Bank of India",
        "holder_name": "Kumar Mule",
        "risk_score": 0.89
    })
    
    # Reports scam number
    requests.post("http://localhost:8000/api/v1/telecom/report-number", json={
        "phone_number": "9876500112",
        "country_code": "+91",
        "carrier": "Airtel",
        "risk_score": 0.95
    })
    
    # Run prediction simulation
    requests.post("http://localhost:8000/api/v1/prediction/run", json={
        "category": "UPI"
    })
    
    print("Seeding complete.")

if __name__ == "__main__":
    try:
        seed()
    except Exception as e:
        print("Backend not running, skipping live seeding.")
