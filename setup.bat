@echo off
echo ============================================
echo  The Great Analysis — Project Setup
echo ============================================

echo.
echo [1/4] Setting up Python backend...
cd backend
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
cd ..

echo.
echo [2/4] Setting up frontend...
cd frontend
npm install
cd ..

echo.
echo ============================================
echo  Setup complete!
echo.
echo  To start the backend:
echo    cd backend
echo    venv\Scripts\activate
echo    uvicorn app.main:app --reload
echo.
echo  To start the frontend (new terminal):
echo    cd frontend
echo    npm run dev
echo.
echo  Backend API: http://localhost:8000
echo  Frontend:    http://localhost:5173
echo  API docs:    http://localhost:8000/docs
echo ============================================
pause
