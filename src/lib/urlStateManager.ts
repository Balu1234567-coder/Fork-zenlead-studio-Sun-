/**
 * URL State Manager for Book Generation
 * Handles unique URL generation, state persistence, and refresh recovery
 */

import { ProjectUtils, ProjectMetadata } from './projectUtils';

export interface BookGenerationUrlState {
  url_slug: string;
  project_uuid: string;
  usage_id?: string;
  status: 'draft' | 'processing' | 'completed' | 'failed' | 'paused';
  can_refresh: boolean;
  view_mode?: 'live' | 'viewer' | 'edit';
}

export class UrlStateManager {
  /**
   * Create a unique URL for a new book generation project
   */
  static createBookGenerationUrl(title: string): {
    url_slug: string;
    project_uuid: string;
    unique_url: string;
    shareable_url: string;
  } {
    const identifiers = ProjectUtils.createProjectIdentifiers(title);
    
    return {
      url_slug: identifiers.url_slug,
      project_uuid: identifiers.project_uuid,
      unique_url: identifiers.unique_url,
      shareable_url: identifiers.shareable_url
    };
  }

  /**
   * Update URL parameters without navigating away
   */
  static updateUrlParameters(params: Record<string, string>, replace: boolean = true): void {
    const url = new URL(window.location.href);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    });
    
    const method = replace ? 'replaceState' : 'pushState';
    window.history[method]({}, '', url.toString());
  }

  /**
   * Get URL state from current location
   */
  static getCurrentUrlState(): {
    identifier: string | null;
    view_mode: string | null;
    action: string | null;
  } {
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    const urlParams = new URLSearchParams(window.location.search);
    
    return {
      identifier: pathSegments[pathSegments.length - 1] || null,
      view_mode: urlParams.get('view'),
      action: urlParams.get('action')
    };
  }

  /**
   * Navigate to a book generation with specific view mode
   */
  static navigateToBook(urlSlug: string, viewMode?: 'live' | 'viewer' | 'edit', action?: string): void {
    const baseUrl = `/${urlSlug}`;
    const params = new URLSearchParams();
    
    if (viewMode) params.set('view', viewMode);
    if (action) params.set('action', action);
    
    const finalUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
    window.location.href = finalUrl;
  }

  /**
   * Save generation state for URL persistence
   */
  static saveGenerationState(urlSlug: string, state: Partial<BookGenerationUrlState>): void {
    try {
      const stateKey = `book_gen_state_${urlSlug}`;
      const currentState = this.getGenerationState(urlSlug);
      
      const updatedState = {
        ...currentState,
        ...state,
        last_updated: new Date().toISOString()
      };
      
      localStorage.setItem(stateKey, JSON.stringify(updatedState));
      
      // Also update in project history
      const projectHistory = ProjectUtils.getLocalProjectHistory();
      const projectIndex = projectHistory.findIndex(p => p.url_slug === urlSlug);
      
      if (projectIndex >= 0) {
        projectHistory[projectIndex] = {
          ...projectHistory[projectIndex],
          status: state.status || projectHistory[projectIndex].status,
          usage_id: state.usage_id || projectHistory[projectIndex].usage_id,
          last_accessed: new Date().toISOString()
        };
        
        localStorage.setItem('project_history', JSON.stringify(projectHistory));
      }
      
    } catch (error) {
      console.warn('Failed to save generation state:', error);
    }
  }

  /**
   * Get generation state for URL slug
   */
  static getGenerationState(urlSlug: string): BookGenerationUrlState | null {
    try {
      const stateKey = `book_gen_state_${urlSlug}`;
      const savedState = localStorage.getItem(stateKey);
      
      if (savedState) {
        return JSON.parse(savedState);
      }
      
      // Fallback to project history
      const project = ProjectUtils.findProjectBySlug(urlSlug);
      if (project) {
        return {
          url_slug: project.url_slug,
          project_uuid: project.project_uuid,
          usage_id: project.usage_id,
          status: project.status as any,
          can_refresh: true
        };
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to load generation state:', error);
      return null;
    }
  }

  /**
   * Clear generation state (on completion or cancellation)
   */
  static clearGenerationState(urlSlug: string): void {
    try {
      const stateKey = `book_gen_state_${urlSlug}`;
      localStorage.removeItem(stateKey);
    } catch (error) {
      console.warn('Failed to clear generation state:', error);
    }
  }

  /**
   * Check if current page can be safely refreshed
   */
  static canRefreshPage(): boolean {
    const { identifier } = this.getCurrentUrlState();
    
    if (!identifier) return true;
    
    const state = this.getGenerationState(identifier);
    return state?.can_refresh ?? false;
  }

  /**
   * Handle page refresh/reload scenario
   */
  static handlePageRefresh(): {
    should_resume: boolean;
    url_slug?: string;
    view_mode?: string;
    project_data?: ProjectMetadata;
  } {
    const { identifier, view_mode } = this.getCurrentUrlState();
    
    if (!identifier) {
      return { should_resume: false };
    }
    
    const state = this.getGenerationState(identifier);
    const project = ProjectUtils.findProjectBySlug(identifier);
    
    if (state && project) {
      return {
        should_resume: state.status === 'processing',
        url_slug: identifier,
        view_mode: view_mode || 'viewer',
        project_data: project
      };
    }
    
    return { should_resume: false };
  }

  /**
   * Generate shareable URL with tracking
   */
  static generateShareableUrl(project: ProjectMetadata): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/${project.url_slug}?shared=true`;
  }

  /**
   * Track URL access for analytics
   */
  static trackUrlAccess(urlSlug: string, accessType: 'direct' | 'share' | 'navigation'): void {
    try {
      const accessKey = `url_access_${urlSlug}`;
      const currentAccess = JSON.parse(localStorage.getItem(accessKey) || '[]');
      
      currentAccess.push({
        type: accessType,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent.substring(0, 100)
      });
      
      // Keep only last 10 access records
      const trimmed = currentAccess.slice(-10);
      localStorage.setItem(accessKey, JSON.stringify(trimmed));
      
    } catch (error) {
      console.warn('Failed to track URL access:', error);
    }
  }
}

export default UrlStateManager;
