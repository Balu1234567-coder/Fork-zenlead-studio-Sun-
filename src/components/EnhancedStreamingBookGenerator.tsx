import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Book,
  Download,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  Clock,
  Loader2,
  CreditCard,
  AlertTriangle,
  X,
  RefreshCw,
  Pause,
  Play,
  ArrowLeft,
  Save,
  Eye,
  BookOpen
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SSEStreamHandler, createStreamHandler } from "@/lib/streamHandler";
import { PDFGenerator } from "@/lib/pdfGenerator";
import { BookGenerationStateManager, BookGenerationUtils } from "@/lib/bookGenerationState";
import { BookContentRenderer } from "@/components/BookContentRenderer";
import { BookApiService } from "@/lib/bookApi";
import { BookGenerationRecovery } from "@/lib/networkRecovery";

interface StreamEvent {
  type: string;
  message?: string;
  progress?: number;
  data?: any;
  chapter_number?: number;
  error?: string;
  error_code?: string;
  book_data?: any;
  usage_id?: string;
  credits_required?: number;
  credits_available?: number;
  credits_needed?: number;
}

interface Chapter {
  chapter_number: number;
  title: string;
  content: string;
  word_count: number;
  images: Array<{
    caption: string;
    data: string;
    source: string;
  }>;
  completed: boolean;
  sections?: string[];
  formatted_content?: string;
}

interface BookMetadata {
  title: string;
  author: string;
  total_chapters: number;
  total_words: number;
  total_images: number;
  generation_time: string;
}

interface EnhancedStreamingBookGeneratorProps {
  requestData: any;
  onComplete?: (usageId: string, bookData: any) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  resumeState?: any;
}

const EnhancedStreamingBookGenerator: React.FC<EnhancedStreamingBookGeneratorProps> = ({
  requestData,
  onComplete,
  onError,
  onCancel,
  resumeState
}) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [canPause, setCanPause] = useState(false);
  const [pauseReason, setPauseReason] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [bookMetadata, setBookMetadata] = useState<BookMetadata | null>(null);
  const [tableOfContents, setTableOfContents] = useState<any[]>([]);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [usageId, setUsageId] = useState<string>('');
  const [showCreditError, setShowCreditError] = useState(false);
  const [creditErrorInfo, setCreditErrorInfo] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string>('');
  
  const streamHandler = useRef<SSEStreamHandler | null>(null);
  const startTime = useRef<number>(Date.now());
  const recoveryManager = useRef<BookGenerationRecovery | null>(null);

  const [isOffline, setIsOffline] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Initialize from resume state if available
  useEffect(() => {
    if (resumeState) {
      setUsageId(resumeState.usageId);
      setProgress(resumeState.progress);
      setCurrentMessage(resumeState.currentMessage);
      setChapters(resumeState.chapters || []);
      setBookMetadata(resumeState.bookMetadata);
      setTableOfContents(resumeState.tableOfContents || []);
      setGenerationComplete(resumeState.generationComplete);
      setIsGenerating(resumeState.status === 'generating');
      setIsPaused(resumeState.status === 'paused');
      startTime.current = resumeState.startTime || Date.now();
    }
  }, [resumeState]);

  // Attempt recovery from saved state if no resume state provided
  useEffect(() => {
    if (!resumeState && usageId && recoveryManager.current) {
      const attemptRecovery = async () => {
        try {
          const recoveredState = await recoveryManager.current?.recoverState();

          if (recoveredState) {
            console.log('🔄 Recovered state from previous session');

            setProgress(recoveredState.progress || 0);
            setCurrentMessage(recoveredState.currentMessage || 'Recovered from previous session');
            setChapters(recoveredState.chapters || []);
            setBookMetadata(recoveredState.bookMetadata);
            setTableOfContents(recoveredState.tableOfContents || []);
            setGenerationComplete(recoveredState.generationComplete || false);
            setIsPaused(recoveredState.status === 'paused');
            startTime.current = recoveredState.startTime || Date.now();

            toast({
              title: "Session Recovered",
              description: "Restored your previous progress",
            });
          }
        } catch (error) {
          console.warn('Recovery failed:', error);
        }
      };

      attemptRecovery();
    }
  }, [usageId, resumeState, toast]);

  // Update estimated time remaining
  useEffect(() => {
    if (isGenerating && !generationComplete) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime.current;
        const elapsedMinutes = elapsed / (1000 * 60);
        const estimatedTotal = 25; // 25 minutes average
        const remaining = Math.max(0, estimatedTotal - elapsedMinutes);
        
        if (remaining > 1) {
          setEstimatedTimeRemaining(`~${Math.round(remaining)} min`);
        } else {
          setEstimatedTimeRemaining('Almost done');
        }
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isGenerating, generationComplete]);

  const saveCurrentState = useCallback(() => {
    if (usageId) {
      BookGenerationStateManager.updateState({
        usageId,
        requestData,
        status: generationComplete ? 'completed' : isGenerating ? 'generating' : 'error',
        progress,
        currentMessage,
        chapters,
        bookMetadata,
        tableOfContents,
        generationComplete,
        pdfBase64: '',
        startTime: startTime.current
      });
    }
  }, [usageId, requestData, generationComplete, isGenerating, progress, currentMessage, chapters, bookMetadata, tableOfContents]);

  // Auto-save state
  useEffect(() => {
    saveCurrentState();
  }, [saveCurrentState]);

  // Initialize network recovery when usageId is available
  useEffect(() => {
    if (usageId && !recoveryManager.current) {
      recoveryManager.current = new BookGenerationRecovery(usageId);
      recoveryManager.current.startMonitoring();

      console.log('🔄 Network recovery initialized for:', usageId);
    }

    return () => {
      if (recoveryManager.current) {
        recoveryManager.current.stopMonitoring();
      }
    };
  }, [usageId]);

  // Auto-save progress periodically to backend
  useEffect(() => {
    if (usageId && autoSaveEnabled &&
        (isGenerating || chapters.length > 0)) {

      const autoSaveInterval = setInterval(async () => {
        try {
          const saveData = {
            usage_id: usageId,
            progress,
            current_chapter: chapters.length + 1,
            current_message: currentMessage,
            chapters_completed: chapters.length,
            partial_content: {
              chapters,
              bookMetadata,
              tableOfContents
            },
            generation_state: {
              isGenerating,
              isPaused,
              generationComplete,
              pauseReason
            },
            save_sequence: Date.now(),
            can_recover: true
          };

          // Call new backend auto-save endpoint
          const response = await fetch(`/api/ai/long-form-book/${usageId}/auto-save`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(saveData)
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              setLastSaveTime(new Date());
              console.log('💾 Auto-saved to backend');
            }
          }

          // Also save locally for backup
          recoveryManager.current?.saveProgress(saveData);

        } catch (error) {
          console.warn('Auto-save failed:', error);
        }
      }, 30000); // Auto-save every 30 seconds

      return () => clearInterval(autoSaveInterval);
    }
  }, [usageId, autoSaveEnabled, isGenerating, progress, chapters, bookMetadata,
      tableOfContents, generationComplete, currentMessage, isPaused, pauseReason]);

  const processStreamEvent = useCallback((event: StreamEvent) => {
    console.log('📡 Stream event:', event);

    // Track event for network recovery
    if (recoveryManager.current && event.type) {
      const eventId = `${event.type}_${Date.now()}`;
      recoveryManager.current.updateLastEvent(eventId);
    }

    switch (event.type) {
      case 'start':
        setCurrentMessage(event.message || 'Starting generation...');
        setProgress(0);
        setCanPause(true);
        setIsPaused(false);
        break;

      case 'credits_deducted':
        setCurrentMessage(event.message || 'Credits deducted successfully...');
        setUsageId(event.usage_id || '');
        setProgress(5);

        // Navigate to project page after credits deducted
        if (event.usage_id) {
          const projectUrl = `/texts/long-form-book/${event.usage_id}?view=live`;
          console.log('🚀 Navigating to project after credits deducted:', projectUrl);

          toast({
            title: "Redirecting",
            description: "Taking you to your book project...",
            duration: 2000,
          });

          setTimeout(() => {
            window.location.href = projectUrl;
          }, 2000);
        }
        break;

      case 'progress':
        setCurrentMessage(event.message || 'Processing...');
        if (event.progress) {
          setProgress(event.progress);
        }
        break;

      case 'structure':
        if (event.data) {
          setTableOfContents(event.data.table_of_contents || []);
          setBookMetadata(prev => ({
            title: event.data.title || '',
            author: prev?.author || '',
            total_chapters: prev?.total_chapters || 0,
            total_words: prev?.total_words || 0,
            total_images: prev?.total_images || 0,
            generation_time: prev?.generation_time || ''
          }));
        }
        break;

      case 'chapter_complete':
        if (event.chapter_number && event.title) {
          setChapters(prev => {
            const updated = [...prev];
            const existingIndex = updated.findIndex(ch => ch.chapter_number === event.chapter_number);

            const newChapter: Chapter = {
              chapter_number: event.chapter_number!,
              title: event.title || '',
              content: event.full_content || event.content || event.content_preview || '', // Use FULL content first
              word_count: event.word_count || 0,
              images: event.images || [], // Include images from backend
              completed: true,
              sections: event.sections || []
            };

            if (existingIndex >= 0) {
              updated[existingIndex] = { ...updated[existingIndex], ...newChapter };
            } else {
              updated.push(newChapter);
            }

            return updated.sort((a, b) => a.chapter_number - b.chapter_number);
          });
        }
        break;

      case 'image_added':
        if (event.chapter_number && event.image) {
          setChapters(prev => {
            const updated = [...prev];
            const chapterIndex = updated.findIndex(ch => ch.chapter_number === event.chapter_number);
            
            if (chapterIndex >= 0) {
              updated[chapterIndex].images.push(event.image);
            }

            return updated;
          });
        }
        break;

      case 'paused':
        setCurrentMessage('Generation paused successfully');
        setIsPaused(true);
        setIsGenerating(false);
        setCanPause(false);
        setPauseReason(event.reason || 'Paused by user');

        toast({
          title: "Paused",
          description: "Generation paused. Your progress has been saved.",
        });
        break;

      case 'resumed':
        setCurrentMessage('Generation resumed');
        setIsPaused(false);
        setIsGenerating(true);
        setCanPause(true);
        setPauseReason('');

        toast({
          title: "Resumed",
          description: "Generation resumed from saved checkpoint.",
        });
        break;

      case 'complete':
        setCurrentMessage('Book generation completed!');
        setProgress(100);
        setGenerationComplete(true);
        setCanPause(false);

        if (event.book_data) {
          if (event.book_data.metadata) {
            setBookMetadata(event.book_data.metadata);
          }

          if (event.book_data.table_of_contents) {
            setTableOfContents(event.book_data.table_of_contents);
          }

          // Process complete chapters if available
          if (event.book_data.complete_chapters && event.book_data.complete_chapters.length > 0) {
            const completeChapters = event.book_data.complete_chapters.map((ch: any) => ({
              chapter_number: ch.chapter_number,
              title: ch.title,
              content: ch.full_content || ch.content,
              word_count: ch.word_count,
              images: ch.images || [],
              completed: true,
              sections: ch.sections || []
            }));

            setChapters(completeChapters);
          }
        }
        break;

      case 'stored':
        if (event.usage_id) {
          setUsageId(event.usage_id);
          BookGenerationUtils.completeGeneration({
            bookMetadata,
            chapters,
            tableOfContents
          });
          
          toast({
            title: "Success",
            description: "Book generated and stored successfully!",
          });
          
          if (onComplete && event.usage_id) {
            onComplete(event.usage_id, event.book_data || {});
          }
        }
        break;

      case 'error':
        console.error('❌ Stream error:', event);
        
        if (event.error_code === 'INSUFFICIENT_CREDITS') {
          setShowCreditError(true);
          setCreditErrorInfo({
            credits_required: event.credits_required || 50,
            credits_available: event.credits_available || 0,
            credits_needed: event.credits_needed || 50
          });
          setCurrentMessage('Insufficient credits to generate book');
        } else {
          setCurrentMessage(`Error: ${event.message || event.error || 'Unknown error'}`);
          BookGenerationUtils.failGeneration(event.message || event.error || 'Unknown error');
          
          toast({
            title: "Error",
            description: event.message || event.error || 'Failed to generate book',
            variant: "destructive"
          });
        }
        
        if (onError) {
          onError(event.message || event.error || 'Unknown error');
        }
        
        setIsGenerating(false);
        break;
    }
  }, [toast, onComplete, onError, bookMetadata, chapters, tableOfContents]);

  const startGeneration = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (isGenerating || streamHandler.current) {
      console.log('⚠️ Generation already in progress, skipping request');
      return;
    }

    console.log('🚀 Starting book generation...');
    setIsGenerating(true);
    setProgress(0);
    setCurrentMessage('Initializing...');
    setChapters([]);
    setBookMetadata(null);
    setTableOfContents([]);
    setGenerationComplete(false);
    setShowCreditError(false);
    startTime.current = Date.now();

    try {
      streamHandler.current = createStreamHandler();

      await streamHandler.current.startStream(requestData, {
        onMessage: processStreamEvent,
        onError: (error) => {
          console.error('❌ Streaming error:', error);
          setCurrentMessage(`Error: ${error.message}`);
          setIsGenerating(false);
          streamHandler.current = null; // Clear handler on error

          if (onError) {
            onError(error.message);
          }
        },
        onComplete: () => {
          console.log('✅ Stream completed');
          setIsGenerating(false);
          streamHandler.current = null; // Clear handler on completion
        }
      });

    } catch (error: any) {
      console.error('❌ Streaming error:', error);
      setCurrentMessage(`Error: ${error.message}`);
      setIsGenerating(false);
      streamHandler.current = null; // Clear handler on error

      if (onError) {
        onError(error.message);
      }
    }
  }, [requestData, processStreamEvent, onError]); // Remove isGenerating from dependencies

  const stopGeneration = useCallback(() => {
    console.log('🛑 Stopping generation...');
    if (streamHandler.current) {
      streamHandler.current.stop();
      streamHandler.current = null;
    }

    setIsGenerating(false);
    setCurrentMessage('Generation stopped');
    BookGenerationUtils.cancelGeneration();
  }, []);

  const pauseGeneration = useCallback(async () => {
    if (!usageId || isPaused) return;

    try {
      setCurrentMessage('Pausing generation...');

      // Stop current stream
      if (streamHandler.current) {
        streamHandler.current.stop();
      }

      // Call backend pause endpoint
      const response = await fetch(`/api/ai/long-form-book/${usageId}/pause`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: 'user_requested',
          save_checkpoint: true,
          preserve_url: true
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setIsPaused(true);
          setIsGenerating(false);
          setCurrentMessage('Generation paused successfully. You can resume anytime.');
          setPauseReason('User requested pause');

          // Save current state
          saveCurrentState();

          toast({
            title: "Paused",
            description: "Generation has been paused. Your progress is saved.",
          });
        }
      } else {
        throw new Error('Failed to pause generation');
      }
    } catch (error: any) {
      console.error('Failed to pause generation:', error);
      toast({
        title: "Error",
        description: "Failed to pause generation. Please try again.",
        variant: "destructive"
      });
    }
  }, [usageId, isPaused, saveCurrentState, toast]);

  const resumeGeneration = useCallback(async () => {
    if (!usageId || !isPaused) return;

    try {
      setCurrentMessage('Resuming generation...');
      setIsPaused(false);

      // Create new stream handler for resume
      streamHandler.current = createStreamHandler();

      // Call backend resume endpoint which returns a streaming response
      const response = await fetch(`/api/ai/long-form-book/${usageId}/resume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resume_from: 'last_checkpoint'
        })
      });

      if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
        // Handle the SSE stream from resume endpoint
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        setIsGenerating(true);

        if (reader) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const eventData = JSON.parse(line.slice(6));
                    processStreamEvent(eventData);
                  } catch (e) {
                    console.warn('Failed to parse resume event:', e);
                  }
                }
              }
            }
          } finally {
            reader.releaseLock();
          }
        }

        toast({
          title: "Resumed",
          description: "Generation resumed from saved checkpoint.",
        });
      } else {
        throw new Error('Failed to resume generation');
      }
    } catch (error: any) {
      console.error('Failed to resume generation:', error);
      setIsPaused(true);
      setIsGenerating(false);
      streamHandler.current = null;
      toast({
        title: "Error",
        description: "Failed to resume generation. Please try again.",
        variant: "destructive"
      });
    }
  }, [usageId, isPaused, toast, processStreamEvent]);

  const loadFullContent = useCallback(async () => {
    if (!usageId) {
      toast({
        title: "Error",
        description: "No usage ID available",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    setCurrentMessage('Loading complete book content...');

    try {
      const storedBook = await BookApiService.getStoredBook(usageId);

      if (storedBook.full_book_content && storedBook.full_book_content.chapters) {
        // Update chapters with full content
        const fullChapters = storedBook.full_book_content.chapters.map((ch: any) => ({
          chapter_number: ch.chapter_number,
          title: ch.title,
          content: ch.full_content || ch.content,
          word_count: ch.word_count,
          images: ch.images || [],
          completed: true,
          sections: ch.sections || []
        }));

        setChapters(fullChapters);

        // Update metadata if available
        if (storedBook.book_metadata) {
          setBookMetadata(storedBook.book_metadata);
        }

        // Update TOC if available
        if (storedBook.table_of_contents) {
          setTableOfContents(storedBook.table_of_contents);
        }

        toast({
          title: "Success",
          description: "Full book content loaded successfully!",
        });

        setCurrentMessage('Complete book content loaded');
      } else {
        toast({
          title: "Warning",
          description: "Full content not available yet. Generation may still be in progress.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Load full content error:', error);
      toast({
        title: "Error",
        description: "Failed to load full content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  }, [usageId, toast]);

  const exportToPDF = useCallback(async () => {
    if (!usageId) {
      toast({
        title: "Error",
        description: "No usage ID available for PDF export",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);

    try {
      // Try to download PDF from backend first
      await BookApiService.downloadBookPDF(usageId);

      toast({
        title: "Success",
        description: "PDF downloaded successfully!",
      });
    } catch (error: any) {
      console.warn('Backend PDF download failed, generating locally:', error);

      // Fallback to local PDF generation
      if (!bookMetadata || chapters.length === 0) {
        toast({
          title: "Error",
          description: "No content available to export",
          variant: "destructive"
        });
        return;
      }

      try {
        const pdfGenerator = new PDFGenerator();
        const bookData = {
          book_metadata: bookMetadata,
          table_of_contents: tableOfContents,
          chapters: chapters,
          bibliography: ['Generated with AI Technology']
        };

        await pdfGenerator.downloadPDF(bookData, `${bookMetadata.title}.pdf`);

        toast({
          title: "Success",
          description: "PDF exported successfully!",
        });
      } catch (localError: any) {
        console.error('Local PDF export error:', localError);
        toast({
          title: "Error",
          description: "Failed to export PDF. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsExporting(false);
    }
  }, [usageId, bookMetadata, chapters, tableOfContents, toast]);

  useEffect(() => {
    if (!resumeState && !isGenerating && !streamHandler.current) {
      console.log('🎯 Initializing book generation from useEffect');
      startGeneration();
    }

    return () => {
      console.log('🧹 Cleanup: stopping generation');
      stopGeneration();

      // Cleanup recovery manager
      if (recoveryManager.current) {
        recoveryManager.current.cleanup();
        recoveryManager.current = null;
      }
    };
  }, [resumeState]); // Only depend on resumeState to prevent infinite loops

  if (showCreditError) {
    return (
      <div className="max-w-md mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Insufficient Credits</h3>
                <p className="text-sm mb-3">
                  You need {creditErrorInfo?.credits_required} credits to generate this book, 
                  but you only have {creditErrorInfo?.credits_available} credits available.
                </p>
                <div className="bg-red-100 p-3 rounded-md text-sm">
                  <p><strong>Required:</strong> {creditErrorInfo?.credits_required} credits</p>
                  <p><strong>Available:</strong> {creditErrorInfo?.credits_available} credits</p>
                  <p><strong>Need to add:</strong> {creditErrorInfo?.credits_needed} credits</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => window.open('/pricing', '_blank')}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Recharge Credits
                </Button>
                <Button variant="outline" size="sm" onClick={onCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with Controls */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            <span className="font-medium">
              {bookMetadata?.title || 'Generating Book...'}
            </span>
            {isOffline && (
              <Badge variant="destructive" className="text-xs">
                Offline
              </Badge>
            )}
            {lastSaveTime && (
              <span className="text-xs text-muted-foreground">
                Saved {lastSaveTime.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {(isGenerating || isPaused) && (
            <>
              {isPaused ? (
                <Button variant="outline" size="sm" onClick={resumeGeneration}>
                  <Play className="h-4 w-4 mr-1" />
                  Resume
                </Button>
              ) : (
                canPause && (
                  <Button variant="outline" size="sm" onClick={pauseGeneration}>
                    <Pause className="h-4 w-4 mr-1" />
                    Pause
                  </Button>
                )
              )}
              <Button variant="outline" size="sm" onClick={stopGeneration}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </>
          )}
          {(generationComplete || chapters.length > 0) && (
            <>
              {usageId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadFullContent}
                  disabled={isExporting}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Load Full Content
                </Button>
              )}
              <Button
                size="sm"
                onClick={exportToPDF}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export PDF
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Enhanced Settings & Progress */}
        <div className="w-80 border-r bg-muted/30 flex flex-col">
          {/* Progress Section */}
          <Card className="m-4 mb-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                {isPaused ? (
                  <Pause className="h-4 w-4 text-yellow-500" />
                ) : isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : generationComplete ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
                {isPaused ? 'Generation Paused' : 'Generation Progress'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={progress} className="h-2" />
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Progress:</span>
                  <span>{progress}%</span>
                </div>
                {estimatedTimeRemaining && (
                  <div className="flex justify-between">
                    <span>Time remaining:</span>
                    <span>{estimatedTimeRemaining}</span>
                  </div>
                )}
                <div className="text-muted-foreground">{currentMessage}</div>
                {isPaused && pauseReason && (
                  <div className="text-xs text-yellow-600 mt-1">
                    Reason: {pauseReason}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Book Info */}
          {bookMetadata && (
            <Card className="mx-4 mb-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Book Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div><strong>Title:</strong> {bookMetadata.title}</div>
                <div><strong>Author:</strong> {bookMetadata.author}</div>
                <div><strong>Chapters:</strong> {chapters.length}/{bookMetadata.total_chapters}</div>
                <div><strong>Words:</strong> {bookMetadata.total_words?.toLocaleString()}</div>
                <div><strong>Images:</strong> {bookMetadata.total_images}</div>
              </CardContent>
            </Card>
          )}

          {/* Settings Summary */}
          <Card className="mx-4 mb-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Generation Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div><strong>Genre:</strong> {requestData.genre?.replace('-', ' ')}</div>
              <div><strong>Length:</strong> {requestData.book_length?.replace('-', ' ')}</div>
              <div><strong>Tone:</strong> {requestData.tone}</div>
              <div><strong>Audience:</strong> {requestData.target_audience?.replace('-', ' ')}</div>
              <Separator className="my-2" />
              <div className="space-y-1">
                <div className="font-medium">Features:</div>
                {requestData.include_toc && <div>✓ Table of Contents</div>}
                {requestData.include_images && <div>✓ Images</div>}
                {requestData.include_bibliography && <div>✓ Bibliography</div>}
                {requestData.include_cover && <div>✓ Cover Design</div>}
              </div>
            </CardContent>
          </Card>

          {/* Table of Contents */}
          {tableOfContents.length > 0 && (
            <Card className="mx-4 mb-4 flex-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Table of Contents</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-40">
                  <div className="space-y-1">
                    {tableOfContents.map((item, index) => (
                      <div key={index} className="text-xs p-2 rounded hover:bg-muted">
                        <div className="font-medium truncate">{item.title}</div>
                        <div className="text-muted-foreground">Page {item.page}</div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Side - Book Content Display */}
        <div className="flex-1 bg-gray-50 overflow-hidden">
          <ScrollArea className="h-full p-6">
            <div className="max-w-4xl mx-auto">
              {/* Book Display Container */}
              <div className="bg-white shadow-xl rounded-lg overflow-hidden">
                <div className="p-8" style={{
                  fontFamily: 'Times, serif',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: '#000'
                }}>
                  {/* Title Page */}
                  {bookMetadata && (
                    <div className="text-center py-12 border-b mb-8">
                      <h1 className="text-4xl font-bold mb-6">{bookMetadata.title}</h1>
                      <p className="text-xl text-gray-600 mb-4">by {bookMetadata.author}</p>
                      <div className="text-sm text-gray-500">
                        Generated with AI • {new Date().toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  {/* Loading State */}
                  {isGenerating && chapters.length === 0 && (
                    <div className="text-center py-20">
                      <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500">Generating your book...</p>
                      <p className="text-sm text-gray-400 mt-2">{currentMessage}</p>
                      {estimatedTimeRemaining && (
                        <p className="text-sm text-gray-400 mt-1">Est. {estimatedTimeRemaining} remaining</p>
                      )}
                    </div>
                  )}

                  {/* Comprehensive Chapters Display */}
                  {chapters.map((chapter, idx) => (
                    <div key={chapter.chapter_number} className="mb-16">
                      <BookContentRenderer
                        content={chapter.content}
                        images={chapter.images}
                        title={chapter.title}
                        chapterNumber={chapter.chapter_number}
                        wordCount={chapter.word_count}
                      />

                      {/* Chapter Status Indicator */}
                      <div className="flex items-center justify-between mt-6 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {chapter.completed ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                          )}
                          <span className="text-sm font-medium">
                            {chapter.completed ? 'Chapter Complete' : 'Generating...'}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            {chapter.word_count.toLocaleString()} words
                          </div>
                          <div className="flex items-center gap-1">
                            <ImageIcon className="h-4 w-4" />
                            {chapter.images.length} images
                          </div>
                          {chapter.sections && (
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              {chapter.sections.length} sections
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Chapter Separator */}
                      {idx < chapters.length - 1 && (
                        <div className="mt-12">
                          <Separator />
                          <div className="text-center mt-6 mb-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
                              <Book className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">
                                Chapter {chapter.chapter_number} of {bookMetadata?.total_chapters || chapters.length}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Generation Status */}
                  {isGenerating && chapters.length > 0 && (
                    <div className="text-center py-8 text-gray-500 border-t">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p>{currentMessage}</p>
                      <Progress value={progress} className="w-64 mx-auto mt-4" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default EnhancedStreamingBookGenerator;
