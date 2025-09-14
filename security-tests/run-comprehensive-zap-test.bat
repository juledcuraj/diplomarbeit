@echo off
title Comprehensive ZAP Security Assessment

echo.
echo =========================================
echo   COMPREHENSIVE ZAP SECURITY TESTING
echo   Medical Application Assessment
echo =========================================
echo.

REM Check if target is running
echo Checking target availability...
curl -s http://localhost:3000 >nul 2>&1
if errorlevel 1 (
    echo X Target not running on localhost:3000
    echo   Start your Next.js app first: npm run dev
    pause
    exit /b 1
)
echo ✓ Target is accessible

REM Check Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo X Docker not available
    echo   Please install Docker Desktop
    pause
    exit /b 1
)
echo ✓ Docker is available

echo.
echo Creating reports directory...
if not exist "reports" mkdir reports

echo.
echo Starting comprehensive ZAP security assessment...
echo This includes:
echo   - OWASP Top 10 testing
echo   - API security assessment  
echo   - Authentication bypass testing
echo   - Medical data protection analysis
echo   - Time-to-compromise measurement
echo.

REM Run comprehensive ZAP scan with CORRECT file mounting
docker run -v "%CD%\reports:/zap/wrk/:rw" ^
  -v "%CD%\zap-comprehensive.yaml:/zap/automation.yaml:ro" ^
  --rm ghcr.io/zaproxy/zaproxy:stable ^
  zap.sh -cmd -autorun /zap/automation.yaml

echo.
echo ==========================================
echo   COMPREHENSIVE SCAN COMPLETED
echo ==========================================
echo.
echo 📊 Generated Reports:
dir reports\*.html reports\*.json 2>nul
echo.
echo Running comprehensive analysis...
python comprehensive-zap-analysis.py

echo.
echo ✅ Security assessment complete!
echo    Check reports\ folder for detailed findings
echo.
pause