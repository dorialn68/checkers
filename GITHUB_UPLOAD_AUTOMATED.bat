@echo off
echo ========================================
echo    AUTOMATED GITHUB UPLOAD SCRIPT
echo    3D Checkers Pro
echo ========================================
echo.

echo Step 1: Authenticating with GitHub...
echo.
echo You'll be prompted to:
echo 1. Press Enter to open github.com in browser
echo 2. Enter the 8-digit code shown
echo 3. Authorize GitHub CLI
echo.

gh auth login --web

echo.
echo Step 2: Creating repository and uploading...
echo.

REM Create the repository
echo Creating repository 'checkers' on GitHub...
gh repo create checkers --public --description "3D Checkers Pro - AI-Powered Checkers Game with Three.js" --homepage "https://dorialn68.github.io/checkers/"

REM Add remote if not exists
git remote remove origin 2>nul
git remote add origin https://github.com/dorialn68/checkers.git

REM Push to GitHub
echo.
echo Pushing code to GitHub...
git branch -M main
git push -u origin main --force

echo.
echo Step 3: Enabling GitHub Pages...
gh api repos/dorialn68/checkers/pages -X POST -f source.branch=main -f source.path="/" 2>nul

echo.
echo Step 4: Adding repository topics...
gh repo edit dorialn68/checkers --add-topic "game" --add-topic "checkers" --add-topic "3d" --add-topic "ai" --add-topic "javascript" --add-topic "threejs" --add-topic "open-source"

echo.
echo ========================================
echo    UPLOAD COMPLETE!
echo ========================================
echo.
echo Repository: https://github.com/dorialn68/checkers
echo Live Game: https://dorialn68.github.io/checkers/
echo.
echo The game should be live in 2-5 minutes!
echo.
echo Share on LinkedIn with this message:
echo.
echo "Just published my 3D Checkers game as open source!"
echo "Play it: https://dorialn68.github.io/checkers/"
echo "Code: https://github.com/dorialn68/checkers"
echo.
pause