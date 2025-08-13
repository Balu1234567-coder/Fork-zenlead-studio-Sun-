import { config } from '@/config/env';
import { tokenManager } from '@/lib/token';

// API Configuration
const API_BASE_URL = config.API_BASE_URL;

// Types based on your API models
export interface AIModel {
  _id: string;
  name: string;
  slug: string;
  category: 'audio' | 'text' | 'image' | 'video' | 'data' | 'content';
  description: string;
  success_rate: number;
  features: string[];
  input_types: string[];
  output_types: string[];
  pricing: {
    credits_per_use: number;
    premium_credits: number;
  };
  status: 'active' | 'inactive' | 'maintenance' | 'deprecated';
  estimated_time: string;
  tags: string[];
  extra_info: {
    description_detail: string;
    display_name: string;
    labels: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface UsageHistory {
  _id: string;
  ai_model_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  credits_used: number;
  created_at: string;
  completed_at?: string;
  has_output: boolean;
}

export interface APIResponse<T> {
  status: number;
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  models?: T[];
  popular_models?: T[];
  categories?: Array<{
    category: string;
    count: number;
    models: Array<{
      name: string;
      slug: string;
      description: string;
    }>;
  }>;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

class APIService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    // Add auth token if available
    try {
      const token = tokenManager.getToken();
      if (token && tokenManager.isTokenValid(token)) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      // localStorage might not be available in some environments
      console.warn('Could not access localStorage for auth token:', error);
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.detail || errorMessage;
        } catch {
          // If response is not JSON, use the status message
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);

      // Create a user-friendly error message
      let friendlyMessage = 'Network error occurred';
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          friendlyMessage = 'Unable to connect to server. Please check your internet connection.';
        } else if (error.message.includes('401')) {
          friendlyMessage = 'Authentication required. Please log in.';
        } else if (error.message.includes('403')) {
          friendlyMessage = 'Access denied. You do not have permission to access this resource.';
        } else if (error.message.includes('404')) {
          friendlyMessage = 'Resource not found.';
        } else if (error.message.includes('500')) {
          friendlyMessage = 'Server error occurred. Please try again later.';
        } else {
          friendlyMessage = error.message;
        }
      }

      throw new Error(friendlyMessage);
    }
  }

  // Get all AI models with filtering
  async getAllModels(params: {
    category?: string;
    status?: string;
    limit?: number;
    offset?: number;
    search?: string;
  } = {}): Promise<APIResponse<PaginatedResponse<AIModel>>> {
    const searchParams = new URLSearchParams();
    
    if (params.category) searchParams.append('category', params.category);
    if (params.status) searchParams.append('status', params.status || 'active');
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.offset) searchParams.append('offset', params.offset.toString());
    if (params.search) searchParams.append('search', params.search);

    const endpoint = `/api/ai/models?${searchParams.toString()}`;
    return this.makeRequest<PaginatedResponse<AIModel>>(endpoint);
  }

  // Get model by slug
  async getModelBySlug(slug: string): Promise<APIResponse<AIModel>> {
    return this.makeRequest<AIModel>(`/api/ai/models/${slug}`);
  }

  // Get model metadata
  async getModelMetadata(slug: string): Promise<APIResponse<any>> {
    return this.makeRequest<any>(`/api/ai/models/${slug}/metadata`);
  }

  // Get categories
  async getCategories(): Promise<APIResponse<PaginatedResponse<never>>> {
    return this.makeRequest<PaginatedResponse<never>>('/api/ai/categories');
  }

  // Get popular models
  async getPopularModels(limit: number = 10): Promise<APIResponse<PaginatedResponse<AIModel>>> {
    return this.makeRequest<PaginatedResponse<AIModel>>(`/api/ai/popular?limit=${limit}`);
  }

  // Get model pricing
  async getModelPricing(slug: string): Promise<APIResponse<any>> {
    return this.makeRequest<any>(`/api/ai/models/${slug}/pricing`);
  }

  // Get usage history for a model
  async getUsageHistory(
    slug: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<APIResponse<UsageHistory[]>> {
    return this.makeRequest<UsageHistory[]>(
      `/api/ai/models/${slug}/usage-history?limit=${limit}&offset=${offset}`
    );
  }

  // Get models by category
  async getModelsByCategory(category: string): Promise<APIResponse<PaginatedResponse<AIModel>>> {
    return this.getAllModels({ category, status: 'active' });
  }

  // Long-form book generation with Server-Sent Events streaming
  async generateLongFormBookStream(requestData: any): Promise<EventSource> {
    const url = `${API_BASE_URL}/api/ai/long-form-book/generate-stream`;

    // For EventSource, we need to send data via URL params for GET or use POST differently
    // Let's create a EventSource that handles POST data
    return new Promise((resolve, reject) => {
      try {
        // First, make the POST request to start the stream
        const defaultHeaders = {
          'Content-Type': 'application/json',
        };

        // Add auth token if available
        try {
          const token = tokenManager.getToken();
          if (token && tokenManager.isTokenValid(token)) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
          }
        } catch (error) {
          console.warn('Could not access localStorage for auth token:', error);
        }

        fetch(url, {
          method: 'POST',
          headers: defaultHeaders,
          body: JSON.stringify(requestData),
        }).then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          // For Server-Sent Events, we return the response object with a custom reader
          const customEventSource = {
            onmessage: null as ((event: MessageEvent) => void) | null,
            onerror: null as ((event: Event) => void) | null,
            onopen: null as ((event: Event) => void) | null,
            close: () => {},
            readyState: 1,
            url: url,
            withCredentials: false,
            CONNECTING: 0,
            OPEN: 1,
            CLOSED: 2,
            addEventListener: (type: string, listener: EventListener) => {},
            removeEventListener: (type: string, listener: EventListener) => {},
            dispatchEvent: (event: Event) => false
          };

          // Start reading the stream
          if (response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            const readStream = async () => {
              try {
                while (true) {
                  const { done, value } = await reader.read();

                  if (done) break;

                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split('\n');
                  buffer = lines.pop() || '';

                  for (const line of lines) {
                    if (line.startsWith('event:')) {
                      const eventType = line.substring(6).trim();
                    } else if (line.startsWith('data:')) {
                      const data = line.substring(5).trim();

                      if (customEventSource.onmessage) {
                        const event = new MessageEvent('message', {
                          data: data,
                          lastEventId: '',
                          origin: url,
                          source: null
                        });
                        customEventSource.onmessage(event);
                      }
                    }
                  }
                }
              } catch (error) {
                if (customEventSource.onerror) {
                  customEventSource.onerror(new Event('error'));
                }
              }
            };

            readStream();
          }

          resolve(customEventSource as any);
        }).catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Legacy book generation (non-streaming)
  async generateLongFormBook(requestData: any): Promise<APIResponse<any>> {
    return this.makeRequest<any>('/api/ai/long-form-book/generate', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  // Get complete stored book
  async getStoredBook(usageId: string): Promise<APIResponse<any>> {
    return this.makeRequest<any>(`/api/ai/long-form-book/${usageId}/stored`);
  }

  // Get book PDF for download
  async getBookPDF(usageId: string): Promise<APIResponse<any>> {
    return this.makeRequest<any>(`/api/ai/long-form-book/${usageId}/pdf`);
  }

  // Get book generation settings
  async getBookSettings(): Promise<APIResponse<any>> {
    return this.makeRequest<any>('/api/ai/long-form-book/settings');
  }

  // Get full book content by usage ID (legacy)
  async getBookContent(usageId: string): Promise<APIResponse<any>> {
    return this.makeRequest<any>(`/api/ai/long-form-book/${usageId}/content`);
  }

  // Create usage record
  async createUsageRecord(usageData: any): Promise<APIResponse<any>> {
    return this.makeRequest<any>('/api/ai/usage', {
      method: 'POST',
      body: JSON.stringify(usageData),
    });
  }

  // Get usage history
  async getUserUsageHistory(params: {
    ai_model_slug?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<APIResponse<any>> {
    const searchParams = new URLSearchParams();

    if (params.ai_model_slug) searchParams.append('ai_model_slug', params.ai_model_slug);
    if (params.status) searchParams.append('status', params.status);
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.offset) searchParams.append('offset', params.offset.toString());

    return this.makeRequest<any>(`/api/ai/usage/history?${searchParams.toString()}`);
  }

  // Get usage detail
  async getUsageDetail(usageId: string): Promise<APIResponse<any>> {
    return this.makeRequest<any>(`/api/ai/usage/${usageId}`);
  }

  // Get usage statistics
  async getUsageStats(): Promise<APIResponse<any>> {
    return this.makeRequest<any>('/api/ai/usage/stats');
  }

  // Resume Analysis
  async analyzeResume(formData: FormData): Promise<APIResponse<any>> {
    return this.makeRequest<any>('/api/ai/resume-analyzer/analyze', {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    });
  }

  // Get resume analyzer settings
  async getResumeAnalyzerSettings(): Promise<APIResponse<any>> {
    return this.makeRequest<any>('/api/ai/resume-analyzer/settings');
  }

  // Dynamic AI Model Settings
  async getModelSettings(modelSlug: string): Promise<APIResponse<any>> {
    return this.makeRequest<any>(`/api/ai/models/${modelSlug}/settings`);
  }

  // Get all model settings
  async getAllModelSettings(): Promise<APIResponse<any>> {
    return this.makeRequest<any>('/api/ai/models/settings/all');
  }

  // Validate user input against model schema
  async validateUserInput(modelSlug: string, userInput: any): Promise<APIResponse<any>> {
    return this.makeRequest<any>(`/api/ai/models/${modelSlug}/validate`, {
      method: 'POST',
      body: JSON.stringify(userInput),
    });
  }

  // Update model settings (admin)
  async updateModelSettings(modelSlug: string, settingsData: any): Promise<APIResponse<any>> {
    return this.makeRequest<any>(`/api/ai/admin/models/${modelSlug}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    });
  }
}

export const apiService = new APIService();
