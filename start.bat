@echo off
setlocal EnableExtensions

set "ROOT=%~dp0"
set "AGENT_DIR=%ROOT%agent"
set "FRONTEND_DIR=%ROOT%frontend"
set "AGENT_PY=%AGENT_DIR%\.venv\Scripts\python.exe"

echo Flowboard server launcher
echo.

if not exist "%AGENT_PY%" (
  echo ERROR: Missing %AGENT_PY%
  echo Run install.bat first.
  exit /b 1
)

if not exist "%FRONTEND_DIR%\node_modules" (
  echo ERROR: Missing frontend node_modules.
  echo Run install.bat first.
  exit /b 1
)

set "GEMINI_CLI_TRUST_WORKSPACE=true"

echo Starting Flowboard Agent on http://127.0.0.1:8101 ...
start "Flowboard Agent :8101" /D "%AGENT_DIR%" cmd /k "set GEMINI_CLI_TRUST_WORKSPACE=true&& .venv\Scripts\python.exe -m uvicorn flowboard.main:app --reload --port 8101 --timeout-graceful-shutdown 2"

echo Starting Flowboard Frontend on http://127.0.0.1:5173 ...
start "Flowboard Frontend :5173" /D "%FRONTEND_DIR%" cmd /k "npm run dev -- --host 127.0.0.1"

echo.
echo Agent window and Frontend window opened.
echo Frontend: http://127.0.0.1:5173
echo Agent:    http://127.0.0.1:8101/api/health
echo.
echo Load the Chrome extension from: %ROOT%extension
echo Keep a Flow tab open at: https://labs.google/fx/tools/flow

timeout /t 2 >nul
start "" "http://127.0.0.1:5173"
exit /b 0
