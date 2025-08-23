@echo off
:loop
cls
echo ============================================================
echo     MONITORING GITHUB PAGES DEPLOYMENT
echo ============================================================
echo.
echo Checking deployment status...
echo.

echo Latest workflow runs:
gh run list --repo dorialn68/checkers --limit 3

echo.
echo Pages Status:
gh api repos/dorialn68/checkers/pages --jq '.status' 2>nul

echo.
echo Testing site availability...
curl -s -o nul -w "HTTP Status: %%{http_code}" https://dorialn68.github.io/checkers/
echo.
echo.

echo ============================================================
echo STATUS CODES:
echo - 200 = Site is LIVE! Your game is ready!
echo - 404 = Still building, please wait...
echo - Other = Configuration issue
echo ============================================================
echo.
echo Press Ctrl+C to stop monitoring
echo Refreshing in 10 seconds...

timeout /t 10 >nul
goto loop