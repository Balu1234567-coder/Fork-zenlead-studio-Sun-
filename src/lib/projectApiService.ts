const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface ProjectSummary {
  usage_id: string;
  project_type: string;
  project_name: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  completed_at?: string;
  credits_used: number;
  has_results: boolean;
  project_url: string;
  thumbnail?: string;
  subtitle?: string;
  status_info: {
    color: string;
    icon: string;
    can_open: boolean;
    is_processing: boolean;
    progress_available: boolean;
  };
}

export interface ProjectDetail {
  usage_id: string;
  project_type: string;
  project_name: string;
  status: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  credits_used: number;
  error_message?: string;
  book_data?: {
    title: string;
    concept: string;
    genre: string;
    settings: any;
  };
  navigation: {
    can_duplicate: boolean;
    can_cancel: boolean;
    can_download_pdf: boolean;
    can_view_chapters: boolean;
  };
  status_data: any;
}

export interface ProjectStatus {
  usage_id: string;
  status: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  credits_used: number;
  error_message?: string;
  has_output: boolean;
  progress_info: {
    is_pending: boolean;
    is_processing: boolean;
    is_completed: boolean;
    is_failed: boolean;
    is_cancelled: boolean;
  };
  estimated_completion?: string;
}

class ProjectApiService {
  private static getAuthHeaders() {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  // Get all user projects for sidebar
  static async getAllProjects(): Promise<{
    projects: ProjectSummary[];
    projects_by_type: Record<string, ProjectSummary[]>;
    pagination: any;
    summary: any;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/projects`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      throw error;
    }
  }

  // Get processing projects for real-time updates
  static async getProcessingProjects(): Promise<ProjectSummary[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/projects/processing`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data.processing_projects;
    } catch (error) {
      console.error('Failed to fetch processing projects:', error);
      throw error;
    }
  }

  // Get specific project details (for long-form book)
  static async getBookProject(usageId: string): Promise<ProjectDetail> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/long-form-book/project/${usageId}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to fetch book project:', error);
      throw error;
    }
  }

  // Get project status (for polling)
  static async getProjectStatus(usageId: string, projectType: string = 'long-form-book'): Promise<ProjectStatus> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/${projectType}/${usageId}/status`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to fetch project status:', error);
      throw error;
    }
  }

  // Get stored book data
  static async getStoredBook(usageId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/long-form-book/${usageId}/stored`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to fetch stored book:', error);
      throw error;
    }
  }

  // Download PDF
  static async downloadBookPDF(usageId: string): Promise<{
    pdf_base64: string;
    filename: string;
    book_title: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/long-form-book/${usageId}/pdf`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to download PDF:', error);
      throw error;
    }
  }

  // Cancel project
  static async cancelProject(usageId: string, projectType: string = 'long-form-book'): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/${projectType}/${usageId}/cancel`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to cancel project:', error);
      throw error;
    }
  }

  // Duplicate project
  static async duplicateProject(usageId: string, projectType: string = 'long-form-book'): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/${projectType}/${usageId}/duplicate`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to duplicate project:', error);
      throw error;
    }
  }
}

export default ProjectApiService;
