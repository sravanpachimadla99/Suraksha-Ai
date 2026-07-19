start /b python -m uvicorn main:app --host 127.0.0.1 --port 8000
python test_api.py
taskkill /F /IM python.exe
