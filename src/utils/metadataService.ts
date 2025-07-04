import { logger } from './logger';

export interface MetadataType {
  name: string;
  members: string[];
  description: string;
}

export interface OrgMetadata {
  types: MetadataType[];
  apiVersion: string;
  orgId: string;
  retrievedAt: Date;
}

class MetadataService {
  async getOrgMetadata(orgAlias: string): Promise<OrgMetadata> {
    logger.info('METADATA', `Starting metadata retrieval for org: ${orgAlias}`);
    
    if (!window.electronAPI) {
      throw new Error('Metadata service not available in browser mode');
    }
    
    try {
      // Get org info first
      const orgInfo = await window.electronAPI.executeSfCommand('org', ['display', '--target-org', orgAlias, '--json']);
      const orgId = orgInfo.result?.id || 'unknown';
      
      logger.auditAction('GET_ORG_METADATA', undefined, orgId, { orgAlias });

      // Get all metadata types
      const metadataTypes = await this.getAllMetadataTypes(orgAlias);
      
      // Get members for each type (limit to avoid overwhelming the system)
      const typesWithMembers: MetadataType[] = [];
      const maxTypesToProcess = 20; // Limit for performance
      
      for (let i = 0; i < Math.min(metadataTypes.length, maxTypesToProcess); i++) {
        const type = metadataTypes[i];
        try {
          logger.debug('METADATA', `Getting members for ${type.name}`);
          const members = await this.getMetadataMembers(orgAlias, type.name);
          if (members.length > 0) {
            typesWithMembers.push({
              name: type.name,
              members,
              description: type.description || `${type.name} metadata components`
            });
          }
        } catch (error) {
          logger.warn('METADATA', `Failed to get members for ${type.name}`, error, undefined, orgId);
          // Continue with other types even if one fails
        }
      }

      const result: OrgMetadata = {
        types: typesWithMembers,
        apiVersion: orgInfo.result?.apiVersion || '58.0',
        orgId: orgId,
        retrievedAt: new Date()
      };

      logger.info('METADATA', `Successfully retrieved metadata for ${typesWithMembers.length} types`, { 
        orgAlias, 
        typesCount: typesWithMembers.length 
      }, undefined, orgId);

      return result;
    } catch (error) {
      logger.auditError('GET_ORG_METADATA', error, undefined, orgAlias);
      throw error;
    }
  }

  private async getAllMetadataTypes(orgAlias: string): Promise<{ name: string; description?: string }[]> {
    try {
      // Try to get metadata types from the org
      const result = await window.electronAPI.executeSfCommand('sobject', [
        'list', 
        '--target-org', orgAlias, 
        '--json'
      ]);

      if (result && result.result && Array.isArray(result.result)) {
        // This gives us SObject types, but for metadata we need different approach
        logger.debug('METADATA', 'Got SObject list, using common metadata types instead');
      }

      // For now, use common metadata types since getting all metadata types
      // requires more complex SF CLI operations
      return this.getCommonMetadataTypes();
    } catch (error) {
      logger.warn('METADATA', 'Failed to get metadata types from org, using fallback list', error);
      return this.getCommonMetadataTypes();
    }
  }

  private async getMetadataMembers(orgAlias: string, metadataType: string): Promise<string[]> {
    try {
      // For demonstration, we'll return some mock data
      // In a real implementation, you would use:
      // sf project list metadata --metadata-type <type> --target-org <org>
      
      const mockMembers: { [key: string]: string[] } = {
        'ApexClass': ['AccountController', 'ContactService', 'TestDataFactory'],
        'ApexTrigger': ['AccountTrigger', 'ContactTrigger', 'OpportunityTrigger'],
        'CustomObject': ['Account', 'Contact', 'Opportunity', 'CustomObject__c'],
        'Layout': ['Account-Account Layout', 'Contact-Contact Layout'],
        'Flow': ['AccountFlow', 'ContactFlow'],
        'ValidationRule': ['Account.ValidateEmail', 'Contact.RequiredFields'],
        'CustomField': ['Account.CustomField__c', 'Contact.Email__c'],
        'PermissionSet': ['CustomPermissionSet', 'AdminPermissions'],
        'Profile': ['System Administrator', 'Standard User'],
        'LightningComponentBundle': ['accountComponent', 'contactList'],
        'StaticResource': ['CustomCSS', 'Images', 'Scripts'],
        'CustomLabel': ['ErrorMessage', 'SuccessMessage', 'ValidationText']
      };

      return mockMembers[metadataType] || [];
    } catch (error) {
      logger.debug('METADATA', `No members found for ${metadataType}`, error);
      return [];
    }
  }

  private getCommonMetadataTypes(): { name: string; description: string }[] {
    return [
      { name: 'ApexClass', description: 'Apex Classes' },
      { name: 'ApexTrigger', description: 'Apex Triggers' },
      { name: 'CustomObject', description: 'Custom Objects' },
      { name: 'CustomField', description: 'Custom Fields' },
      { name: 'Layout', description: 'Page Layouts' },
      { name: 'Flow', description: 'Flows' },
      { name: 'ValidationRule', description: 'Validation Rules' },
      { name: 'CustomTab', description: 'Custom Tabs' },
      { name: 'CustomApplication', description: 'Custom Applications' },
      { name: 'PermissionSet', description: 'Permission Sets' },
      { name: 'Profile', description: 'Profiles' },
      { name: 'LightningComponentBundle', description: 'Lightning Web Components' },
      { name: 'AuraDefinitionBundle', description: 'Aura Components' },
      { name: 'StaticResource', description: 'Static Resources' },
      { name: 'EmailTemplate', description: 'Email Templates' },
      { name: 'Report', description: 'Reports' },
      { name: 'Dashboard', description: 'Dashboards' },
      { name: 'CustomLabel', description: 'Custom Labels' },
      { name: 'WorkflowRule', description: 'Workflow Rules' },
      { name: 'CustomSetting', description: 'Custom Settings' },
      { name: 'RemoteSiteSetting', description: 'Remote Site Settings' },
      { name: 'ConnectedApp', description: 'Connected Apps' },
      { name: 'CustomMetadata', description: 'Custom Metadata Types' },
      { name: 'Queue', description: 'Queues' },
      { name: 'Group', description: 'Public Groups' },
      { name: 'Role', description: 'Roles' },
      { name: 'Territory', description: 'Territories' },
      { name: 'BusinessProcess', description: 'Business Processes' },
      { name: 'RecordType', description: 'Record Types' },
      { name: 'WebLink', description: 'Web Links' },
      { name: 'CustomPageWebLink', description: 'Custom Page Web Links' },
      { name: 'QuickAction', description: 'Quick Actions' },
      { name: 'FlexiPage', description: 'Lightning Pages' },
      { name: 'PathAssistant', description: 'Path Assistants' },
      { name: 'DuplicateRule', description: 'Duplicate Rules' },
      { name: 'MatchingRule', description: 'Matching Rules' },
      { name: 'SharingRules', description: 'Sharing Rules' },
      { name: 'AssignmentRules', description: 'Assignment Rules' },
      { name: 'AutoResponseRules', description: 'Auto Response Rules' },
      { name: 'EscalationRules', description: 'Escalation Rules' }
    ];
  }

  generatePackageXml(metadata: OrgMetadata, selectedTypes?: string[]): string {
    const typesToInclude = selectedTypes 
      ? metadata.types.filter(type => selectedTypes.includes(type.name))
      : metadata.types;

    const typeElements = typesToInclude.map(type => {
      const members = type.members.length > 0 
        ? type.members.map(member => `        <members>${this.escapeXml(member)}</members>`).join('\n')
        : '        <members>*</members>';

      return `    <types>\n${members}\n        <name>${type.name}</name>\n    </types>`;
    }).join('\n\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<Package xmlns="http://soap.sforce.com/2006/04/metadata">
    <!-- Generated by Salesforce Toolkit - Created by Amit Bhardwaj -->
    <!-- https://www.linkedin.com/in/salesforce-technical-architect/ -->
    <!-- Generated on: ${new Date().toISOString()} -->
    <!-- Org ID: ${metadata.orgId} -->
    <!-- Total Types: ${typesToInclude.length} -->
    
${typeElements}
    
    <!-- API Version -->
    <version>${metadata.apiVersion}</version>
</Package>`;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

export const metadataService = new MetadataService();