# system-check.ps1
# PowerShell script to verify required software for the Salesforce Toolkit.
# Created by Amit Bhardwaj - Salesforce Technical Architect

param(
    [string]$OutputFormat = "json"
)

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

$results = @()

foreach ($software in $softwareToCheck) {
    $command = $software.Command
    $argument = $software.Argument
    $name = $software.Name

    # Check if the command exists
    $found = Get-Command $command -ErrorAction SilentlyContinue

    if ($found) {
        # If found, execute the command to get the version
        try {
            $versionOutput = & $command $argument 2>&1 | Out-String
            
            if ($LASTEXITCODE -eq 0) {
                $version = $versionOutput.Trim()
                $results += @{
                    Name = $name
                    Command = $command
                    Installed = $true
                    Version = $version
                    Required = $software.Required
                    DownloadUrl = $software.DownloadUrl
                }
            } else {
                $results += @{
                    Name = $name
                    Command = $command
                    Installed = $false
                    Version = $null
                    Required = $software.Required
                    DownloadUrl = $software.DownloadUrl
                    Error = $versionOutput.Trim()
                }
            }
        } catch {
            $results += @{
                Name = $name
                Command = $command
                Installed = $false
                Version = $null
                Required = $software.Required
                DownloadUrl = $software.DownloadUrl
                Error = $_.Exception.Message
            }
        }
    } else {
        $results += @{
            Name = $name
            Command = $command
            Installed = $false
            Version = $null
            Required = $software.Required
            DownloadUrl = $software.DownloadUrl
        }
    }
}

if ($OutputFormat -eq "json") {
    $results | ConvertTo-Json -Depth 3
} else {
    Write-Host "--- Salesforce Toolkit System Check ---" -ForegroundColor Cyan
    Write-Host "Created by Amit Bhardwaj - Salesforce Technical Architect"
    Write-Host "------------------------------------------"
    
    foreach ($result in $results) {
        if ($result.Installed) {
            Write-Host "$($result.Name): [FOUND] - Version: $($result.Version)" -ForegroundColor Green
        } else {
            Write-Host "$($result.Name): [NOT FOUND] - Download: $($result.DownloadUrl)" -ForegroundColor Red
        }
    }
    
    $allRequiredInstalled = ($results | Where-Object { $_.Required -and -not $_.Installed }).Count -eq 0
    
    Write-Host "------------------------------------------"
    if ($allRequiredInstalled) {
        Write-Host "✅ System Ready: All required software is installed." -ForegroundColor Green
    } else {
        Write-Host "❌ Action Required: Please install the missing required software." -ForegroundColor Red
    }
    Write-Host "------------------------------------------"
}