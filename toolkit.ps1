# toolkit.ps1
# A Comprehensive PowerShell script for Salesforce CLI operations, mirroring the full application functionality.
# Created by Amit Bhardwaj - Salesforce Technical Architect

# --- Function 1: System Prerequisite Check ---
function Show-SystemCheck {
    Write-Host "`n--- Running System Check ---" -ForegroundColor Cyan
    $softwareToCheck = @(
        @{ Name = "Salesforce CLI"; Command = "sf"; Argument = "--version"; Required = $true; DownloadUrl = "https://developer.salesforce.com/tools/sfdxcli" },
        @{ Name = "Node.js"; Command = "node"; Argument = "--version"; Required = $true; DownloadUrl = "https://nodejs.org/" },
        @{ Name = "NPM"; Command = "npm"; Argument = "--version"; Required = $true; DownloadUrl = "https://nodejs.org/" },
        @{ Name = "Git"; Command = "git"; Argument = "--version"; Required = $false; DownloadUrl = "https://git-scm.com/downloads" },
        @{ Name = "VS Code"; Command = "code"; Argument = "--version"; Required = $false; DownloadUrl = "https://code.visualstudio.com/" }
    )
    $allRequiredInstalled = $true
    foreach ($software in $softwareToCheck) {
        $command = $software.Command
        $argument = $software.Argument
        $name = $software.Name
        Write-Host "Checking for $($name)..." -NoNewline
        $found = Get-Command $command -ErrorAction SilentlyContinue
        if ($found) {
            $versionOutput = & $command $argument 2>&1 | Out-String
            if ($LASTEXITCODE -eq 0) {
                Write-Host " [FOUND]" -ForegroundColor Green; Write-Host "   - Version: $($versionOutput.Trim())"
            } else {
                Write-Host " [FOUND, BUT VERSION ERROR]" -ForegroundColor Yellow
                if ($software.Required) { $allRequiredInstalled = $false }
            }
        } else {
            Write-Host " [NOT FOUND]" -ForegroundColor Red; Write-Host "   - Download from: $($software.DownloadUrl)"
            if ($software.Required) { $allRequiredInstalled = $false }
        }
    }
    Write-Host "------------------------------------------"
    if ($allRequiredInstalled) { Write-Host "✅ System Ready: All required software is installed." -ForegroundColor Green }
    else { Write-Host "❌ Action Required: Please install the missing required software." -ForegroundColor Red }
    Write-Host "------------------------------------------"
}

# --- Helper Function: Select an Org ---
function Select-Org {
    param($PromptTitle)
    Write-Host "`n$PromptTitle" -ForegroundColor Cyan
    $orgs = sf org list --json | ConvertFrom-Json
    if (-not ($orgs -and $orgs.result)) {
        Write-Host "No authorized orgs found. Please add an org first." -ForegroundColor Red
        return $null
    }
    for ($i = 0; $i -lt $orgs.result.Length; $i++) {
        Write-Host ("{0}: {1} ({2})" -f ($i + 1), $orgs.result[$i].alias, $orgs.result[$i].username)
    }
    $choice = Read-Host -Prompt "Select an org by number"
    if ($choice -match '^\d+$' -and [int]$choice -gt 0 -and [int]$choice -le $orgs.result.Length) {
        return $orgs.result[[int]$choice - 1].alias
    } else {
        Write-Host "Invalid selection." -ForegroundColor Red
        return $null
    }
}

# --- Function 2: List Authorized Orgs ---
function Show-AuthorizedOrgs {
    Write-Host "`n--- Listing Authorized Salesforce Orgs ---" -ForegroundColor Cyan
    if (-not (Get-Command sf -ErrorAction SilentlyContinue)) { Write-Host "Salesforce CLI not found." -ForegroundColor Red; return }
    Write-Host "Fetching org list..."
    $orgs = sf org list --json | ConvertFrom-Json
    if ($orgs -and $orgs.result) {
        $orgs.result | Format-Table -AutoSize
    } else {
        Write-Host "No Salesforce orgs are currently authorized." -ForegroundColor Yellow
    }
    Write-Host "------------------------------------------"
}

# --- Function 3: Add a New Org ---
function Add-NewOrg {
    Write-Host "`n--- Add / Authorize a New Salesforce Org ---" -ForegroundColor Cyan
    if (-not (Get-Command sf -ErrorAction SilentlyContinue)) { Write-Host "Salesforce CLI not found." -ForegroundColor Red; return }
    $alias = Read-Host -Prompt "Enter a unique alias for this org (e.g., my-dev-sandbox)"
    if ([string]::IsNullOrWhiteSpace($alias)) { Write-Host "Alias cannot be empty." -ForegroundColor Red; return }
    Write-Host "A browser window will now open for authentication..." -ForegroundColor Yellow
    sf org login web --alias $alias
    if ($LASTEXITCODE -eq 0) { Write-Host "✅ Successfully authorized org with alias '$alias'." -ForegroundColor Green }
    else { Write-Host "❌ Org authorization failed." -ForegroundColor Red }
    Write-Host "------------------------------------------"
}

# --- Function 4: Get Org Information ---
function Show-OrgInfo {
    $orgAlias = Select-Org -PromptTitle "Select an org to display information for:"
    if (-not $orgAlias) { return }
    Write-Host "`nFetching details for '$orgAlias'..."
    sf org display --target-org $orgAlias
    Write-Host "------------------------------------------"
}

# --- Function 5: Generate Manifest (package.xml) ---
function Generate-Manifest {
    $orgAlias = Select-Org -PromptTitle "Select an org to generate a manifest from:"
    if (-not $orgAlias) { return }
    
    Write-Host "`nFetching metadata types from '$orgAlias'. This may take a moment..."
    $metadata = sf project list metadata-types --target-org $orgAlias --json | ConvertFrom-Json
    
    if (-not $metadata.result) { Write-Host "Could not fetch metadata types." -ForegroundColor Red; return }

    Write-Host "Available Metadata Types:"
    for ($i = 0; $i -lt $metadata.result.Length; $i++) {
        Write-Host ("{0}: {1}" -f ($i + 1), $metadata.result[$i].name)
    }

    $choices = Read-Host -Prompt "`nEnter the numbers of the types to include, separated by commas (e.g., 1,5,12), or type 'all'"
    $selectedTypes = @()
    if ($choices -eq 'all') {
        $selectedTypes = $metadata.result
    } else {
        $indices = $choices -split ',' | ForEach-Object { $_.Trim() }
        foreach ($index in $indices) {
            if ($index -match '^\d+$' -and [int]$index -gt 0 -and [int]$index -le $metadata.result.Length) {
                $selectedTypes += $metadata.result[[int]$index - 1]
            }
        }
    }
    
    if ($selectedTypes.Length -eq 0) { Write-Host "No valid types selected." -ForegroundColor Red; return }

    $manifestContent = @"
<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    $($selectedTypes | ForEach-Object {
    "    <types>`n        <members>*</members>`n        <name>$($_.name)</name>`n    </types>"
})
    <version>61.0</version>
</Package>
"@
    $filePath = ".\package.xml"
    $manifestContent | Out-File -FilePath $filePath -Encoding UTF8
    Write-Host "`n✅ Manifest file 'package.xml' has been generated in the current directory." -ForegroundColor Green
    Write-Host "   Path: $(Resolve-Path $filePath)"
    Write-Host "------------------------------------------"
}

# --- Function 6: Compare Two Orgs ---
function Compare-Orgs {
    Write-Host "`n--- Compare Metadata Between Two Orgs ---" -ForegroundColor Cyan
    $sourceOrg = Select-Org -PromptTitle "Select your SOURCE org:"
    if (-not $sourceOrg) { return }
    $targetOrg = Select-Org -PromptTitle "Select your TARGET org:"
    if (-not $targetOrg) { return }
    
    $manifestPath = Read-Host -Prompt "Enter the path to your package.xml manifest (or press Enter for '.\package.xml')"
    if ([string]::IsNullOrWhiteSpace($manifestPath)) { $manifestPath = ".\package.xml" }
    if (-not (Test-Path $manifestPath)) { Write-Host "Manifest file not found at '$manifestPath'." -ForegroundColor Red; return }

    Write-Host "`nStarting comparison... This may take a while." -ForegroundColor Yellow
    Write-Host "1. Retrieving metadata from SOURCE org '$sourceOrg'..."
    sf project retrieve start --manifest $manifestPath --target-org $sourceOrg --output-dir ".\temp_source"
    
    Write-Host "2. Retrieving metadata from TARGET org '$targetOrg'..."
    sf project retrieve start --manifest $manifestPath --target-org $targetOrg --output-dir ".\temp_target"

    Write-Host "3. Comparing metadata using VS Code..."
    if (Get-Command code -ErrorAction SilentlyContinue) {
        code --diff ".\temp_source" ".\temp_target"
        Write-Host "✅ Comparison opened in VS Code." -ForegroundColor Green
    } else {
        Write-Host "VS Code 'code' command not found. Please compare the folders manually:" -ForegroundColor Yellow
        Write-Host "   - Source: $(Resolve-Path .\temp_source)"
        Write-Host "   - Target: $(Resolve-Path .\temp_target)"
    }
    
    # Cleanup
    # Read-Host "Press enter to remove temporary comparison folders."
    # Remove-Item -Recurse -Force ".\temp_source", ".\temp_target"
    Write-Host "Temporary folders 'temp_source' and 'temp_target' have been created for comparison."
    Write-Host "------------------------------------------"
}

# --- Function 7: Deploy Metadata ---
function Deploy-Metadata {
    Write-Host "`n--- Deploy Metadata to an Org ---" -ForegroundColor Cyan
    $targetOrg = Select-Org -PromptTitle "Select the TARGET org for deployment:"
    if (-not $targetOrg) { return }

    $manifestPath = Read-Host -Prompt "Enter the path to your package.xml manifest (or press Enter for '.\package.xml')"
    if ([string]::IsNullOrWhiteSpace($manifestPath)) { $manifestPath = ".\package.xml" }
    if (-not (Test-Path $manifestPath)) { Write-Host "Manifest file not found at '$manifestPath'." -ForegroundColor Red; return }

    $sourcePath = Read-Host -Prompt "Enter the path to the source code to deploy (or press Enter for '.\')"
    if ([string]::IsNullOrWhiteSpace($sourcePath)) { $sourcePath = ".\" }
    if (-not (Test-Path $sourcePath)) { Write-Host "Source path not found at '$sourcePath'." -ForegroundColor Red; return }

    Write-Host "`nStep 1: Validate Deployment" -ForegroundColor Yellow
    Write-Host "Running validation against '$targetOrg'. This is a check-only deployment."
    sf project deploy validate --manifest $manifestPath --source-dir $sourcePath --target-org $targetOrg
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Validation failed. Please review the errors above and try again." -ForegroundColor Red
        return
    }

    Write-Host "✅ Validation successful." -ForegroundColor Green
    
    Write-Host "`nStep 2: Confirm Deployment" -ForegroundColor Yellow
    Write-Host "You are about to deploy to '$targetOrg'. This action may overwrite metadata." -ForegroundColor Red
    $confirmation = Read-Host -Prompt "To proceed, type the org alias '$targetOrg' exactly"
    
    if ($confirmation -ne $targetOrg) {
        Write-Host "Confirmation did not match. Deployment cancelled."
        return
    }

    Write-Host "`nStep 3: Executing Deployment..." -ForegroundColor Yellow
    sf project deploy start --manifest $manifestPath --source-dir $sourcePath --target-org $targetOrg
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Deployment failed. Please review the errors above." -ForegroundColor Red
    }
    Write-Host "------------------------------------------"
}


# --- Main Menu Loop ---
do {
    Write-Host "`nSalesforce Toolkit - Main Menu" -ForegroundColor White
    Write-Host "--------------------------------"
    Write-Host "1. System Check"
    Write-Host "2. List Authorized Orgs"
    Write-Host "3. Add a New Org"
    Write-Host "4. Get Org Information"
    Write-Host "5. Generate package.xml Manifest"
    Write-Host "6. Compare Two Orgs"
    Write-Host "7. Deploy Metadata"
    Write-Host "Q. Quit"
    Write-Host "--------------------------------"
    $choice = Read-Host -Prompt "Please enter your choice"

    switch ($choice) {
        "1" { Show-SystemCheck }
        "2" { Show-AuthorizedOrgs }
        "3" { Add-NewOrg }
        "4" { Show-OrgInfo }
        "5" { Generate-Manifest }
        "6" { Compare-Orgs }
        "7" { Deploy-Metadata }
        "q" { Write-Host "Exiting Toolkit. Goodbye!"; break }
        default { Write-Host "Invalid option. Please try again." -ForegroundColor Red }
    }

    if ($choice -ne 'q') {
        Read-Host -Prompt "Press Enter to return to the menu..."
    }

} while ($choice -ne 'q')