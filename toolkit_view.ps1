# toolkit.ps1 - Final Version with Enhanced UI, Progress Bars, Caching, and Logging
# A professional-grade PowerShell script with advanced DevOps features.
# Created by Amit Bhardwaj - Salesforce Technical Architect

# --- Region: UI & Formatting Helpers ---

function Show-Banner {
    param([string]$Title)
    $line = "=" * ($Title.Length + 4)
    Write-Host "`n$line" -ForegroundColor DarkCyan
    Write-Host "  $Title  " -ForegroundColor White -BackgroundColor DarkCyan
    Write-Host "$line" -ForegroundColor DarkCyan
}

# --- Region: Project & Configuration Management ---
# (This section is unchanged)
# ...

# --- Region: Settings, Cache, and Log Management ---
# (This section is unchanged)
# ...

# --- Region: Core Functions with Progress Bars ---

function Deploy-Metadata {
    Show-Banner -Title "Deploy Metadata (Advanced)"
    Write-ToolkitLog -Level "INFO" -Message "Starting advanced deployment process."
    $targetOrg = Select-Org -PromptTitle "Select the TARGET org for deployment:"
    if (-not $targetOrg) { return }

    $manifestPath = Read-Host -Prompt "Enter path to package.xml (Default: .\package.xml)"
    if ([string]::IsNullOrWhiteSpace($manifestPath)) { $manifestPath = ".\package.xml" }
    if (-not (Test-Path $manifestPath)) { Write-Host "Manifest not found." -ForegroundColor Red; return }
    
    $sourcePath = Read-Host -Prompt "Enter path to source code (Default: current directory)"
    if ([string]::IsNullOrWhiteSpace($sourcePath)) { $sourcePath = ".\" }

    # --- Pre-Deployment Backup with Progress Bar ---
    $backupDir = ".\temp_backup_$(Get-Date -Format 'yyyyMMddHHmmss')"
    Write-Host "`nStep 1: Performing Pre-Deployment Backup from '$targetOrg'..." -ForegroundColor Yellow
    Write-ToolkitLog -Level "INFO" -Message "Starting backup from $targetOrg."
    
    # Start the job in the background and show progress
    $job = Start-Job -ScriptBlock { 
        param($manifest, $org, $dir)
        sf project retrieve start --manifest $manifest --target-org $org --output-dir $dir
    } -ArgumentList $manifestPath, $targetOrg, $backupDir
    
    while ($job.State -eq 'Running') {
        Write-Progress -Activity "Backing up metadata from $targetOrg" -Status "Retrieving..." -PercentComplete -1
        Start-Sleep -Seconds 1
    }
    
    $jobOutput = Receive-Job $job
    if ($job.State -ne 'Completed') { Write-Host "❌ Backup failed. Aborting deployment." -ForegroundColor Red; Write-ToolkitLog -Level "ERROR" -Message "Backup failed."; return }
    
    $backupZip = "backup-$($targetOrg)-$(Get-Date -Format 'yyyyMMddHHmmss').zip"
    Compress-Archive -Path "$($backupDir)\*" -DestinationPath $backupZip -Force
    Remove-Item -Recurse -Force $backupDir
    Write-Host "✅ Backup complete: $backupZip" -ForegroundColor Green
    Write-ToolkitLog -Level "INFO" -Message "Backup created at $backupZip"

    # --- Validation with Test Level ---
    Write-Host "`nStep 2: Validate Deployment" -ForegroundColor Yellow
    $testLevel = Read-Host -Prompt "Enter test level (e.g., RunLocalTests, RunAllTestsInOrg, RunSpecifiedTests)"
    # ... (rest of the prompts are the same)
    
    Write-Host "Running validation... This may take a while."
    $validationJob = Start-Job -ScriptBlock {
        param($cmd)
        & invoke-expression $cmd
    } -ArgumentList "$($validationCommand) --json"

    while ($validationJob.State -eq 'Running') {
        Write-Progress -Activity "Validating deployment against $targetOrg" -Status "Running Apex tests..." -PercentComplete -1
        Start-Sleep -Seconds 1
    }

    $validationResultJson = Receive-Job $validationJob
    $validationResult = $validationResultJson | ConvertFrom-Json

    if ($validationResult.status -ne 0) { Write-Host "❌ Validation failed: $($validationResult.message)" -ForegroundColor Red; return }

    # --- Enhanced Test Result Analysis Table ---
    $testResult = $validationResult.result.details.runTestResult
    if ($testResult) {
        Write-Host "`n--- Apex Test Results ---" -ForegroundColor Cyan
        $resultsForTable = @()
        $testResult.successes | ForEach-Object { $resultsForTable += [pscustomobject]@{ Status = "PASS"; Name = $_.name; Message = "OK" } }
        $testResult.failures | ForEach-Object { $resultsForTable += [pscustomobject]@{ Status = "FAIL"; Name = $_.name; Message = $_.message } }
        
        $resultsForTable | Format-Table -AutoSize | Out-String | Write-Host
        
        $coverage = if($testResult.codeCoverage) { "$($testResult.codeCoverage.coverage)%" } else { "N/A" }
        Write-Host "Code Coverage: $coverage" -ForegroundColor White
        if ($coverage -ne "N/A" -and $coverage.Trim('%') -lt 75) { Write-Host "WARNING: Code coverage is below 75%!" -ForegroundColor Yellow }
    }

    # --- Final Deployment ---
    # ... (Confirmation and final deployment logic with progress bar as above)
}

# --- Region: Main Menu Loop ---
Write-ToolkitLog -Level "INFO" -Message "Toolkit session started for project '$($Global:ProjectName)'."
do {
    Show-Banner -Title "Salesforce Toolkit [$($Global:ProjectName)] - Main Menu"
    # ... (Menu options are the same)
} while ($choice -ne 'q')
Write-ToolkitLog -Level "INFO" -Message "Toolkit session ended."

# --- Helper Functions, etc. (The rest of the script is the same as the previous full version)
# Ensure all other functions like Select-Project, Select-Org, Write-ToolkitLog, Get-ToolkitSettings, Set-ToolkitSettings, Clear-ToolkitCache,
# Show-SystemCheck, Install-MissingSoftware, Show-AuthorizedOrgs, Add-NewOrg, Show-OrgInfo, Generate-Manifest, Compare-Orgs,
# Show-DependencyAnalysis, Analyze-Permissions, and View-LogFile are included here.