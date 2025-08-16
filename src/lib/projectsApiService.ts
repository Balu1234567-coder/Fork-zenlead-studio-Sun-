import { Project, ProjectType, ProjectStatus, ProjectsListOptions, ProjectGroup } from '@/types/projects';

// Base API URL - this should match your backend
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

interface ProjectsListResponse {
  projects: Project[];
  totalCount: number;
  hasMore: boolean;
  nextPage?: number;
}

export class ProjectsApiService {
  
  // Get all projects for the current user
  static async getAllProjects(options?: ProjectsListOptions): Promise<ApiResponse<ProjectsListResponse>> {
    try {
      const params = new URLSearchParams();
      
      if (options?.filter?.type) {
        params.append('types', options.filter.type.join(','));
      }
      
      if (options?.filter?.status) {
        params.append('statuses', options.filter.status.join(','));
      }
      
      if (options?.filter?.searchQuery) {
        params.append('search', options.filter.searchQuery);
      }
      
      if (options?.sort) {
        params.append('sortField', options.sort.field);
        params.append('sortDirection', options.sort.direction);
      }
      
      if (options?.pagination) {
        params.append('page', options.pagination.page.toString());
        params.append('limit', options.pagination.limit.toString());
      }
      
      const response = await fetch(`${API_BASE_URL}/ai/projects?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      throw error;
    }
  }
  
  // Get projects grouped by type
  static async getProjectsByType(): Promise<ApiResponse<ProjectGroup[]>> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/projects/grouped`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch grouped projects:', error);
      throw error;
    }
  }
  
  // Get a specific project by ID
  static async getProject(projectId: string): Promise<ApiResponse<Project>> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch project:', error);
      throw error;
    }
  }
  
  // Get project status (for real-time updates)
  static async getProjectStatus(projectId: string): Promise<ApiResponse<{
    status: ProjectStatus;
    progress?: number;
    currentStep?: string;
    estimatedTime?: number;
  }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/projects/${projectId}/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch project status:', error);
      throw error;
    }
  }
  
  // Delete a project
  static async deleteProject(projectId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  }
  
  // Duplicate a project
  static async duplicateProject(projectId: string): Promise<ApiResponse<Project>> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/projects/${projectId}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to duplicate project:', error);
      throw error;
    }
  }
  
  // Update project metadata (title, description)
  static async updateProject(projectId: string, updates: {
    title?: string;
    description?: string;
  }): Promise<ApiResponse<Project>> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to update project:', error);
      throw error;
    }
  }
  
  // Get project statistics
  static async getProjectStats(): Promise<ApiResponse<{
    totalProjects: number;
    projectsByType: Record<ProjectType, number>;
    projectsByStatus: Record<ProjectStatus, number>;
    recentActivity: Project[];
  }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/projects/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch project stats:', error);
      throw error;
    }
  }
  
  // Cancel a processing project
  static async cancelProject(projectId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/projects/${projectId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to cancel project:', error);
      throw error;
    }
  }
}

// Utility functions for project management
export const ProjectUtils = {
  // Generate project URL based on type and ID
  generateProjectUrl(project: Project): string {
    const baseUrl = project.type === 'long-form-book' 
      ? `/book-generation/${project.urlSlug || project.id}`
      : `/ai/${project.type}/project/${project.id}`;
    
    return baseUrl;
  },
  
  // Get project display color based on status
  getStatusColor(status: ProjectStatus): string {
    const colors = {
      'processing': 'text-blue-600 bg-blue-50',
      'completed': 'text-green-600 bg-green-50',
      'failed': 'text-red-600 bg-red-50',
      'cancelled': 'text-gray-600 bg-gray-50',
      'pending': 'text-yellow-600 bg-yellow-50',
    };
    
    return colors[status] || colors.pending;
  },
  
  // Format project metadata for display
  formatMetadata(project: Project): string[] {
    const metadata: string[] = [];
    
    // Add common metadata
    if (project.metadata.createdAt) {
      metadata.push(`Created: ${new Date(project.metadata.createdAt).toLocaleDateString()}`);
    }
    
    // Add type-specific metadata
    switch (project.type) {
      case 'long-form-book':
        if (project.metadata.wordCount) {
          metadata.push(`${project.metadata.wordCount.toLocaleString()} words`);
        }
        if (project.metadata.chapterCount) {
          metadata.push(`${project.metadata.chapterCount} chapters`);
        }
        break;
        
      case 'audio-processing':
      case 'voice-clone':
      case 'audio-enhance':
        if (project.metadata.audioDuration) {
          const minutes = Math.floor(project.metadata.audioDuration / 60);
          const seconds = project.metadata.audioDuration % 60;
          metadata.push(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
        break;
        
      case 'image-generation':
        if (project.metadata.dimensions) {
          metadata.push(`${project.metadata.dimensions.width}x${project.metadata.dimensions.height}`);
        }
        break;
        
      case 'video-generation':
        if (project.metadata.videoDuration) {
          const minutes = Math.floor(project.metadata.videoDuration / 60);
          const seconds = project.metadata.videoDuration % 60;
          metadata.push(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
        if (project.metadata.resolution) {
          metadata.push(project.metadata.resolution);
        }
        break;
    }
    
    return metadata;
  },
  
  // Check if project is actively processing
  isProcessing(project: Project): boolean {
    return project.status === 'processing' || project.status === 'pending';
  },
  
  // Get estimated completion time
  getEstimatedCompletion(project: Project): string | null {
    if (!this.isProcessing(project) || !project.metadata.estimatedTime) {
      return null;
    }
    
    const now = new Date();
    const completion = new Date(now.getTime() + project.metadata.estimatedTime * 1000);
    
    return completion.toLocaleTimeString();
  }
};
