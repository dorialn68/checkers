@echo off
cls
echo ============================================================
echo     FIXING GITHUB PAGES DEPLOYMENT
echo ============================================================
echo.

echo Step 1: Checking repository status...
gh api repos/dorialn68/checkers --jq '.name'

echo.
echo Step 2: Checking if index.html exists...
gh api repos/dorialn68/checkers/contents/index.html --jq '.name' 2>nul
if errorlevel 1 (
    echo ERROR: index.html not found in repository!
    echo Pushing files again...
    git push origin main --force
)

echo.
echo Step 3: Current GitHub Pages status...
gh api repos/dorialn68/checkers/pages --jq '.status' 2>nul
if errorlevel 1 (
    echo GitHub Pages not enabled. Enabling now...
    gh api repos/dorialn68/checkers/pages -X POST -H "Accept: application/vnd.github.v3+json" -f "source[branch]=main" -f "source[path]=/"
)

echo.
echo Step 4: Triggering rebuild...
echo Creating empty commit to trigger Pages rebuild...
git commit --allow-empty -m "Trigger GitHub Pages rebuild"
git push origin main

echo.
echo Step 5: Checking deployment status...
timeout /t 5 >nul
gh api repos/dorialn68/checkers/pages --jq '.status'

echo.
echo ============================================================
echo     DEPLOYMENT STATUS
echo ============================================================
echo.
echo GitHub Pages is rebuilding your site.
echo This usually takes 2-10 minutes.
echo.
echo Your game will be available at:
echo https://dorialn68.github.io/checkers/
echo.
echo You can check the deployment progress at:
echo https://github.com/dorialn68/checkers/actions
echo.
echo Opening the Actions page to monitor progress...
start https://github.com/dorialn68/checkers/actions
echo.
echo Wait for the green checkmark, then visit:
start https://dorialn68.github.io/checkers/
echo.
pause