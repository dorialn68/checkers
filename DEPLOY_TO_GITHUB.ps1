# 3D Checkers Pro - GitHub Deployment Script
# PowerShell version with enhanced features

$ErrorActionPreference = "Stop"

function Show-Banner {
    Clear-Host
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "     3D CHECKERS PRO - GITHUB DEPLOYMENT WIZARD" -ForegroundColor Yellow
    Write-Host "     Complete Automated Setup v2.0" -ForegroundColor Yellow
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

function Test-Prerequisites {
    Write-Host "Checking prerequisites..." -ForegroundColor Yellow
    
    $issues = @()
    
    if (-not (Test-Command "git")) {
        $issues += "Git is not installed. Download from: https://git-scm.com/"
    }
    
    if (-not (Test-Command "gh")) {
        $issues += "GitHub CLI is not installed. Download from: https://cli.github.com/"
    }
    
    if ($issues.Count -gt 0) {
        Write-Host ""
        Write-Host "Prerequisites missing:" -ForegroundColor Red
        $issues | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
        Write-Host ""
        
        $install = Read-Host "Would you like to install missing tools automatically? (Y/N)"
        if ($install -eq 'Y') {
            Install-MissingTools
        } else {
            Write-Host "Please install the missing tools and run again." -ForegroundColor Yellow
            Read-Host "Press Enter to exit"
            exit 1
        }
    } else {
        Write-Host "✓ All prerequisites installed" -ForegroundColor Green
    }
}

function Install-MissingTools {
    Write-Host "Installing missing tools..." -ForegroundColor Yellow
    
    # Install Git if missing
    if (-not (Test-Command "git")) {
        Write-Host "Installing Git..." -ForegroundColor Cyan
        winget install --id Git.Git -e --source winget
    }
    
    # Install GitHub CLI if missing
    if (-not (Test-Command "gh")) {
        Write-Host "Installing GitHub CLI..." -ForegroundColor Cyan
        winget install --id GitHub.cli -e --source winget
    }
    
    Write-Host "Installation complete. Please restart PowerShell and run the script again." -ForegroundColor Green
    Read-Host "Press Enter to exit"
    exit 0
}

function Authenticate-GitHub {
    Write-Host "STEP 1: GitHub Authentication" -ForegroundColor Yellow
    Write-Host "=============================" -ForegroundColor Yellow
    Write-Host ""
    
    # Check if already authenticated
    $authStatus = gh auth status 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Already authenticated with GitHub" -ForegroundColor Green
        $username = gh api user --jq .login
        Write-Host "  Username: $username" -ForegroundColor Cyan
        return $username
    }
    
    Write-Host "Choose authentication method:" -ForegroundColor White
    Write-Host "[1] Browser Authentication (Recommended)" -ForegroundColor Cyan
    Write-Host "[2] Personal Access Token" -ForegroundColor Cyan
    Write-Host ""
    
    $choice = Read-Host "Enter choice (1-2)"
    
    switch ($choice) {
        "1" {
            Write-Host ""
            Write-Host "Opening browser for authentication..." -ForegroundColor Yellow
            Write-Host "Follow the instructions in your browser" -ForegroundColor Yellow
            gh auth login --web
            if ($LASTEXITCODE -ne 0) {
                throw "Authentication failed"
            }
        }
        "2" {
            Write-Host ""
            Write-Host "Opening GitHub token page..." -ForegroundColor Yellow
            Start-Process "https://github.com/settings/tokens/new?description=3D-Checkers-Deploy&scopes=repo,workflow,write:packages"
            
            Write-Host ""
            Write-Host "In the browser:" -ForegroundColor Cyan
            Write-Host "  1. Set token name: '3D Checkers Deploy'" -ForegroundColor White
            Write-Host "  2. Set expiration: 90 days or more" -ForegroundColor White
            Write-Host "  3. Scopes are pre-selected" -ForegroundColor White
            Write-Host "  4. Click 'Generate token'" -ForegroundColor White
            Write-Host "  5. Copy the token (starts with ghp_)" -ForegroundColor White
            Write-Host ""
            
            $token = Read-Host "Paste your token here" -AsSecureString
            $tokenPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($token))
            
            $tokenPlain | gh auth login --with-token
            if ($LASTEXITCODE -ne 0) {
                throw "Authentication failed"
            }
        }
    }
    
    $username = gh api user --jq .login
    Write-Host ""
    Write-Host "✓ Authenticated successfully as: $username" -ForegroundColor Green
    return $username
}

function Create-Repository {
    param($username)
    
    Write-Host ""
    Write-Host "STEP 2: Repository Creation" -ForegroundColor Yellow
    Write-Host "===========================" -ForegroundColor Yellow
    Write-Host ""
    
    $repoName = "checkers"
    $repoUrl = "https://github.com/$username/$repoName"
    
    # Check if repo exists
    $exists = gh repo view "$username/$repoName" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Repository already exists at: $repoUrl" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "[1] Delete and recreate" -ForegroundColor Cyan
        Write-Host "[2] Update existing repository" -ForegroundColor Cyan
        Write-Host "[3] Cancel" -ForegroundColor Cyan
        Write-Host ""
        
        $choice = Read-Host "Enter choice (1-3)"
        
        switch ($choice) {
            "1" {
                Write-Host "Deleting existing repository..." -ForegroundColor Yellow
                gh repo delete "$username/$repoName" --yes
                Start-Sleep -Seconds 3
                
                Write-Host "Creating new repository..." -ForegroundColor Yellow
                gh repo create $repoName --public `
                    --description "3D Checkers Pro - AI-Powered Checkers Game with Three.js" `
                    --homepage "https://$username.github.io/$repoName/"
            }
            "2" {
                Write-Host "Using existing repository" -ForegroundColor Green
            }
            "3" {
                Write-Host "Deployment cancelled" -ForegroundColor Yellow
                exit 0
            }
        }
    } else {
        Write-Host "Creating new repository..." -ForegroundColor Yellow
        gh repo create $repoName --public `
            --description "3D Checkers Pro - AI-Powered Checkers Game with Three.js" `
            --homepage "https://$username.github.io/$repoName/"
    }
    
    Write-Host "✓ Repository ready at: $repoUrl" -ForegroundColor Green
}

function Upload-Files {
    param($username)
    
    Write-Host ""
    Write-Host "STEP 3: Uploading Files" -ForegroundColor Yellow
    Write-Host "=======================" -ForegroundColor Yellow
    Write-Host ""
    
    # Configure git
    Write-Host "Configuring Git..." -ForegroundColor Cyan
    git config user.name "$username" 2>$null
    git config user.email "$username@users.noreply.github.com" 2>$null
    
    # Set remote
    Write-Host "Setting remote origin..." -ForegroundColor Cyan
    git remote remove origin 2>$null
    git remote add origin "https://github.com/$username/checkers.git"
    
    # Push files
    Write-Host "Pushing files to GitHub..." -ForegroundColor Cyan
    git branch -M main
    git push -u origin main --force
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Retrying with alternative method..." -ForegroundColor Yellow
        git push --set-upstream origin main --force
    }
    
    Write-Host "✓ Files uploaded successfully" -ForegroundColor Green
}

function Enable-GitHubPages {
    param($username)
    
    Write-Host ""
    Write-Host "STEP 4: Enabling GitHub Pages" -ForegroundColor Yellow
    Write-Host "=============================" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "Enabling GitHub Pages..." -ForegroundColor Cyan
    
    $response = gh api "repos/$username/checkers/pages" -X POST `
        -H "Accept: application/vnd.github.v3+json" `
        -f "source[branch]=main" `
        -f "source[path]=/" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ GitHub Pages enabled successfully" -ForegroundColor Green
        Write-Host "  Your game will be live at: https://$username.github.io/checkers/" -ForegroundColor Cyan
        Write-Host "  (May take 2-5 minutes to activate)" -ForegroundColor Yellow
    } else {
        if ($response -match "already exists") {
            Write-Host "✓ GitHub Pages already enabled" -ForegroundColor Green
        } else {
            Write-Host "⚠ Please enable GitHub Pages manually:" -ForegroundColor Yellow
            Write-Host "  1. Go to: https://github.com/$username/checkers/settings/pages" -ForegroundColor White
            Write-Host "  2. Under Source, select 'Deploy from a branch'" -ForegroundColor White
            Write-Host "  3. Select 'main' branch and '/ (root)'" -ForegroundColor White
            Write-Host "  4. Click Save" -ForegroundColor White
        }
    }
}

function Configure-Repository {
    param($username)
    
    Write-Host ""
    Write-Host "STEP 5: Configuring Repository" -ForegroundColor Yellow
    Write-Host "==============================" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "Adding repository topics..." -ForegroundColor Cyan
    gh repo edit "$username/checkers" `
        --add-topic "game" `
        --add-topic "checkers" `
        --add-topic "3d" `
        --add-topic "ai" `
        --add-topic "javascript" `
        --add-topic "threejs" `
        --add-topic "open-source" 2>$null
    
    Write-Host "Enabling features..." -ForegroundColor Cyan
    gh api "repos/$username/checkers" -X PATCH `
        -f has_issues=true `
        -f has_projects=true `
        -f has_wiki=false 2>$null
    
    Write-Host "✓ Repository configured" -ForegroundColor Green
}

function Show-Success {
    param($username)
    
    Clear-Host
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "     🎉 DEPLOYMENT COMPLETE! 🎉" -ForegroundColor Yellow
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your 3D Checkers game is now live!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📦 Repository:" -ForegroundColor Yellow
    Write-Host "   https://github.com/$username/checkers" -ForegroundColor White
    Write-Host ""
    Write-Host "🎮 Play Game (live in 2-5 minutes):" -ForegroundColor Yellow
    Write-Host "   https://$username.github.io/checkers/" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Yellow
    Write-Host "   1. Star your repository" -ForegroundColor White
    Write-Host "   2. Share on LinkedIn" -ForegroundColor White
    Write-Host "   3. Invite contributors" -ForegroundColor White
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "[1] Open repository in browser" -ForegroundColor Cyan
    Write-Host "[2] Open live game" -ForegroundColor Cyan
    Write-Host "[3] Copy LinkedIn message to clipboard" -ForegroundColor Cyan
    Write-Host "[4] Exit" -ForegroundColor Cyan
    Write-Host ""
    
    $choice = Read-Host "Enter choice (1-4)"
    
    switch ($choice) {
        "1" { Start-Process "https://github.com/$username/checkers" }
        "2" { Start-Process "https://$username.github.io/checkers/" }
        "3" {
            $message = @"
🎮 Excited to share my open-source 3D Checkers game!

Play it live: https://$username.github.io/checkers/
Source code: https://github.com/$username/checkers

Features:
✨ Beautiful 3D graphics with Three.js
🤖 AI opponent with 4 difficulty levels
💡 Real-time move suggestions
🎯 Customizable game rules
🐳 Docker support

Built with #JavaScript #ThreeJS #AI #OpenSource #GameDev

Looking for contributors! ⭐ Star the repo if you like it!
"@
            $message | Set-Clipboard
            Write-Host ""
            Write-Host "✓ LinkedIn message copied to clipboard!" -ForegroundColor Green
            Write-Host ""
            Read-Host "Press Enter to exit"
        }
    }
}

# Main execution
try {
    Show-Banner
    Test-Prerequisites
    
    Write-Host ""
    Write-Host "Starting deployment process..." -ForegroundColor Cyan
    Write-Host ""
    
    $username = Authenticate-GitHub
    Create-Repository -username $username
    Upload-Files -username $username
    Enable-GitHubPages -username $username
    Configure-Repository -username $username
    
    Show-Success -username $username
    
} catch {
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}