import requests, json, time, sys

base = 'http://127.0.0.1:8000/api/v1'

def wait_for_server():
    for _ in range(15):
        try:
            requests.get("http://127.0.0.1:8000/health")
            return True
        except:
            time.sleep(1)
    return False

if not wait_for_server():
    print("Server did not start in time.")
    sys.exit(1)

print('=== SMS/Phishing Text Check ===')
try:
    r = requests.post(f'{base}/scam/check-text', json={'text': 'Your account is blocked. Update KYC at http://fake-bank.tk/kyc urgently!'}, timeout=15)
    print(r.status_code, json.dumps(r.json(), indent=2))
except Exception as e:
    print('Error:', e)

print('=== Website Analyze ===')
try:
    r = requests.post(f'{base}/website/analyze', json={'url': 'http://fake-paytm-kyc.ml/login'}, timeout=30)
    print(r.status_code, json.dumps(r.json(), indent=2)[:500])
except Exception as e:
    print('Error:', e)

print('=== Assistant Chat ===')
try:
    r = requests.post(f'{base}/assistant/chat', json={'message': 'Someone told me my bank account is frozen and I need to transfer money. What should I do?', 'session_id': 'test-123', 'language': 'en'}, timeout=15)
    print(r.status_code, json.dumps(r.json(), indent=2))
except Exception as e:
    print('Error:', e)
