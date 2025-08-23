@echo off
echo.
echo ===================================
echo   GITHUB UPLOAD SCRIPT
echo   3D Checkers Pro
echo ===================================
echo.
echo Make sure you've created the repository on GitHub first!
echo Repository URL should be: https://github.com/dorialn68/checkers
echo.
pause

echo.
echo Adding GitHub remote...
git remote add origin https://github.com/dorialn68/checkers.git

echo.
echo Pushing to GitHub...
git branch -M main
git push -u origin main

echo.
echo ===================================
echo   UPLOAD COMPLETE!
echo ===================================
echo.
echo Your game is now live at:
echo https://github.com/dorialn68/checkers
echo.
echo To enable GitHub Pages:
echo 1. Go to Settings in your repository
echo 2. Click on Pages (left sidebar)
echo 3. Under Source, select "Deploy from a branch"
echo 4. Select "main" branch and "/ (root)" folder
echo 5. Click Save
echo.
echo Your game will be playable at:
echo https://dorialn68.github.io/checkers/
echo.
pause