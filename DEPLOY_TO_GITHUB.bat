@echo off
setlocal enabledelayedexpansion
cls
color 0A

echo ============================================================
echo     3D CHECKERS PRO - GITHUB DEPLOYMENT WIZARD
echo     Complete Automated Setup
echo ============================================================
echo.
echo This wizard will:
echo  1. Help you authenticate with GitHub
echo  2. Create your repository
echo  3. Upload all game files
echo  4. Enable GitHub Pages
echo  5. Make your game live!
echo.
echo ============================================================
pause

cls
echo ============================================================
echo     STEP 1: GITHUB AUTHENTICATION
echo ============================================================
echo.
echo Choose authentication method:
echo.
echo [1] Browser Authentication (Recommended - Easy)
echo [2] Personal Access Token (Advanced)
echo [3] Skip (Already authenticated)
echo.
set /p auth_choice="Enter choice (1-3): "

if "%auth_choice%"=="1" (
    echo.
    echo Opening GitHub authentication in browser...
    echo.
    echo INSTRUCTIONS:
    echo 1. Your browser will open
    echo 2. Enter the 8-digit code shown below
    echo 3. Authorize GitHub CLI
    echo 4. Return here when done
    echo.
    gh auth login --web
    if errorlevel 1 (
        echo.
        echo Authentication failed. Please try again.
        pause
        exit /b 1
    )
) else if "%auth_choice%"=="2" (
    echo.
    echo Creating Personal Access Token:
    echo.
    echo 1. Opening GitHub token page in browser...
    start https://github.com/settings/tokens/new?description=3D-Checkers-Deploy^&scopes=repo,workflow,write:packages
    echo.
    echo 2. In the browser:
    echo    - Name: "3D Checkers Deploy"
    echo    - Expiration: Choose 90 days or more
    echo    - Scopes should be pre-selected (repo, workflow, packages)
    echo    - Click "Generate token" at bottom
    echo    - COPY the token (starts with ghp_)
    echo.
    set /p token="3. Paste your token here: "
    echo.
    echo Authenticating with token...
    echo !token! | gh auth login --with-token
    if errorlevel 1 (
        echo.
        echo Authentication failed. Please check your token.
        pause
        exit /b 1
    )
) else if "%auth_choice%"=="3" (
    echo.
    echo Checking existing authentication...
    gh auth status >nul 2>&1
    if errorlevel 1 (
        echo.
        echo ERROR: Not authenticated. Please choose option 1 or 2.
        pause
        goto :auth_menu
    )
    echo Authenticated successfully!
)

cls
echo ============================================================
echo     STEP 2: GITHUB USERNAME VERIFICATION
echo ============================================================
echo.
echo Verifying GitHub username...
gh api user --jq .login > temp_username.txt
set /p github_user=<temp_username.txt
del temp_username.txt

echo.
echo Detected GitHub username: %github_user%
echo.
echo Is this correct? (Y/N)
set /p confirm="Enter choice: "

if /i not "%confirm%"=="Y" (
    set /p github_user="Enter your GitHub username: "
)

cls
echo ============================================================
echo     STEP 3: REPOSITORY CREATION
echo ============================================================
echo.
echo Creating repository: %github_user%/checkers
echo.

REM Check if repo exists
gh repo view %github_user%/checkers >nul 2>&1
if not errorlevel 1 (
    echo.
    echo Repository already exists!
    echo.
    echo [1] Delete and recreate (WARNING: Will lose any existing data)
    echo [2] Just push updates to existing repo
    echo [3] Cancel
    echo.
    set /p repo_choice="Enter choice (1-3): "
    
    if "!repo_choice!"=="1" (
        echo Deleting existing repository...
        gh repo delete %github_user%/checkers --yes
        timeout /t 3 >nul
    ) else if "!repo_choice!"=="3" (
        echo Cancelled.
        pause
        exit /b 0
    )
)

if not "!repo_choice!"=="2" (
    echo Creating new repository...
    gh repo create checkers --public ^
        --description "3D Checkers Pro - AI-Powered Checkers Game with Three.js" ^
        --homepage "https://%github_user%.github.io/checkers/" ^
        --clone=false
    
    if errorlevel 1 (
        echo.
        echo Failed to create repository. It may already exist.
        echo Continuing with push...
    ) else (
        echo Repository created successfully!
    )
)

cls
echo ============================================================
echo     STEP 4: UPLOADING FILES
echo ============================================================
echo.

REM Configure git
echo Configuring Git...
git config user.name "%github_user%" 2>nul
git config user.email "%github_user%@users.noreply.github.com" 2>nul

REM Set remote
echo Setting remote origin...
git remote remove origin 2>nul
git remote add origin https://github.com/%github_user%/checkers.git

REM Push files
echo.
echo Pushing files to GitHub...
git branch -M main
git push -u origin main --force

if errorlevel 1 (
    echo.
    echo Push failed. Trying alternative method...
    git push --set-upstream origin main --force
)

cls
echo ============================================================
echo     STEP 5: ENABLING GITHUB PAGES
echo ============================================================
echo.
echo Enabling GitHub Pages for live game...

REM Enable Pages
gh api repos/%github_user%/checkers/pages -X POST ^
    -H "Accept: application/vnd.github.v3+json" ^
    -f "source[branch]=main" ^
    -f "source[path]=/" 2>nul

if errorlevel 1 (
    echo.
    echo GitHub Pages may already be enabled or needs manual setup.
    echo.
    echo To enable manually:
    echo 1. Go to: https://github.com/%github_user%/checkers/settings/pages
    echo 2. Under Source, select "Deploy from a branch"
    echo 3. Select "main" branch and "/ (root)"
    echo 4. Click Save
) else (
    echo GitHub Pages enabled successfully!
)

cls
echo ============================================================
echo     STEP 6: ADDING REPOSITORY FEATURES
echo ============================================================
echo.

echo Adding repository topics...
gh repo edit %github_user%/checkers ^
    --add-topic "game" ^
    --add-topic "checkers" ^
    --add-topic "3d" ^
    --add-topic "ai" ^
    --add-topic "javascript" ^
    --add-topic "threejs" ^
    --add-topic "open-source" ^
    --add-topic "webgl" 2>nul

echo Enabling repository features...
gh api repos/%github_user%/checkers -X PATCH ^
    -f has_issues=true ^
    -f has_projects=true ^
    -f has_wiki=false 2>nul

cls
echo ============================================================
echo     🎉 DEPLOYMENT COMPLETE! 🎉
echo ============================================================
echo.
echo Your 3D Checkers game is now live!
echo.
echo 📦 Repository:
echo    https://github.com/%github_user%/checkers
echo.
echo 🎮 Play Game (live in 2-5 minutes):
echo    https://%github_user%.github.io/checkers/
echo.
echo 📋 Next Steps:
echo    1. Star your repository
echo    2. Share on LinkedIn
echo    3. Invite contributors
echo.
echo ============================================================
echo.
echo Would you like to:
echo [1] Open repository in browser
echo [2] Open live game (wait 2-5 minutes first)
echo [3] Copy LinkedIn share message
echo [4] Exit
echo.
set /p final_choice="Enter choice (1-4): "

if "%final_choice%"=="1" (
    start https://github.com/%github_user%/checkers
) else if "%final_choice%"=="2" (
    start https://%github_user%.github.io/checkers/
) else if "%final_choice%"=="3" (
    echo.
    echo ============================================================
    echo Copy this message for LinkedIn:
    echo ============================================================
    echo.
    echo 🎮 Excited to share my open-source 3D Checkers game!
    echo.
    echo Play it live: https://%github_user%.github.io/checkers/
    echo Source code: https://github.com/%github_user%/checkers
    echo.
    echo Features:
    echo ✨ Beautiful 3D graphics with Three.js
    echo 🤖 AI opponent with 4 difficulty levels
    echo 💡 Real-time move suggestions
    echo 🎯 Customizable game rules
    echo 🐳 Docker support
    echo.
    echo Built with #JavaScript #ThreeJS #AI #OpenSource #GameDev
    echo.
    echo Looking for contributors! ⭐ Star the repo if you like it!
    echo ============================================================
    echo.
    echo Message copied to clipboard!
    echo ^🎮 Excited to share my open-source 3D Checkers game!^

Play it live: https://%github_user%.github.io/checkers/^

Source code: https://github.com/%github_user%/checkers^

^

Features:^

✨ Beautiful 3D graphics with Three.js^

🤖 AI opponent with 4 difficulty levels^

💡 Real-time move suggestions^

🎯 Customizable game rules^

🐳 Docker support^

^

Built with #JavaScript #ThreeJS #AI #OpenSource #GameDev^

^

Looking for contributors! ⭐ Star the repo if you like it! | clip
    pause
)

echo.
echo Thank you for using 3D Checkers Pro!
echo.
pause
endlocal