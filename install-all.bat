@echo off
setlocal
echo =======================================
echo Flowboard Installation Script
echo =======================================
echo.

echo [1/2] Installing Backend (Agent) dependencies...
cd /d "%~dp0\agent"
if exist ".venv" (
    echo Virtual environment already exists.
) else (
    echo Creating virtual environment...
    python -m venv .venv
)
call .venv\Scripts\activate.bat
pip install -r requirements.txt
echo Backend dependencies installed.
echo.

echo [2/2] Installing Frontend dependencies...
cd /d "%~dp0\frontend"
call npm install
echo Frontend dependencies installed.
echo.

echo Installation complete! You can now run start-all.bat.
pause
