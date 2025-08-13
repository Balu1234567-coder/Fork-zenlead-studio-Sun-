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
  Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SSEStreamHandler, createStreamHandler } from "@/lib/streamHandler";
import { PDFGenerator } from "@/lib/pdfGenerator";
import { BookGenerationStateManager, BookGenerationUtils } from "@/lib/bookGenerationState";

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
      startTime.current = resumeState.startTime || Date.now();
    }
  }, [resumeState]);

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

  const processStreamEvent = useCallback((event: StreamEvent) => {
    console.log('📡 Stream event:', event);

    switch (event.type) {
      case 'start':
        setCurrentMessage(event.message || 'Starting generation...');
        setProgress(0);
        break;

      case 'credits_deducted':
        setCurrentMessage(event.message || 'Credits deducted successfully...');
        setUsageId(event.usage_id || '');
        setProgress(5);
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
              content: event.content_preview || '',
              word_count: event.word_count || 0,
              images: [],
              completed: true
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

      case 'complete':
        setCurrentMessage('Book generation completed!');
        setProgress(100);
        setGenerationComplete(true);
        
        if (event.book_data) {
          if (event.book_data.metadata) {
            setBookMetadata(event.book_data.metadata);
          }
          
          if (event.book_data.table_of_contents) {
            setTableOfContents(event.book_data.table_of_contents);
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
    if (isGenerating) return;

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
          
          if (onError) {
            onError(error.message);
          }
        },
        onComplete: () => {
          console.log('✅ Stream completed');
          setIsGenerating(false);
        }
      });

    } catch (error: any) {
      console.error('❌ Streaming error:', error);
      setCurrentMessage(`Error: ${error.message}`);
      setIsGenerating(false);
      
      if (onError) {
        onError(error.message);
      }
    }
  }, [isGenerating, requestData, processStreamEvent, onError]);

  const stopGeneration = useCallback(() => {
    if (streamHandler.current) {
      streamHandler.current.stop();
      streamHandler.current = null;
    }
    
    setIsGenerating(false);
    setCurrentMessage('Generation stopped');
    BookGenerationUtils.cancelGeneration();
  }, []);

  const pauseGeneration = useCallback(() => {
    setIsPaused(true);
    setCurrentMessage('Generation paused...');
    // Note: Actual pausing would need backend support
  }, []);

  const resumeGeneration = useCallback(() => {
    setIsPaused(false);
    setCurrentMessage('Resuming generation...');
    // Note: Actual resuming would need backend support
  }, []);

  const exportToPDF = useCallback(async () => {
    if (!bookMetadata || chapters.length === 0) {
      toast({
        title: "Error",
        description: "No content available to export",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);

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
    } catch (error: any) {
      console.error('PDF export error:', error);
      toast({
        title: "Error",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  }, [bookMetadata, chapters, tableOfContents, toast]);

  useEffect(() => {
    if (!resumeState) {
      startGeneration();
    }
    
    return () => {
      stopGeneration();
    };
  }, [startGeneration, resumeState]);

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
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isGenerating && (
            <>
              <Button variant="outline" size="sm" onClick={isPaused ? resumeGeneration : pauseGeneration}>
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={stopGeneration}>
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
          {(generationComplete || chapters.length > 0) && (
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
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : generationComplete ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
                Generation Progress
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

                  {/* Chapters */}
                  {chapters.map((chapter, idx) => (
                    <div key={chapter.chapter_number} className="mb-12">
                      {/* Chapter Header */}
                      <div className="flex items-center gap-3 mb-6">
                        <div>
                          <h2 className="text-2xl font-bold">{chapter.title}</h2>
                          <div className="text-sm text-gray-500 mt-1">
                            {chapter.word_count} words • {chapter.images.length} images
                          </div>
                        </div>
                        {chapter.completed ? (
                          <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                        ) : (
                          <Loader2 className="h-6 w-6 animate-spin text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                      
                      {/* Chapter Content */}
                      {chapter.content && (
                        <div className="space-y-4 mb-6">
                          {chapter.content.split('\n').map((paragraph, pIdx) => {
                            if (paragraph.trim().startsWith('##')) {
                              return (
                                <h3 key={pIdx} className="text-lg font-semibold mt-6 mb-3 text-gray-800">
                                  {paragraph.replace('##', '').trim()}
                                </h3>
                              );
                            } else if (paragraph.trim()) {
                              return (
                                <p key={pIdx} className="mb-4 text-justify leading-relaxed">
                                  {paragraph.trim()}
                                </p>
                              );
                            }
                            return <div key={pIdx} className="h-2"></div>;
                          })}
                        </div>
                      )}

                      {/* Chapter Images */}
                      {chapter.images.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          {chapter.images.map((image, imgIdx) => (
                            <div key={imgIdx} className="text-center">
                              <img 
                                src={image.data} 
                                alt={image.caption}
                                className="w-full h-auto mx-auto border rounded-lg shadow-sm"
                                style={{ maxHeight: '300px', objectFit: 'cover' }}
                              />
                              <p className="text-sm text-gray-600 mt-2 italic">
                                Figure {imgIdx + 1}: {image.caption}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Chapter Separator */}
                      {idx < chapters.length - 1 && (
                        <Separator className="mt-8" />
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
