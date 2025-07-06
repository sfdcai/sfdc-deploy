# toolkit.ps1 - Definitive Final Version
# A professional-grade PowerShell script with project profiles, auto-installation, advanced DevOps features, and intelligent caching.
# Created by Amit Bhardwaj - Salesforce Technical Architect

# --- Region: UI & Formatting Helpers ---

function Show-CreditHeader {
    $credit = "Created by Amit Bhardwaj (linkedin.com/in/salesforce-technical-architect)"
    try {
        $width = $Host.UI.RawUI.WindowSize.Width
        $padding = [math]::Floor(($width - $credit.Length) / 2)
        $paddingString = " " * $padding
        Write-Host ("`n" + $paddingString + $credit) -ForegroundColor DarkGray
    } catch {
        # Fallback for environments where window size can't be determined
        Write-Host "`n$credit" -ForegroundColor DarkGray
    }
}

function Show-Banner {
    param([string]$Title)
    $line = "=" * ($Title.Length + 4)
    Write-Host "`n$line" -ForegroundColor DarkCyan
    Write-Host "  $Title  " -ForegroundColor White -BackgroundColor DarkCyan
    Write-Host "$line" -ForegroundColor DarkCyan
}

# --- Region: Project & Configuration Management ---

function Select-Project {
    Write-Host "`n--- Welcome to the Salesforce Toolkit ---" -ForegroundColor White
    $configDir = Join-Path -Path $PSScriptRoot -ChildPath "configs"
    if (-not (Test-Path $configDir)) {
        New-Item -Path $configDir -ItemType Directory | Out-Null
    }

    $configs = Get-ChildItem -Path $configDir -Filter "*.json"
    if ($configs.Count -eq 0) {
        Write-Host "No projects found. Let's create your first one." -ForegroundColor Yellow
        $projectName = Read-Host -Prompt "Enter a name for your new project (e.g., 'Project-X-Sandbox')"
        if ([string]::IsNullOrWhiteSpace($projectName)) { $projectName = "default-project" }
        $Global:ProjectConfigFile = Join-Path -Path $configDir -ChildPath "$($projectName).json"
        return
    }

    Write-Host "Please select a project:"
    for ($i = 0; $i -lt $configs.Count; $i++) {
        Write-Host ("{0}: {1}" -f ($i + 1), $configs[$i].BaseName)
    }
    Write-Host ("{0}: --- Create a new project ---" -f ($configs.Count + 1))

    $choice = Read-Host -Prompt "Select a project by number"
    if ($choice -match '^\d+$') {
        $idx = [int]$choice - 1
        if ($idx -ge 0 -and $idx -lt $configs.Count) {
            $Global:ProjectConfigFile = $configs[$idx].FullName
        } elseif ($idx -eq $configs.Count) {
            $newProjectName = Read-Host -Prompt "Enter a name for your new project"
            if ([string]::IsNullOrWhiteSpace($newProjectName)) { return $null }
            $Global:ProjectConfigFile = Join-Path -Path $configDir -ChildPath "$($newProjectName).json"
        } else {
             Write-Host "Invalid selection." -ForegroundColor Red; return $null
        }
    } else {
        Write-Host "Invalid selection." -ForegroundColor Red; return $null
    }
}

Select-Project
if (-not $Global:ProjectConfigFile) {
    Write-Host "No project selected. Exiting." -ForegroundColor Red
    exit
}

$Global:ProjectName = [System.IO.Path]::GetFileNameWithoutExtension($Global:ProjectConfigFile)
$configDir = Join-Path -Path $PSScriptRoot -ChildPath "configs"
$Global:LogFilePath = Join-Path -Path $configDir -ChildPath "$($Global:ProjectName).log"


# --- Region: Settings, Cache, and Log Management ---

function Write-ToolkitLog {
    param([string]$Message, [string]$Level = "INFO")
    $logEntry = "[{0}] [{1}] - {2}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Level.ToUpper(), $Message
    Add-Content -Path $Global:LogFilePath -Value $logEntry
}

function Get-ToolkitSettings {
    if (Test-Path $Global:ProjectConfigFile) {
        try {
            return Get-Content $Global:ProjectConfigFile -Raw | ConvertFrom-Json
        }
        catch {
            Write-Warning "Could not parse settings file. A new one will be created."
            Write-ToolkitLog -Level "WARN" -Message "Could not parse settings file."
            return [pscustomobject]@{}
        }
    }
    return [pscustomobject]@{}
}

function Set-ToolkitSettings {
    param($Settings)
    $Settings | ConvertTo-Json -Depth 10 | Out-File -FilePath $Global:ProjectConfigFile -Encoding UTF8
}

function Clear-ToolkitCache {
    Write-Host "`nClearing cache for project '$($Global:ProjectName)'..." -ForegroundColor Yellow
    Write-ToolkitLog -Level "INFO" -Message "User initiated cache clearing."
    $settings = Get-ToolkitSettings
    $propertiesToRemove = @("Orgs", "Metadata", "SystemInfo")
    foreach ($prop in $propertiesToRemove) {
        if ($settings.PSObject.Properties[$prop]) { $settings.PSObject.Properties.Remove($prop) }
    }
    Set-ToolkitSettings $settings
    Write-Host "✅ Cache has been cleared." -ForegroundColor Green
}


# --- Region: Core Functions ---

function Show-SystemCheck {
    param([switch]$ForceRefresh)
    Write-ToolkitLog -Level "INFO" -Message "Executing System Check. ForceRefresh: $ForceRefresh"
    Show-Banner -Title "System Check"
    
    $settings = Get-ToolkitSettings
    $cacheValid = $false
    if ($settings.SystemInfo -and $settings.SystemInfo.LastCheck) {
        if ((New-TimeSpan -Start $settings.SystemInfo.LastCheck -End (Get-Date)).TotalHours -lt 24) {
            $cacheValid = $true
        }
    }

    $softwareStatus = $null
    if ($cacheValid -and -not $ForceRefresh) {
        Write-Host "(from cache - last checked at $($settings.SystemInfo.LastCheck))" -ForegroundColor Gray
        $softwareStatus = $settings.SystemInfo.Software
    } else {
        Write-Host "Performing live system check..." -ForegroundColor Yellow
        $softwareToCheck = @(
            @{ Name = "Salesforce CLI"; Command = "sf"; Argument="--version"; Required = $true; WingetId = "Salesforce.sf-cli"; UpdateCommand = "sf update" },
            @{ Name = "Node.js"; Command = "node"; Argument="--version"; Required = $true; WingetId = "OpenJS.NodeJS" },
            @{ Name = "Git"; Command = "git"; Argument="--version"; Required = $false; WingetId = "Git.Git" }
        )
        $liveSoftwareStatus = @()
        foreach ($software in $softwareToCheck) {
            $swObject = [pscustomobject]@{ Name = $software.Name; Required = $software.Required; Installed = $false; Version = "N/A"; WingetId = $software.WingetId }
            if (Get-Command $software.Command -ErrorAction SilentlyContinue) {
                $swObject.Installed = $true
                $swObject.Version = (& $software.Command $software.Argument 2>&1 | Out-String).Trim()
                if ($ForceRefresh -and $software.UpdateCommand) {
                    Write-Host "   - Checking for updates for $($software.Name)..."
                    & invoke-expression $software.UpdateCommand
                }
            }
            $liveSoftwareStatus += $swObject
        }
        
        if (-not $settings.PSObject.Properties["SystemInfo"]) {
            $settings | Add-Member -MemberType NoteProperty -Name "SystemInfo" -Value (New-Object -TypeName PSCustomObject)
        }
        $settings.SystemInfo = @{ LastCheck = (Get-Date); Software = $liveSoftwareStatus }
        Set-ToolkitSettings $settings
        $softwareStatus = $liveSoftwareStatus
    }

    # Display results from either cache or live check
    $softwareStatus | ForEach-Object {
        $statusText = if ($_.Installed) { "[FOUND]" } else { "[NOT FOUND]" }
        $statusColor = if ($_.Installed) { "Green" } else { "Red" }
        Write-Host ("Checking for {0}... " -f $_.Name) -NoNewline
        Write-Host $statusText -ForegroundColor $statusColor
        if ($_.Installed) {
             Write-Host "   - Version: $($_.Version)"
        }
    }

    $allRequiredInstalled = ($softwareStatus | Where-Object { $_.Required -and -not $_.Installed }).Count -eq 0

    Write-Host "------------------------------------------"
    if ($allRequiredInstalled) {
        Write-Host "✅ System Ready: All required software is installed." -ForegroundColor Green
    } else {
        Write-Host "❌ Action Required: Missing required software." -ForegroundColor Red
        Install-MissingSoftware -SoftwareList ($softwareStatus | Where-Object { $_.Required -and -not $_.Installed })
    }
}

function Install-MissingSoftware {
    param($SoftwareList)
    if ($SoftwareList.Count -eq 0) { return }
    
    Write-Host "`nThe following required software is missing:" -ForegroundColor Yellow
    $SoftwareList | ForEach-Object { Write-Host " - $($_.Name)" }
    
    $choice = Read-Host -Prompt "Would you like to attempt to install them using winget? (y/n)"
    if ($choice -ne 'y') { Write-ToolkitLog -Level "INFO" -Message "User declined automatic installation."; return }
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) { Write-Host "❌ winget not found. Please install manually." -ForegroundColor Red; return }
    
    foreach ($software in $SoftwareList) {
        Write-Host "`nInstalling $($software.Name)..." -ForegroundColor Cyan
        winget install --id $software.WingetId -e --accept-package-agreements --accept-source-agreements
        if ($LASTEXITCODE -eq 0) { Write-Host "✅ $($software.Name) installed successfully." -ForegroundColor Green }
        else { Write-Host "❌ Failed to install $($software.Name)." -ForegroundColor Red }
    }
    Write-Host "`nInstallation process complete. Please restart the toolkit." -ForegroundColor Yellow
}

function Show-AuthorizedOrgs {
    param([switch]$ForceRefresh)
    Write-ToolkitLog -Level "INFO" -Message "Listing authorized orgs. ForceRefresh: $ForceRefresh"
    Show-Banner -Title "Authorized Salesforce Orgs"
    if (-not (Get-Command sf -EA SilentlyContinue)) { Write-ToolkitLog -Level "ERROR" -Message "sf command not found."; Write-Host "Salesforce CLI not found." -ForegroundColor Red; return }

    $settings = Get-ToolkitSettings
    
    if (-not $ForceRefresh -and $settings.Orgs) {
        Write-Host "(from cache)" -ForegroundColor Gray
        $settings.Orgs | Format-Table -AutoSize
    } else {
        Write-Host "Fetching live org list from Salesforce CLI..." -ForegroundColor Yellow
        $orgs = sf org list --json | ConvertFrom-Json
        if ($orgs -and $orgs.result) {
            $settings.Orgs = $orgs.result
            Set-ToolkitSettings $settings
            Write-ToolkitLog -Level "INFO" -Message "Successfully fetched and cached $($orgs.result.Length) orgs."
            $settings.Orgs | Format-Table -AutoSize
        } else { Write-ToolkitLog -Level "WARN" -Message "No orgs found from 'sf org list'."; Write-Host "No Salesforce orgs are currently authorized." -ForegroundColor Yellow }
    }
}

function Add-NewOrg {
    Write-ToolkitLog -Level "INFO" -Message "User starting to add a new org."
    Show-Banner -Title "Add / Authorize a New Salesforce Org"
    if (-not (Get-Command sf -EA SilentlyContinue)) { Write-Host "Salesforce CLI not found." -ForegroundColor Red; return }
    $alias = Read-Host -Prompt "Enter a unique alias for this org"
    if ([string]::IsNullOrWhiteSpace($alias)) { Write-ToolkitLog -Level "WARN" -Message "User provided an empty alias."; Write-Host "Alias cannot be empty." -ForegroundColor Red; return }

    Write-Host "A browser window will now open..." -ForegroundColor Yellow
    sf org login web --alias $alias
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully authorized org '$alias'." -ForegroundColor Green
        Write-ToolkitLog -Level "INFO" -Message "Successfully authorized org with alias '$alias'."
        Show-AuthorizedOrgs -ForceRefresh
    } else { Write-ToolkitLog -Level "ERROR" -Message "Org authorization failed for alias '$alias'."; Write-Host "❌ Org authorization failed." -ForegroundColor Red }
}

function Show-OrgInfo {
    $orgAlias = Select-Org -PromptTitle "Select an org to display information for:"
    if (-not $orgAlias) { return }
    Write-ToolkitLog -Level "INFO" -Message "Fetching details for org '$orgAlias'."
    Show-Banner -Title "Org Information: $orgAlias"
    sf org display --target-org $orgAlias
}

function Generate-Manifest {
    $orgAlias = Select-Org -PromptTitle "Select an org to generate a manifest from:"
    if (-not $orgAlias) { return }
    Write-ToolkitLog -Level "INFO" -Message "Starting manifest generation for org '$orgAlias'."
    Show-Banner -Title "Generate Manifest for: $orgAlias"
    $settings = Get-ToolkitSettings
    if (-not $settings.Metadata) { $settings.Metadata = @{} }
    $metadataResult = $null
    if ($settings.Metadata.$orgAlias) {
        Write-Host "Metadata types for '$orgAlias' found in cache." -ForegroundColor Gray
        Write-ToolkitLog -Level "INFO" -Message "Using cached metadata for '$orgAlias'."
        $metadataResult = $settings.Metadata.$orgAlias
    } else {
        Write-Host "`nFetching metadata types from '$orgAlias'. This may take a moment..." -ForegroundColor Yellow
        $metadataJson = sf project list metadata-types --target-org $orgAlias --json | ConvertFrom-Json
        if (-not $metadataJson.result) { Write-ToolkitLog -Level "ERROR" -Message "Failed to fetch metadata for '$orgAlias'."; Write-Host "Could not fetch metadata types." -ForegroundColor Red; return }
        $metadataResult = $metadataJson.result
        
        if (-not $settings.PSObject.Properties["Metadata"]) {
            $settings | Add-Member -MemberType NoteProperty -Name "Metadata" -Value (New-Object -TypeName PSCustomObject)
        }
        $settings.Metadata | Add-Member -MemberType NoteProperty -Name $orgAlias -Value $metadataResult -Force
        Set-ToolkitSettings $settings
        Write-ToolkitLog -Level "INFO" -Message "Fetched and cached $($metadataResult.Length) metadata types for '$orgAlias'."
        Write-Host "Metadata types cached for future use." -ForegroundColor Green
    }
    Write-Host "Available Metadata Types:"
    for($i=0;$i -lt $metadataResult.Length;$i++){Write-Host ("{0}: {1}" -f ($i + 1), $metadataResult[$i].name)}
    $choices=Read-Host "`nEnter numbers to include (e.g., 1,5,12), or 'all'"
    $selectedTypes=@()
    if($choices -eq 'all'){$selectedTypes=$metadataResult}else{$indices=$choices -split ','|%{$_.Trim()};foreach($index in $indices){if($index -match '^\d+$' -and [int]$index -gt 0 -and [int]$index -le $metadataResult.Length){$selectedTypes+=$metadataResult[[int]$index-1]}}}
    if($selectedTypes.Length -eq 0){Write-ToolkitLog -Level "WARN" -Message "User selected no valid types for manifest.";Write-Host "No valid types selected." -ForegroundColor Red;return}
    $manifestContent = "<?xml version=`"1.0`" encoding=`"UTF-8`"?>`n<Package xmlns=`"http://soap.sforce.com/2006/04/metadata`">`n"
    $selectedTypes | ForEach-Object { $manifestContent += "    <types>`n        <members>*</members>`n        <name>$($_.name)</name>`n    </types>`n" }
    $manifestContent += "    <version>61.0</version>`n</Package>"
    $filePath=".\package.xml"; $manifestContent | Out-File -FilePath $filePath -Encoding UTF8
    Write-ToolkitLog -Level "INFO" -Message "Generated package.xml with $($selectedTypes.Length) types."
    Write-Host "`n✅ Manifest 'package.xml' generated at: $(Resolve-Path $filePath)" -ForegroundColor Green
}

function Compare-Orgs {
    Write-ToolkitLog -Level "INFO" -Message "Starting org comparison."
    Show-Banner -Title "Compare Metadata Between Two Orgs"
    $sourceOrg = Select-Org -PromptTitle "Select your SOURCE org:"
    if (-not $sourceOrg) { return }
    $targetOrg = Select-Org -PromptTitle "Select your TARGET org:"
    if (-not $targetOrg) { return }
    if ($sourceOrg -eq $targetOrg) { Write-Host "Source and Target orgs cannot be the same." -ForegroundColor Red; return }
    
    $manifestPath = Read-Host -Prompt "Enter path to package.xml (Default: .\package.xml)"
    if ([string]::IsNullOrWhiteSpace($manifestPath)) { $manifestPath = ".\package.xml" }
    if (-not (Test-Path $manifestPath)) { Write-Host "Manifest file not found." -ForegroundColor Red; return }

    Write-Host "`nStarting comparison..." -ForegroundColor Yellow
    $sourceDir = ".\temp_source_$(Get-Date -Format 'yyyyMMddHHmmss')"
    $targetDir = ".\temp_target_$(Get-Date -Format 'yyyyMMddHHmmss')"

    Write-Host "1. Retrieving metadata from SOURCE org '$sourceOrg'..."
    sf project retrieve start --manifest $manifestPath --target-org $sourceOrg --output-dir $sourceDir
    
    Write-Host "2. Retrieving metadata from TARGET org '$targetOrg'..."
    sf project retrieve start --manifest $manifestPath --target-org $targetOrg --output-dir $targetDir

    Write-Host "3. Comparing metadata using VS Code..."
    if (Get-Command code -ErrorAction SilentlyContinue) {
        code --diff $sourceDir $targetDir
        Write-Host "✅ Comparison opened in VS Code." -ForegroundColor Green
    } else {
        Write-Host "VS Code 'code' command not found. Compare folders manually:" -ForegroundColor Yellow
        Write-Host "   - Source: $(Resolve-Path $sourceDir)"
        Write-Host "   - Target: $(Resolve-Path $targetDir)"
    }
    
    Write-Host "Temporary comparison folders have been created. You can delete them manually when done."
}

function Deploy-Metadata {
    Write-ToolkitLog -Level "INFO" -Message "Starting advanced deployment process."
    Show-Banner -Title "Deploy Metadata (Advanced)"
    $targetOrg = Select-Org -PromptTitle "Select the TARGET org for deployment:"
    if (-not $targetOrg) { return }

    $manifestPath = Read-Host -Prompt "Enter path to package.xml (Default: .\package.xml)"
    if ([string]::IsNullOrWhiteSpace($manifestPath)) { $manifestPath = ".\package.xml" }
    if (-not (Test-Path $manifestPath)) { Write-Host "Manifest not found." -ForegroundColor Red; return }
    
    $sourcePath = Read-Host -Prompt "Enter path to source code (Default: current directory)"
    if ([string]::IsNullOrWhiteSpace($sourcePath)) { $sourcePath = ".\" }

    # --- Pre-Deployment Backup ---
    $backupDir = ".\temp_backup_$(Get-Date -Format 'yyyyMMddHHmmss')"
    Write-Host "`nStep 1: Performing Pre-Deployment Backup from '$targetOrg'..." -ForegroundColor Yellow
    Write-ToolkitLog -Level "INFO" -Message "Starting backup from $targetOrg."
    
    $job = Start-Job -ScriptBlock { 
        param($manifest, $org, $dir)
        sf project retrieve start --manifest $manifest --target-org $org --output-dir $dir
    } -ArgumentList $manifestPath, $targetOrg, $backupDir
    
    while ($job.State -eq 'Running') {
        Write-Progress -Activity "Backing up metadata from $targetOrg" -Status "Retrieving..." -PercentComplete -1
        Start-Sleep -Seconds 1
    }
    Write-Progress -Activity "Backing up metadata from $targetOrg" -Completed
    
    if ($job.State -ne 'Completed') { Write-Host "❌ Backup failed. Aborting deployment." -ForegroundColor Red; Write-ToolkitLog -Level "ERROR" -Message "Backup failed."; return }
    
    $backupZip = "backup-$($targetOrg)-$(Get-Date -Format 'yyyyMMddHHmmss').zip"
    Compress-Archive -Path "$($backupDir)\*" -DestinationPath $backupZip -Force
    Remove-Item -Recurse -Force $backupDir
    Write-Host "✅ Backup complete: $backupZip" -ForegroundColor Green
    Write-ToolkitLog -Level "INFO" -Message "Backup created at $backupZip"

    # --- Validation with Test Level ---
    Write-Host "`nStep 2: Validate Deployment" -ForegroundColor Yellow
    $testLevel = Read-Host -Prompt "Enter test level (e.g., RunLocalTests, RunAllTestsInOrg, RunSpecifiedTests)"
    $testsToRun = ""
    if ($testLevel -eq "RunSpecifiedTests") { $testsToRun = Read-Host -Prompt "Enter comma-separated test classes" }
    
    $validationCommand = "sf project deploy validate --manifest `"$manifestPath`" --source-dir `"$sourcePath`" --target-org $targetOrg --test-level $testLevel"
    if ($testsToRun) { $validationCommand += " --tests `"$testsToRun`"" }
    
    Write-Host "Running validation... This may take a while."
    $validationJob = Start-Job -ScriptBlock { param($cmd) & invoke-expression $cmd } -ArgumentList "$($validationCommand) --json"

    while ($validationJob.State -eq 'Running') {
        Write-Progress -Activity "Validating deployment against $targetOrg" -Status "Running Apex tests..." -PercentComplete -1
        Start-Sleep -Seconds 1
    }
    Write-Progress -Activity "Validating deployment against $targetOrg" -Completed

    $validationResultJson = Receive-Job $validationJob
    $validationResult = $validationResultJson | ConvertFrom-Json
    
    if ($validationResult.status -ne 0) { Write-Host "❌ Validation failed: $($validationResult.message)" -ForegroundColor Red; Write-ToolkitLog -Level "ERROR" -Message "Validation failed: $($validationResult.message)"; return }

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
        Write-ToolkitLog -Level "INFO" -Message "Validation test results: $($testResult.numTestsRun) run, $($testResult.numFailures) failures."
    }

    # --- Final Deployment Confirmation ---
    $confirmation = Read-Host -Prompt "Validation successful. To proceed with deployment to '$targetOrg', type the org alias exactly"
    if ($confirmation -ne $targetOrg) { Write-ToolkitLog -Level "INFO" -Message "Deployment cancelled by user."; Write-Host "Deployment cancelled."; return }

    # --- Execute Deployment ---
    Write-Host "`nStep 3: Executing Deployment..." -ForegroundColor Yellow
    $deployCommand = $validationCommand.Replace("validate", "start")
    $deployResultJson = & invoke-expression "$($deployCommand) --json"
    $deployResult = $deployResultJson | ConvertFrom-Json
    
    if ($deployResult.status -eq 0) {
        Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
        Write-ToolkitLog -Level "INFO" -Message "Deployment to $targetOrg successful."
    } else {
        Write-Host "❌ DEPLOYMENT FAILED." -ForegroundColor Red
        Write-ToolkitLog -Level "ERROR" -Message "Deployment to $targetOrg failed: $($deployResult.message)"
        
        # --- Rollback Option ---
        $rollbackChoice = Read-Host -Prompt "Deployment failed. Do you want to roll back using backup '$backupZip'? (y/n)"
        if ($rollbackChoice -eq 'y') {
            Write-ToolkitLog -Level "INFO" -Message "User initiated rollback."
            $unzipDir = ".\temp_rollback_$(Get-Date -Format 'yyyyMMddHHmmss')"
            Expand-Archive -Path $backupZip -DestinationPath $unzipDir
            Write-Host "Attempting rollback..." -ForegroundColor Yellow
            sf project deploy start --source-dir $unzipDir --target-org $targetOrg
            if ($LASTEXITCODE -eq 0) { Write-Host "✅ Rollback successful." -ForegroundColor Green; Write-ToolkitLog -Level "INFO" -Message "Rollback successful." }
            else { Write-Host "❌ Rollback failed." -ForegroundColor Red; Write-ToolkitLog -Level "ERROR" -Message "Rollback failed." }
            Remove-Item -Recurse -Force $unzipDir
        }
    }
}

function Show-DependencyAnalysis {
    Write-ToolkitLog -Level "INFO" -Message "Starting Dependency Analysis."
    Show-Banner -Title "Component Dependency Analyzer"
    $orgAlias = Select-Org -PromptTitle "Select an org to run dependency analysis on:"
    if (-not $orgAlias) { return }

    $metadataType = Read-Host -Prompt "Enter the metadata type (e.g., CustomField, ApexClass)"
    $memberName = Read-Host -Prompt "Enter the full member name (e.g., Account.MyCustomField__c, MyClassName)"

    $logMessage = "Running dependency analysis for '{0}:{1}' on org '{2}'" -f $metadataType, $memberName, $orgAlias
    Write-ToolkitLog -Level "INFO" -Message $logMessage
    Write-Host "Running dependency analysis for '$memberName' of type '$metadataType'. This can take a long time..." -ForegroundColor Yellow
    
    $result = sf project list metadata-dependencies --metadatatype $metadataType --metadata $memberName --target-org $orgAlias --json | ConvertFrom-Json
    
    if ($result.status -eq 0 -and $result.result) {
        Write-Host "✅ Dependencies Found:" -ForegroundColor Green
        $result.result | Format-Table -Wrap
        Write-ToolkitLog -Level "INFO" -Message "Dependency analysis successful."
    } else {
        Write-Host "❌ No dependencies found or an error occurred." -ForegroundColor Red
        Write-Host $result.message
        Write-ToolkitLog -Level "ERROR" -Message "Dependency analysis failed: $($result.message)"
    }
}

function Analyze-Permissions {
    Write-ToolkitLog -Level "INFO" -Message "Starting Profile/Permission Set Analyzer."
    Show-Banner -Title "Profile & Permission Set Analyzer"
    $sourcePath = Read-Host -Prompt "Enter path to the source folder containing profiles and permissionsets (e.g., force-app/main/default)"
    if (-not (Test-Path $sourcePath)) { Write-ToolkitLog -Level "ERROR" -Message "Invalid path: $sourcePath"; Write-Host "Path not found." -ForegroundColor Red; return }

    $profiles = Get-ChildItem -Path $sourcePath -Filter "*.profile-meta.xml" -Recurse
    $permsets = Get-ChildItem -Path $sourcePath -Filter "*.permissionset-meta.xml" -Recurse

    Write-Host "`n--- Analysis Results ---" -ForegroundColor Cyan
    
    foreach ($file in $profiles + $permsets) {
        Write-Host "`nAnalyzing: $($file.Name)" -ForegroundColor Yellow
        $xml = [xml](Get-Content $file.FullName)
        $fieldPerms = $xml.SelectNodes("//fieldPermissions").Count
        $objectPerms = $xml.SelectNodes("//objectPermissions").Count
        $classAccesses = $xml.SelectNodes("//classAccesses").Count
        $pageAccesses = $xml.SelectNodes("//pageAccesses").Count
        
        Write-Host " - Field Permissions: $fieldPerms"
        Write-Host " - Object Permissions: $objectPerms"
        Write-Host " - Apex Class Accesses: $classAccesses"
        Write-Host " - Visualforce Page Accesses: $pageAccesses"
    }
    Write-ToolkitLog -Level "INFO" -Message "Permission analysis complete for path: $sourcePath"
}

function View-LogFile {
    Write-ToolkitLog -Level "INFO" -Message "User viewing log file."
    if (Test-Path $Global:LogFilePath) {
        Invoke-Item $Global:LogFilePath
        Write-Host "`n✅ Log file opened in your default text editor." -ForegroundColor Green
    } else {
        Write-Host "`nLog file does not exist yet. It will be created on the first action." -ForegroundColor Yellow
    }
}

# --- Region: Helper Functions ---
function Select-Org {
    param($PromptTitle)
    Write-Host "`n$PromptTitle" -ForegroundColor Cyan
    $settings = Get-ToolkitSettings
    if (-not $settings.Orgs) {
        Write-Host "No authorized orgs found in cache. Please List/Refresh (Option 2) first." -ForegroundColor Red
        return $null
    }
    for ($i = 0; $i -lt $settings.Orgs.Length; $i++) {
        Write-Host ("{0}: {1} ({2})" -f ($i + 1), $settings.Orgs[$i].alias, $settings.Orgs[$i].username)
    }
    $choice = Read-Host -Prompt "Select an org by number"
    if ($choice -match '^\d+$' -and [int]$choice -gt 0 -and [int]$choice -le $settings.Orgs.Length) {
        return $settings.Orgs[[int]$choice - 1].alias
    } else {
        Write-Host "Invalid selection." -ForegroundColor Red
        return $null
    }
}


# --- Region: Main Menu Loop ---
Write-ToolkitLog -Level "INFO" -Message "=================== Toolkit Session Started for Project '$($Global:ProjectName)' ==================="
do {
    Show-CreditHeader
    Show-Banner -Title "Salesforce Toolkit [$($Global:ProjectName)] - Main Menu"
    Write-Host "1. System Check (use '-Force' to refresh)"
    Write-Host "2. List Authorized Orgs (use '-Force' to refresh)"
    Write-Host "3. Add a New Org"
    Write-Host "4. Get Org Information"
    Write-Host "5. Generate package.xml Manifest"
    Write-Host "6. Compare Two Orgs"
    Write-Host "7. Deploy Metadata (Advanced)"
    Write-Host "8. Advanced Tools"
    Write-Host "Q. Quit"
    Write-Host "--------------------------------"
    $inputLine = Read-Host -Prompt "Please enter your choice"
    $parts = $inputLine.Split(' ')
    $choice = $parts[0]
    $force = $parts.Length -gt 1 -and $parts[1].ToLower() -eq '-force'

    if ($choice -eq '8') {
        Write-Host "`n  Advanced Menu"
        Write-Host "  -------------"
        Write-Host "  a. Analyze Profile/Permission Set Files"
        Write-Host "  b. Check Component Dependencies in Org"
        Write-Host "  c. Clear Project Cache"
        Write-Host "  d. View Project Log File"
        Write-Host "  m. Back to Main Menu"
        $advChoice = Read-Host -Prompt "  Advanced choice"
        Write-ToolkitLog -Level "INFO" -Message "User selected advanced option: '$advChoice'"
        switch ($advChoice) {
            "a" { Analyze-Permissions }
            "b" { Show-DependencyAnalysis }
            "c" { Clear-ToolkitCache }
            "d" { View-LogFile }
        }
    } else {
        Write-ToolkitLog -Level "INFO" -Message "User selected menu option: '$choice'. Force: $force"
        switch ($choice) {
            "1" { Show-SystemCheck -ForceRefresh:$force }
            "2" { Show-AuthorizedOrgs -ForceRefresh:$force }
            "3" { Add-NewOrg }
            "4" { Show-OrgInfo }
            "5" { Generate-Manifest }
            "6" { Compare-Orgs }
            "7" { Deploy-Metadata }
            "q" { break }
            default { Write-ToolkitLog -Level "WARN" -Message "User entered invalid option: '$choice'"; Write-Host "Invalid option." -ForegroundColor Red }
        }
    }
    if ($choice -ne 'q') { Read-Host -Prompt "Press Enter to return to the menu..." }
} while ($choice -ne 'q')
Write-ToolkitLog -Level "INFO" -Message "=================== Toolkit Session Ended ==================="
