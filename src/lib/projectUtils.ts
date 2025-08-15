// Simple UUID v4 generator (no external dependency)
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export interface ProjectMetadata {
  usage_id: string;
  project_uuid: string;
  url_slug: string;
  project_title: string;
  unique_url: string;
  shareable_url: string;
  created_at: string;
  status: string;
}

export class ProjectUtils {
  /**
   * Generate a clean URL slug from a title
   */
  static generateUrlSlug(title: string, projectUuid?: string): string {
    // Clean title
    const cleanTitle = title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/[-\s]+/g, '-')
      .trim()
      .substring(0, 30);
    
    // Add unique suffix
    const uniqueSuffix = projectUuid ? projectUuid.substring(0, 8) : Math.random().toString(36).substring(2, 10);
    
    return `${cleanTitle || 'project'}-${uniqueSuffix}`;
  }

  /**
   * Create a new project with unique identifiers
   */
  static createProjectIdentifiers(title: string): {
    project_uuid: string;
    url_slug: string;
    unique_url: string;
    shareable_url: string;
  } {
    const project_uuid = generateUUID();
    const url_slug = this.generateUrlSlug(title, project_uuid);
    
    return {
      project_uuid,
      url_slug,
      unique_url: `/${url_slug}`,
      shareable_url: `/project/${project_uuid}`
    };
  }

  /**
   * Extract usage ID from URL slug
   */
  static extractUsageIdFromSlug(urlSlug: string): string | null {
    const parts = urlSlug.split('-');
    return parts.length > 1 ? parts[parts.length - 1] : null;
  }

  /**
   * Validate if a URL slug format is correct
   */
  static isValidUrlSlug(urlSlug: string): boolean {
    return /^[a-z0-9-]+$/.test(urlSlug) && urlSlug.length > 5;
  }

  /**
   * Generate shareable link with metadata
   */
  static createShareableLink(project: ProjectMetadata): {
    url: string;
    title: string;
    description: string;
  } {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/${project.url_slug}`;
    
    return {
      url,
      title: `${project.project_title} - AI Generated Book`,
      description: `View this AI-generated book project. Status: ${project.status}`
    };
  }

  /**
   * Store project metadata in localStorage for quick access
   */
  static saveProjectToLocalHistory(project: ProjectMetadata): void {
    try {
      const history = this.getLocalProjectHistory();
      
      // Remove existing entry if it exists
      const filtered = history.filter(p => p.usage_id !== project.usage_id);
      
      // Add new entry at the beginning
      filtered.unshift({
        ...project,
        last_accessed: new Date().toISOString()
      });
      
      // Keep only last 10 projects
      const trimmed = filtered.slice(0, 10);
      
      localStorage.setItem('project_history', JSON.stringify(trimmed));
    } catch (error) {
      console.warn('Failed to save project to local history:', error);
    }
  }

  /**
   * Get project history from localStorage
   */
  static getLocalProjectHistory(): ProjectMetadata[] {
    try {
      const history = localStorage.getItem('project_history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.warn('Failed to load project history:', error);
      return [];
    }
  }

  /**
   * Find project in local history by URL slug
   */
  static findProjectBySlug(urlSlug: string): ProjectMetadata | null {
    const history = this.getLocalProjectHistory();
    return history.find(p => p.url_slug === urlSlug) || null;
  }

  /**
   * Clear local project history
   */
  static clearLocalHistory(): void {
    try {
      localStorage.removeItem('project_history');
    } catch (error) {
      console.warn('Failed to clear project history:', error);
    }
  }

  /**
   * Generate a unique project title if none provided
   */
  static generateProjectTitle(concept?: string): string {
    if (concept) {
      // Extract meaningful title from concept
      const words = concept.split(' ').slice(0, 5);
      return words.join(' ').substring(0, 50);
    }
    
    // Generate a default title with timestamp
    const timestamp = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `Book Project ${timestamp}`;
  }

  /**
   * Validate project access permissions
   */
  static canAccessProject(project: ProjectMetadata, userId?: string): boolean {
    // In a real app, you'd check user permissions here
    // For now, just check if the project exists and isn't deleted
    return !!project && project.status !== 'deleted';
  }

  /**
   * Generate project analytics URL
   */
  static getProjectAnalyticsUrl(project: ProjectMetadata): string {
    return `/analytics/project/${project.project_uuid}`;
  }

  /**
   * Format project URL for different contexts
   */
  static formatProjectUrl(project: ProjectMetadata, context: 'view' | 'edit' | 'share' | 'analytics'): string {
    const baseUrl = `/${project.url_slug}`;
    
    switch (context) {
      case 'view':
        return baseUrl;
      case 'edit':
        return `${baseUrl}?mode=edit`;
      case 'share':
        return `${baseUrl}?shared=true`;
      case 'analytics':
        return this.getProjectAnalyticsUrl(project);
      default:
        return baseUrl;
    }
  }
}

export default ProjectUtils;
