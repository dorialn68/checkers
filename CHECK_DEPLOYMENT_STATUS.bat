@echo off
echo ============================================================
echo     CHECKING GITHUB PAGES DEPLOYMENT STATUS
echo ============================================================
echo.

echo Checking deployment status...
gh api repos/dorialn68/checkers/pages --jq '.status'

echo.
echo Checking latest build...
gh api repos/dorialn68/checkers/pages/builds/latest --jq '.status'

echo.
echo Checking workflow runs...
gh run list --repo dorialn68/checkers --workflow pages-build-deployment --limit 3

echo.
echo ============================================================
echo URLs to try:
echo.
echo Main URL: https://dorialn68.github.io/checkers/
echo Direct: https://dorialn68.github.io/checkers/index.html
echo.
echo If status shows "built" - your game is ready!
echo If status shows "building" - wait 2-5 more minutes
echo.
echo Opening your game in browser...
start https://dorialn68.github.io/checkers/
echo.
pause