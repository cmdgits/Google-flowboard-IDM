@echo off
setlocal EnableExtensions

set "ROOT=%~dp0"
set "AGENT_DIR=%ROOT%agent"
set "FRONTEND_DIR=%ROOT%frontend"
set "AGENT_PY=%AGENT_DIR%\.venv\Scripts\python.exe"

echo Flowboard installer
echo.

echo [1/4] Checking Python...
call :detect_python
if errorlevel 1 exit /b %errorlevel%

echo.
echo [2/4] Creating/updating agent virtualenv...
if not exist "%AGENT_PY%" (
  %PY_CMD% -m venv "%AGENT_DIR%\.venv"
  if errorlevel 1 (
    echo ERROR: Failed to create Python virtualenv.
    exit /b 1
  )
)

pushd "%AGENT_DIR%" >nul
call ".venv\Scripts\python.exe" -m pip install --upgrade pip
if errorlevel 1 (
  popd >nul
  echo ERROR: Failed to upgrade pip.
  exit /b 1
)

call ".venv\Scripts\python.exe" -m pip install -e ".[dev]"
if errorlevel 1 (
  popd >nul
  echo ERROR: Failed to install agent dependencies.
  exit /b 1
)
popd >nul

echo.
echo [3/4] Checking Node.js/npm...
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed or not on PATH. Install Node 20+ first.
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm is not installed or not on PATH. Install Node 20+ first.
  exit /b 1
)

echo.
echo [4/4] Installing frontend dependencies...
pushd "%FRONTEND_DIR%" >nul
call npm install
if errorlevel 1 (
  popd >nul
  echo ERROR: Failed to install frontend dependencies.
  exit /b 1
)
popd >nul

echo.
echo Setting Gemini CLI workspace trust for this Windows user...
setx GEMINI_CLI_TRUST_WORKSPACE true >nul

echo.
echo Install complete.
echo Run start.bat to launch Flowboard.
exit /b 0

:detect_python
set "PY_CMD="

where py >nul 2>nul
if not errorlevel 1 (
  py -3.11 --version >nul 2>nul
  if not errorlevel 1 set "PY_CMD=py -3.11"
)

if not defined PY_CMD (
  where py >nul 2>nul
  if not errorlevel 1 (
    py -3 --version >nul 2>nul
    if not errorlevel 1 set "PY_CMD=py -3"
  )
)

if not defined PY_CMD (
  where python >nul 2>nul
  if not errorlevel 1 set "PY_CMD=python"
)

if not defined PY_CMD (
  echo ERROR: Python 3.10+ is not installed or not on PATH.
  echo Recommended: Python 3.11 from https://www.python.org/downloads/
  exit /b 1
)

%PY_CMD% --version
exit /b 0
