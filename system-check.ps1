# system-check.ps1
# Standalone PowerShell script to verify required software for the Salesforce Toolkit.

# --- Configuration ---
$softwareToCheck = @(
    @{
        Name = "Salesforce CLI";
        Command = "sf";
        Argument = "--version";
        Required = $true;
        DownloadUrl = "https://developer.salesforce.com/tools/sfdxcli";
    },
    @{
        Name = "Node.js";
        Command = "node";
        Argument = "--version";
        Required = $true;
        DownloadUrl = "https://nodejs.org/";
    },
    @{
        Name = "NPM";
        Command = "npm";
        Argument = "--version";
        Required = $true;
        DownloadUrl = "https://nodejs.org/";
    },
    @{
        Name = "Git";
        Command = "git";
        Argument = "--version";
        Required = $false;
        DownloadUrl = "https://git-scm.com/downloads";
    },
    @{
        Name = "VS Code";
        Command = "code";
        Argument = "--version";
        Required = $false;
        DownloadUrl = "https://code.visualstudio.com/";
    }
)

# --- Main Script ---
Write-Host "--- Salesforce Toolkit System Check ---" -ForegroundColor Cyan
Write-Host "Created by Amit Bhardwaj - Salesforce Technical Architect"
Write-Host "------------------------------------------"
Write-Host

$allRequiredInstalled = $true

foreach ($software in $softwareToCheck) {
    $command = $software.Command
    $argument = $software.Argument
    $name = $software.Name

    Write-Host "Checking for $($name)..." -NoNewline

    # Check if the command exists
    $found = Get-Command $command -ErrorAction SilentlyContinue

    if ($found) {
        # If found, execute the command to get the version
        $versionOutput = & $command $argument 2>&1 | Out-String
        
        if ($LASTEXITCODE -eq 0) {
            $version = $versionOutput.Trim()
            Write-Host " [FOUND]" -ForegroundColor Green
            Write-Host "   - Version: $version"
        } else {
            Write-Host " [FOUND, BUT ERROR GETTING VERSION]" -ForegroundColor Yellow
            Write-Host "   - Error: $($versionOutput.Trim())"
            if ($software.Required) { $allRequiredInstalled = $false }
        }
    } else {
        Write-Host " [NOT FOUND]" -ForegroundColor Red
        Write-Host "   - Download from: $($software.DownloadUrl)"
        if ($software.Required) { $allRequiredInstalled = $false }
    }
    Write-Host
}

# --- Final Summary ---
Write-Host "------------------------------------------"
if ($allRequiredInstalled) {
    Write-Host "✅ System Ready: All required software is installed." -ForegroundColor Green
} else {
    Write-Host "❌ Action Required: Please install the missing required software listed above." -ForegroundColor Red
}
Write-Host "------------------------------------------"