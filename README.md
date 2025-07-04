# Salesforce Toolkit

A comprehensive desktop application for Salesforce developers and administrators, built with Electron, React, and TypeScript.

**Created by [Amit Bhardwaj](https://www.linkedin.com/in/salesforce-technical-architect/) - Salesforce Technical Architect**

## Features

- **Get Org Information**: View detailed information about connected Salesforce orgs
- **Generate Manifest**: Create package.xml files from org metadata
- **Compare Two Orgs**: Visual diff of metadata between different orgs
- **Deploy Metadata**: Guided deployment process with validation and confirmation
- **System Check**: Verify and install required software dependencies
- **SF Command Shell**: Interactive Salesforce CLI terminal with command reference
- **Project Management**: Set and manage project directories for metadata operations
- **Setup Guide**: Complete installation and configuration instructions

## Enhanced Features

### Software Management
- Automatic detection of required software (Salesforce CLI, Node.js, Git, VS Code)
- Direct download links and installation guidance
- Real-time status checking and validation

### Interactive Shell
- Built-in Salesforce CLI terminal
- Command reference panel with common SF commands
- Command history and output formatting
- Copy and execute functionality

### Error Handling & Improvements
- Comprehensive error handling with detailed messages
- Retry mechanisms for failed operations
- Progress indicators for long-running tasks
- Validation checks before operations
- Configuration profiles for different environments

### Recommended Enhancements
- Enhanced metadata comparison with syntax highlighting
- Automated testing integration before deployments
- Backup and rollback functionality
- Team collaboration features
- Bulk operations and batch processing
- Metadata dependency analysis

## Prerequisites

1. **Node.js**: Download and install from [nodejs.org](https://nodejs.org/)
2. **Salesforce CLI**: Install from [developer.salesforce.com](https://developer.salesforce.com/tools/sfdxcli)
3. **Authenticated Orgs**: Authenticate with your Salesforce orgs using `sf org login web --alias my-org`

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Development

To run the application in development mode:

```bash
npm run electron:dev
```

## Building for Production

### Prerequisites for Building

- Windows: No additional requirements
- The build process will create a single .exe file

### Build Commands

To build for Windows:

```bash
# Using npm
npm run build:win

# Using PowerShell script
./build.ps1
```

The built application will be available in the `dist-app` directory.

## Usage

1. Launch the application
2. Use the System Check feature to verify all required software is installed
3. Set your project directory in Settings for organized metadata management
4. Use the dashboard to access different toolkit features
5. Utilize the SF Command Shell for interactive CLI operations
6. Follow the setup guide for detailed configuration instructions

## Architecture

- **Frontend**: React with TypeScript and Tailwind CSS
- **Backend**: Electron with Node.js
- **CLI Integration**: Salesforce CLI via child processes
- **File System**: Native file operations for manifest handling
- **Terminal**: Integrated shell with xterm.js for command execution
- **Settings**: Persistent storage using electron-store

## Technology Stack

- Electron
- React
- TypeScript
- Tailwind CSS
- Node.js
- Salesforce CLI
- Lucide Icons
- Vite
- xterm.js
- electron-store

## Security

- No sensitive data is stored locally
- All Salesforce authentication is handled through the official CLI
- File operations are sandboxed to user-selected directories
- Secure IPC communication between main and renderer processes

## Error Handling Features

- Comprehensive validation before operations
- Detailed error messages with suggested solutions
- Retry mechanisms with exponential backoff
- Progress tracking for long-running operations
- Logging functionality for debugging
- Graceful handling of network and CLI failures

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Author

**Amit Bhardwaj**
- LinkedIn: [https://www.linkedin.com/in/salesforce-technical-architect/](https://www.linkedin.com/in/salesforce-technical-architect/)
- Role: Salesforce Technical Architect

## License

This project is licensed under the MIT License.

## Acknowledgments

- Built with modern web technologies for optimal performance
- Designed with user experience and developer productivity in mind
- Comprehensive feature set for Salesforce development workflows
- Professional-grade error handling and validation