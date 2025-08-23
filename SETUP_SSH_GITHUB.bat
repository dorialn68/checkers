@echo off
echo ============================================================
echo     GITHUB SSH KEY SETUP
echo ============================================================
echo.

echo Checking for existing SSH key...
if exist "%USERPROFILE%\.ssh\id_ed25519.pub" (
    echo Found existing SSH key!
    echo.
    type "%USERPROFILE%\.ssh\id_ed25519.pub"
    echo.
    echo Copy the above key and add it to GitHub:
    echo https://github.com/settings/keys
    pause
    exit /b 0
)

echo Generating new SSH key...
echo.
echo Enter your GitHub email address:
set /p email=

ssh-keygen -t ed25519 -C "%email%" -f "%USERPROFILE%\.ssh\id_ed25519" -N ""

echo.
echo Starting SSH agent...
start-ssh-agent

echo.
echo Adding key to SSH agent...
ssh-add "%USERPROFILE%\.ssh\id_ed25519"

echo.
echo ============================================================
echo Your SSH public key:
echo ============================================================
type "%USERPROFILE%\.ssh\id_ed25519.pub"
echo ============================================================
echo.
echo NEXT STEPS:
echo 1. Copy the SSH key above (entire line)
echo 2. Go to: https://github.com/settings/keys
echo 3. Click "New SSH key"
echo 4. Title: "3D Checkers Dev Machine"
echo 5. Paste the key
echo 6. Click "Add SSH key"
echo.
echo Opening GitHub SSH settings...
start https://github.com/settings/keys
echo.
pause

echo.
echo Testing SSH connection...
ssh -T git@github.com

echo.
echo To use SSH with your repository:
echo git remote set-url origin git@github.com:dorialn68/checkers.git
echo.
pause