import { tokenManager } from '@/lib/token';
import { config } from '@/config/env';

interface StreamEventHandler {
  onMessage?: (data: any) => void;
  onError?: (error: any) => void;
  onComplete?: () => void;
}

export class SSEStreamHandler {
  private controller: AbortController | null = null;

  async startStream(requestData: any, handlers: StreamEventHandler): Promise<void> {
    this.controller = new AbortController();
    
    const url = `${config.API_BASE_URL}/api/ai/long-form-book/generate-stream`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'Cache-Control': 'no-cache',
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

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify(requestData),
        signal: this.controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body for streaming');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          if (handlers.onComplete) {
            handlers.onComplete();
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let eventType = '';
        let eventData = '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          
          if (trimmedLine.startsWith('event:')) {
            eventType = trimmedLine.substring(6).trim();
          } else if (trimmedLine.startsWith('data:')) {
            eventData = trimmedLine.substring(5).trim();
            
            // When we have both event type and data, process it
            if (eventData) {
              try {
                const parsedData = JSON.parse(eventData);
                parsedData.eventType = eventType || 'message';
                
                if (handlers.onMessage) {
                  handlers.onMessage(parsedData);
                }
              } catch (error) {
                console.warn('Failed to parse event data:', eventData);
                
                // Send as raw data if parsing fails
                if (handlers.onMessage) {
                  handlers.onMessage({
                    type: eventType || 'message',
                    data: eventData,
                    raw: true
                  });
                }
              }
              
              // Reset for next event
              eventType = '';
              eventData = '';
            }
          } else if (trimmedLine === '') {
            // Empty line indicates end of event
            continue;
          }
        }
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Stream aborted by user');
      } else {
        console.error('Stream error:', error);
        if (handlers.onError) {
          handlers.onError(error);
        }
      }
    }
  }

  stop(): void {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }
}

export const createStreamHandler = () => new SSEStreamHandler();
