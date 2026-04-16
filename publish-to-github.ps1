#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Publish oh-my-kimi to GitHub
.DESCRIPTION
    Creates GitHub repository and pushes code using GitHub API
.NOTES
    Requires GitHub Personal Access Token with 'repo' scope
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$Token
)

$ErrorActionPreference = "Stop"

$headers = @{
    "Authorization" = "token $Token"
    "Accept" = "application/vnd.github.v3+json"
    "User-Agent" = "oh-my-kimi-publish"
}

$body = @{
    name = "oh-my-kimi"
    description = "Workflow orchestration layer for Kimi Code CLI - Inspired by oh-my-codex"
    private = $false
    auto_init = $false
} | ConvertTo-Json

Write-Host "Creating GitHub repository..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method Post -Headers $headers -Body $body -ContentType "application/json"
    Write-Host "✓ Repository created successfully!" -ForegroundColor Green
    Write-Host "  URL: $($response.html_url)" -ForegroundColor Gray
    Write-Host ""
    
    # Configure git remote
    Write-Host "Configuring git remote..." -ForegroundColor Cyan
    git remote remove origin 2>$null
    git remote add origin $response.clone_url
    Write-Host "✓ Remote configured" -ForegroundColor Green
    Write-Host ""
    
    # Push code
    Write-Host "Pushing code to GitHub..." -ForegroundColor Cyan
    git push -u origin master
    Write-Host "✓ Code pushed successfully!" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Successfully published to GitHub!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Repository: $($response.html_url)" -ForegroundColor White
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Visit your repository: $($response.html_url)" -ForegroundColor White
    Write-Host "  2. Create a release at: $($response.html_url)/releases/new" -ForegroundColor White
    Write-Host "  3. Tag: v0.1.0" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "✗ Error: $_" -ForegroundColor Red
    exit 1
}
