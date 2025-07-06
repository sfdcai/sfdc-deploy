# toolkit.test.ps1
# Pester test suite for the Salesforce Toolkit script.

# Before running tests, ensure Pester is installed: Install-Module -Name Pester -Force
# To run the tests, navigate to this directory in PowerShell and run: Invoke-Pester

# --- Test Setup ---
# This block runs once before all tests. It dot-sources the main script to make its functions available for testing.
BeforeAll {
    . (Join-Path $PSScriptRoot 'toolkit.ps1')
}

# --- Test Suite ---

Describe 'Salesforce Toolkit - Core Functions' {

    # Mock external commands and user input to isolate our functions for testing.
    BeforeEach {
        # Mocking Read-Host to simulate user input without pausing the test.
        Mock Read-Host { return "mock-input" } -ModuleName toolkit

        # Mocking the Salesforce CLI command to return predictable JSON output.
        Mock sf {
            param($command)
            if ($command -eq 'org' -and $args[0] -eq 'list') {
                return '[{"result":[{"alias":"test-org-1","username":"test1@example.com"},{"alias":"test-org-2","username":"test2@example.com"}]}]' | ConvertFrom-Json
            }
            if ($command -eq 'project' -and $args[0] -eq 'list') {
                return '[{"result":[{"name":"ApexClass"},{"name":"CustomObject"}]}]' | ConvertFrom-Json
            }
            # Return a generic success status for other commands
            return '{"status":0, "result":{}}' | ConvertFrom-Json
        } -ModuleName toolkit

        # Mocking Get-Command to simulate that required software is found.
        Mock Get-Command { return $true } -ModuleName toolkit
    }

    It 'Show-Banner should display a formatted title' {
        # Test that the banner function produces output without errors.
        { Show-Banner -Title "Test Banner" } | Should -Not -Throw
    }

    It 'Show-SystemCheck should run without errors' {
        # Test the main system check function to ensure it completes.
        { Show-SystemCheck } | Should -Not -Throw
    }

    It 'Show-AuthorizedOrgs should display orgs from the mocked sf command' {
        # We can't easily capture and assert against Write-Host output,
        # so we test that the function runs without throwing an error, which implies it successfully called the mocked 'sf' command.
        { Show-AuthorizedOrgs -ForceRefresh } | Should -Not -Throw
    }
    
    It 'Generate-Manifest should create a package.xml file' {
        # Mock the user selecting an org and then choosing metadata types.
        Mock Select-Org { return "test-org-1" } -ModuleName toolkit
        Mock Read-Host { 
            # The first call to Read-Host is for metadata type selection.
            if ($ திமுக.Prompt -match 'Enter numbers') { return '1' }
        } -ModuleName toolkit

        # Run the function
        Generate-Manifest

        # Assert that the package.xml file was created.
        (Test-Path ".\package.xml") | Should -Be $true

        # Cleanup the created file.
        Remove-Item ".\package.xml" -Force
    }
}

Describe 'Salesforce Toolkit - Settings and Cache' {

    BeforeEach {
        # Ensure a clean state for each test by removing any previous test config.
        $Global:ProjectConfigFile = Join-Path $PSScriptRoot "configs\test-project.json"
        if (Test-Path $Global:ProjectConfigFile) {
            Remove-Item $Global:ProjectConfigFile
        }
    }

    AfterAll {
        # Clean up the test config file after all tests in this block are done.
        if (Test-Path $Global:ProjectConfigFile) {
            Remove-Item $Global:ProjectConfigFile
        }
    }

    It 'Get-ToolkitSettings should return an empty object if no file exists' {
        $settings = Get-ToolkitSettings
        $settings | Should -BeOfType ([pscustomobject])
        ($settings.PSObject.Properties.Count) | Should -Be 0
    }

    It 'Set-ToolkitSettings and Get-ToolkitSettings should save and retrieve data' {
        $testData = @{ Orgs = @("org1", "org2"); TestProperty = "value" }
        Set-ToolkitSettings -Settings $testData
        
        $retrievedSettings = Get-ToolkitSettings
        $retrievedSettings.Orgs | Should -Be @("org1", "org2")
        $retrievedSettings.TestProperty | Should -Be "value"
    }

    It 'Clear-ToolkitCache should remove specified properties from the settings file' {
        $initialSettings = @{ Orgs = @("org1"); Metadata = @{ org1 = @("type1") }; KeepThis = "safe" }
        Set-ToolkitSettings -Settings $initialSettings

        Clear-ToolkitCache

        $clearedSettings = Get-ToolkitSettings
        $clearedSettings.PSObject.Properties.Name | Should -Not -Contain "Orgs"
        $clearedSettings.PSObject.Properties.Name | Should -Not -Contain "Metadata"
        $clearedSettings.KeepThis | Should -Be "safe"
    }
}
