interface BookGenerationState {
  usageId: string;
  requestData: any;
  status: 'generating' | 'completed' | 'error';
  progress: number;
  currentMessage: string;
  chapters: any[];
  bookMetadata: any;
  tableOfContents: any[];
  generationComplete: boolean;
  pdfBase64: string;
  startTime: number;
  error?: string;
}

const STORAGE_KEY = 'bookGenerationState';
const STATE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export class BookGenerationStateManager {
  
  static saveState(state: BookGenerationState): void {
    try {
      const stateWithTimestamp = {
        ...state,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateWithTimestamp));
    } catch (error) {
      console.warn('Failed to save book generation state:', error);
    }
  }

  static loadState(): BookGenerationState | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;

      const state = JSON.parse(saved);
      
      // Check if state is expired
      if (Date.now() - state.timestamp > STATE_EXPIRY) {
        this.clearState();
        return null;
      }

      // Remove timestamp before returning
      delete state.timestamp;
      return state;
    } catch (error) {
      console.warn('Failed to load book generation state:', error);
      this.clearState();
      return null;
    }
  }

  static clearState(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear book generation state:', error);
    }
  }

  static updateState(updates: Partial<BookGenerationState>): void {
    const currentState = this.loadState();
    if (currentState) {
      const newState = { ...currentState, ...updates };
      this.saveState(newState);
    }
  }

  static isGenerating(): boolean {
    const state = this.loadState();
    return state?.status === 'generating' || false;
  }

  static getUsageId(): string | null {
    const state = this.loadState();
    return state?.usageId || null;
  }

  static createInitialState(usageId: string, requestData: any): BookGenerationState {
    return {
      usageId,
      requestData,
      status: 'generating',
      progress: 0,
      currentMessage: 'Starting generation...',
      chapters: [],
      bookMetadata: null,
      tableOfContents: [],
      generationComplete: false,
      pdfBase64: '',
      startTime: Date.now()
    };
  }
}

// Generation status checker for polling when needed
export class GenerationStatusChecker {
  private intervalId: number | null = null;
  private usageId: string;
  private onUpdate: (status: any) => void;

  constructor(usageId: string, onUpdate: (status: any) => void) {
    this.usageId = usageId;
    this.onUpdate = onUpdate;
  }

  start(intervalMs: number = 5000): void {
    this.stop(); // Clear any existing interval
    
    this.intervalId = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/ai/long-form-book/${this.usageId}/status`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          this.onUpdate(data);
          
          // Stop polling if generation is complete or failed
          if (data.data?.status === 'completed' || data.data?.status === 'failed') {
            this.stop();
          }
        }
      } catch (error) {
        console.warn('Failed to check generation status:', error);
      }
    }, intervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

// Utility functions for managing book generation across components
export const BookGenerationUtils = {
  
  isCurrentlyGenerating(): boolean {
    return BookGenerationStateManager.isGenerating();
  },

  getCurrentGenerationId(): string | null {
    return BookGenerationStateManager.getUsageId();
  },

  hasActiveGeneration(): { active: boolean; usageId?: string; requestData?: any } {
    const state = BookGenerationStateManager.loadState();
    if (state && state.status === 'generating') {
      return {
        active: true,
        usageId: state.usageId,
        requestData: state.requestData
      };
    }
    return { active: false };
  },

  resumeGeneration(): BookGenerationState | null {
    const state = BookGenerationStateManager.loadState();
    if (state && state.status === 'generating') {
      // Check if generation started more than 30 minutes ago
      const thirtyMinutes = 30 * 60 * 1000;
      if (Date.now() - state.startTime > thirtyMinutes) {
        // Mark as potentially timed out
        BookGenerationStateManager.updateState({ 
          status: 'error',
          error: 'Generation may have timed out. Please start a new generation.'
        });
        return null;
      }
      return state;
    }
    return null;
  },

  completeGeneration(finalData: any): void {
    BookGenerationStateManager.updateState({
      status: 'completed',
      generationComplete: true,
      progress: 100,
      currentMessage: 'Generation completed!',
      ...finalData
    });
  },

  failGeneration(error: string): void {
    BookGenerationStateManager.updateState({
      status: 'error',
      error,
      currentMessage: `Error: ${error}`
    });
  },

  startNewGeneration(usageId: string, requestData: any): void {
    const initialState = BookGenerationStateManager.createInitialState(usageId, requestData);
    BookGenerationStateManager.saveState(initialState);
  },

  cancelGeneration(): void {
    BookGenerationStateManager.clearState();
  }
};
