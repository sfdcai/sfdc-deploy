# get-org-info.ps1
# PowerShell script to get detailed information about a specific Salesforce org
# Created by Amit Bhardwaj - Salesforce Technical Architect

param(
    [Parameter(Mandatory=$true)]
    [string]$OrgAlias,
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

    # Get org info
    $orgOutput = sf org display --target-org $OrgAlias --json 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        if ($OutputFormat -eq "json") {
            $orgOutput
        } else {
            $org = $orgOutput | ConvertFrom-Json
            Write-Host "Org Information for '$OrgAlias':" -ForegroundColor Cyan
            Write-Host "--------------------------------"
            Write-Host "Org ID: $($org.result.id)"
            Write-Host "Username: $($org.result.username)"
            Write-Host "Instance URL: $($org.result.instanceUrl)"
            Write-Host "API Version: $($org.result.apiVersion)"
            Write-Host "Status: $($org.result.connectedStatus)"
        }
    } else {
        if ($OutputFormat -eq "json") {
            @{ error = "Failed to get org info"; output = $orgOutput } | ConvertTo-Json
        } else {
            Write-Host "Error getting org info: $orgOutput" -ForegroundColor Red
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