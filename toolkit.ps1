# toolkit.ps1 - Non-Interactive Engine Version
# This script is designed to be called by an external application like Electron.

param (
    [string]$CommandToRun,
    [string]$ProjectName,
    [string]$Alias,
    [string]$ManifestPath,
    [string]$SourcePath,
    [string]$TargetOrg,
    [string]$TestLevel,
    [string]$TestsToRun
)

# --- Global Setup ---
if ($PSScriptRoot) { $scriptDir = $PSScriptRoot } else { $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition }
$Global:ConfigDir = Join-Path -Path $scriptDir -ChildPath "configs"
if (-not (Test-Path $Global:ConfigDir)) { New-Item -Path $Global:ConfigDir -ItemType Directory | Out-Null }
if ($ProjectName) {
    $Global:ProjectConfigFile = Join-Path -Path $Global:ConfigDir -ChildPath "$($ProjectName).json"
    $Global:LogFilePath = Join-Path -Path $Global:ConfigDir -ChildPath "$($ProjectName).log"
}

# --- All Function Definitions ---
function Get-ProjectList {
    $configDir = Join-Path -Path (Split-Path -Parent $MyInvocation.MyCommand.Definition) -ChildPath "configs"
    if (Test-Path $configDir) {
        Get-ChildItem -Path $configDir -Filter "*.json" | ForEach-Object { $_.BaseName }
    }
}

function Add-NewOrg {
    if ([string]::IsNullOrWhiteSpace($Alias)) { Write-Error "Alias parameter is required for Add-NewOrg."; exit 1 }
    sf org login web --alias $Alias
}

function Show-SystemCheck {
    Write-Host "Running System Check..."
    # This is a simplified version for the engine. The interactive parts are in the UI.
    $softwareToCheck = @( @{ N="Salesforce CLI"; C="sf"; R=$true }, @{ N="Node.js"; C="node"; R=$true } )
    foreach ($s in $softwareToCheck) {
        if (Get-Command $s.C -EA SilentlyContinue) { Write-Host "$($s.N): [FOUND]" }
        else { Write-Host "$($s.N): [NOT FOUND]" }
    }
}

function Show-AuthorizedOrgs {
    sf org list
}

function Show-SfCommandHelp {
    Write-Host "--- Common Salesforce CLI Commands ---"
    Write-Host "Org Management:"
    Write-Host "  sf org list                      - List all authorized orgs."
    Write-Host "  sf org display -o <alias>        - Display details for a specific org."
    Write-Host "Metadata:"
    Write-Host "  sf project retrieve start -m ... - Retrieve metadata."
    Write-Host "  sf project deploy start -d ...   - Deploy metadata."
}

# --- Main Execution Logic ---
if (-not [string]::IsNullOrWhiteSpace($CommandToRun)) {
    if (Get-Command $CommandToRun -ErrorAction SilentlyContinue) {
        & $CommandToRun
    } else {
        Write-Error "Command '$CommandToRun' not found in toolkit."
    }
} else {
    # This branch is primarily for Get-ProjectList which doesn't need a project context
    if ($CommandToRun -eq "Get-ProjectList") {
        Get-ProjectList
    } else {
        Write-Error "No command specified. This script must be run with the -CommandToRun parameter."
    }
}
