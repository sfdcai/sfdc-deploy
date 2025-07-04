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
    
    try {
      // Get org info first
      const orgInfo = await window.electronAPI.executeSfCommand('org', ['display', '--target-org', orgAlias, '--json']);
      const orgId = orgInfo.result?.id;
      
      logger.auditAction('GET_ORG_METADATA', undefined, orgId, { orgAlias });

      // Get all metadata types
      const metadataTypes = await this.getAllMetadataTypes(orgAlias);
      
      // Get members for each type
      const typesWithMembers: MetadataType[] = [];
      
      for (const type of metadataTypes) {
        try {
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
        orgId: orgId || 'unknown',
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
      // Use sf project list metadata-types to get available types
      const result = await window.electronAPI.executeSfCommand('project', [
        'list', 'metadata-types', 
        '--target-org', orgAlias, 
        '--json'
      ]);

      if (result.result && Array.isArray(result.result)) {
        return result.result.map((type: any) => ({
          name: type.name || type,
          description: type.description
        }));
      }

      // Fallback to common metadata types if the command fails
      return this.getCommonMetadataTypes();
    } catch (error) {
      logger.warn('METADATA', 'Failed to get metadata types from org, using fallback list', error);
      return this.getCommonMetadataTypes();
    }
  }

  private async getMetadataMembers(orgAlias: string, metadataType: string): Promise<string[]> {
    try {
      const result = await window.electronAPI.executeSfCommand('project', [
        'list', 'metadata',
        '--metadata-type', metadataType,
        '--target-org', orgAlias,
        '--json'
      ]);

      if (result.result && Array.isArray(result.result)) {
        return result.result.map((item: any) => item.fullName || item.name || item);
      }

      return [];
    } catch (error) {
      // Some metadata types might not exist in the org
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