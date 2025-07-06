# get-orgs.ps1
# PowerShell script to get list of authenticated Salesforce orgs
# Created by Amit Bhardwaj - Salesforce Technical Architect

param(
    [string]$OutputFormat = "json"
)

try {
    # Check if SF CLI is available
    $sfCommand = Get-Command sf -ErrorAction SilentlyContinue
    if (-not $sfCommand) {
        if ($OutputFormat -eq "json") {
            @{ error = "Salesforce CLI not found" } | ConvertTo-Json
        } else {
            Write-Host "Error: Salesforce CLI not found" -ForegroundColor Red
        }
        exit 1
    }

    # Get orgs list
    $orgsOutput = sf org list --json 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        if ($OutputFormat -eq "json") {
            $orgsOutput
        } else {
            $orgs = $orgsOutput | ConvertFrom-Json
            if ($orgs.result -and $orgs.result.Count -gt 0) {
                Write-Host "Authenticated Salesforce Orgs:" -ForegroundColor Cyan
                $orgs.result | Format-Table -AutoSize
            } else {
                Write-Host "No authenticated orgs found." -ForegroundColor Yellow
            }
        }
    } else {
        if ($OutputFormat -eq "json") {
            @{ error = "Failed to get orgs list"; output = $orgsOutput } | ConvertTo-Json
        } else {
            Write-Host "Error getting orgs list: $orgsOutput" -ForegroundColor Red
        }
        exit 1
    }
} catch {
    if ($OutputFormat -eq "json") {
        @{ error = $_.Exception.Message } | ConvertTo-Json
    } else {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    exit 1
}