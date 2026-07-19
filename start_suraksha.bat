@echo off
echo ===================================================
echo Starting SurakshaAI Local Environment...
echo ===================================================

:: Start backend in a new command window
echo Starting FastAPI Backend...
start "SurakshaAI Backend" cmd /c "cd backend && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

:: Wait for a few seconds to let backend initialize
timeout /t 3 /nobreak > nul

:: Start frontend in a new command window
echo Starting Next.js Frontend...
start "SurakshaAI Frontend" cmd /c "cd frontend && npm run dev"

echo ===================================================
echo Backend is running on http://localhost:8000
echo Frontend is running on http://localhost:3000
echo ===================================================
echo You can now close this window, the servers will continue running in their own windows.
