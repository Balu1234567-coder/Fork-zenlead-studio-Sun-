import { APIResponse } from './api';

export interface BookGenerationRequest {
  concept: string;
  genre: string;
  target_audience: string;
  book_length: string;
  tone: string;
  complexity: string;
  perspective: string;
  chapters_count: number;
  sections_per_chapter: number;
  pages_per_section: number;
  include_toc: boolean;
  include_images: boolean;
  include_bibliography: boolean;
  include_index: boolean;
  include_cover: boolean;
  author_name: string;
  book_title?: string;
}

export interface ProjectDraft {
  title: string;
  description?: string;
  settings: BookGenerationRequest;
  tags?: string[];
}

export interface AutoSaveData {
  usage_id: string;
  progress: number;
  current_chapter: number;
  current_message: string;
  chapters_completed: number;
  partial_content: any;
  generation_state: any;
  save_sequence: number;
  can_recover: boolean;
}

export interface HeartbeatData {
  client_timestamp: string;
  last_received_event?: string;
  connection_id: string;
}

export class EnhancedBookApiService {
  private static getAuthHeaders() {
    const token = localStorage.getItem('auth_token');

    if (!token) {
      console.warn('No auth token found in localStorage');
    }

    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Enhanced generation with streaming
  static async startBookGeneration(requestData: BookGenerationRequest): Promise<Response> {
    const response = await fetch('/api/ai/long-form-book/generate-stream', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  }

  // Check credits before generation
  static async checkCredits(): Promise<any> {
    const response = await fetch('/api/ai/long-form-book/check-credits', {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to check credits');
    }

    const result = await response.json();
    return result;
  }

  // Get stored book with full content
  static async getStoredBook(usageId: string): Promise<any> {
    const response = await fetch(`/api/ai/long-form-book/${usageId}/stored`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to get stored book');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to get stored book');
    }

    return result.data;
  }

  // Download PDF
  static async downloadBookPDF(usageId: string): Promise<void> {
    const response = await fetch(`/api/ai/long-form-book/${usageId}/pdf`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to get PDF');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to get PDF');
    }

    // Download the PDF
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${result.data.pdf_base64}`;
    link.download = result.data.filename || 'book.pdf';
    link.click();
  }

  // Get generation status
  static async getGenerationStatus(usageId: string): Promise<any> {
    console.log('Fetching status for usageId:', usageId);

    const response = await fetch(`/api/ai/long-form-book/${usageId}/status`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`Status API error ${response.status}:`, errorText);
      throw new Error(`Failed to get status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    if (!result.success) {
      console.error('Status API returned unsuccessful result:', result);
      throw new Error(result.message || 'Failed to get status');
    }

    return result.data;
  }

  // Cancel generation
  static async cancelGeneration(usageId: string): Promise<any> {
    const response = await fetch(`/api/ai/long-form-book/${usageId}/cancel`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to cancel generation');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to cancel generation');
    }

    return result.data;
  }

  // Get user book history
  static async getUserBookHistory(limit: number = 10, offset: number = 0): Promise<any> {
    const response = await fetch(`/api/ai/long-form-book/history?limit=${limit}&offset=${offset}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to get book history');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to get book history');
    }

    return result.data;
  }

  // Get duplicate settings
  static async getDuplicateSettings(usageId: string): Promise<any> {
    const response = await fetch(`/api/ai/long-form-book/${usageId}/duplicate`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to get duplicate settings');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to get duplicate settings');
    }

    return result.data;
  }

  // Pause generation
  static async pauseGeneration(usageId: string, reason: string = 'user_requested'): Promise<any> {
    const response = await fetch(`/api/ai/long-form-book/${usageId}/pause`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        reason,
        save_checkpoint: true,
        preserve_url: true
      })
    });

    if (!response.ok) {
      throw new Error('Failed to pause generation');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to pause generation');
    }

    return result.data;
  }

  // Resume generation (returns streaming response)
  static async resumeGeneration(usageId: string): Promise<Response> {
    const response = await fetch(`/api/ai/long-form-book/${usageId}/resume`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        resume_from: 'last_checkpoint'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to resume generation');
    }

    return response;
  }

  // Get complete generation state
  static async getGenerationState(usageId: string): Promise<any> {
    const response = await fetch(`/api/ai/long-form-book/${usageId}/state`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to get generation state');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to get generation state');
    }

    return result.data;
  }

  // Get projects dashboard
  static async getProjectsDashboard(): Promise<any> {
    const response = await fetch('/api/ai/long-form-book/projects', {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to get projects dashboard');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to get projects dashboard');
    }

    return result.data;
  }

  // Get real-time dashboard
  static async getRealTimeDashboard(): Promise<any> {
    const response = await fetch('/api/ai/long-form-book/dashboard/real-time', {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to get real-time dashboard');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to get real-time dashboard');
    }

    return result.data;
  }

  // Get project by URL slug
  static async getProjectBySlug(urlSlug: string): Promise<any> {
    const response = await fetch(`/api/ai/long-form-book/project/${urlSlug}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to get project by slug');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to get project by slug');
    }

    return result.data;
  }

  // Create draft project
  static async createDraftProject(projectData: ProjectDraft): Promise<any> {
    const response = await fetch('/api/ai/long-form-book/draft', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(projectData)
    });

    if (!response.ok) {
      throw new Error('Failed to create draft project');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to create draft project');
    }

    return result.data;
  }

  // Auto-save progress
  static async autoSaveProgress(usageId: string, saveData: AutoSaveData): Promise<any> {
    const response = await fetch(`/api/ai/long-form-book/${usageId}/auto-save`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(saveData)
    });

    if (!response.ok) {
      throw new Error('Failed to auto-save progress');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to auto-save progress');
    }

    return result.data;
  }

  // Network recovery
  static async handleNetworkRecovery(usageId: string, lastEventId?: string): Promise<any> {
    const url = lastEventId 
      ? `/api/ai/long-form-book/${usageId}/recovery?last_event_id=${encodeURIComponent(lastEventId)}`
      : `/api/ai/long-form-book/${usageId}/recovery`;

    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to handle network recovery');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to handle network recovery');
    }

    return result.data;
  }

  // Stream recovery
  static async getStreamRecovery(usageId: string, lastEventId?: string): Promise<Response> {
    const url = lastEventId 
      ? `/api/ai/long-form-book/${usageId}/stream-recovery?last_event_id=${encodeURIComponent(lastEventId)}`
      : `/api/ai/long-form-book/${usageId}/stream-recovery`;

    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to get stream recovery');
    }

    return response;
  }

  // Send heartbeat
  static async sendHeartbeat(usageId: string, heartbeatData: HeartbeatData): Promise<any> {
    const response = await fetch(`/api/ai/long-form-book/${usageId}/heartbeat`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(heartbeatData)
    });

    if (!response.ok) {
      throw new Error('Failed to send heartbeat');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to send heartbeat');
    }

    return result.data;
  }

  // Get full chapter content
  static async getFullChapterContent(usageId: string, chapterNumber: number): Promise<any> {
    const response = await fetch(`/api/ai/long-form-book/${usageId}/chapter/${chapterNumber}/full`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to get full chapter content');
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to get full chapter content');
    }

    return result.data;
  }
}

// Export as default for backward compatibility
export default EnhancedBookApiService;
