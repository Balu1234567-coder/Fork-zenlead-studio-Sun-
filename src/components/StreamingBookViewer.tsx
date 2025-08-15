import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  Book, 
  Image, 
  Download,
  Pause,
  Play,
  X,
  ArrowLeft,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface StreamingEvent {
  type: string;
  data: any;
  timestamp?: string;
}

interface Chapter {
  chapter_number: number;
  title: string;
  full_content: string;
  word_count: number;
  images: Array<{
    caption: string;
    data: string;
    source: string;
  }>;
}

interface BookMetadata {
  title: string;
  author: string;
  genre: string;
  total_chapters: number;
  total_words: number;
  total_images: number;
  generation_time: number;
}

interface StreamingBookViewerProps {
  requestData: any;
  usageId?: string;
  onComplete?: (usageId: string, bookData: any) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

const StreamingBookViewer: React.FC<StreamingBookViewerProps> = ({
  requestData,
  usageId: initialUsageId,
  onComplete,
  onError,
  onCancel
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const eventSourceRef = useRef<EventSource | null>(null);
  
  const [status, setStatus] = useState<'connecting' | 'generating' | 'completed' | 'error' | 'paused'>('connecting');
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('Initializing...');
  const [usageId, setUsageId] = useState<string | null>(initialUsageId || null);
  const [bookMetadata, setBookMetadata] = useState<BookMetadata | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [events, setEvents] = useState<StreamingEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [creditsUsed, setCreditsUsed] = useState<number>(0);
  const [canPause, setCanPause] = useState(false);

  useEffect(() => {
    if (requestData) {
      startGeneration();
    }
    
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [requestData]);

  const startGeneration = async () => {
    try {
      setStatus('connecting');
      setCurrentMessage('Starting book generation...');

      // Start streaming via your backend's Server-Sent Events endpoint
      const eventSource = new EventSource('/api/ai/long-form-book/generate-stream', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      eventSourceRef.current = eventSource;

      // Handle different event types from your backend
      eventSource.addEventListener('credits_deducted', handleCreditsDeducted);
      eventSource.addEventListener('start', handleStart);
      eventSource.addEventListener('progress', handleProgress);
      eventSource.addEventListener('structure', handleStructure);
      eventSource.addEventListener('chapter_complete', handleChapterComplete);
      eventSource.addEventListener('image_added', handleImageAdded);
      eventSource.addEventListener('complete', handleComplete);
      eventSource.addEventListener('stored', handleStored);
      eventSource.addEventListener('error', handleError);

      eventSource.onerror = (event) => {
        console.error('EventSource error:', event);
        handleConnectionError();
      };

      // Send the request data to start generation
      fetch('/api/ai/long-form-book/generate-stream', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      }).catch(error => {
        console.error('Failed to start generation:', error);
        handleError({ data: JSON.stringify({ message: 'Failed to start generation' }) });
      });

    } catch (error: any) {
      console.error('Generation setup error:', error);
      setError(error.message || 'Failed to start generation');
      setStatus('error');
    }
  };

  const handleCreditsDeducted = (event: MessageEvent) => {
    const data = JSON.parse(event.data);
    setUsageId(data.usage_id);
    setCreditsUsed(data.credits_used);
    setCurrentMessage('Credits deducted. Starting generation...');
    addEvent('credits_deducted', data);
  };

  const handleStart = (event: MessageEvent) => {
    const data = JSON.parse(event.data);
    setStatus('generating');
    setCurrentMessage(data.message || 'Generation started');
    setCanPause(true);
    addEvent('start', data);
  };

  const handleProgress = (event: MessageEvent) => {
    const data = JSON.parse(event.data);
    setProgress(data.progress || 0);
    setCurrentMessage(data.message || 'Generating...');
    addEvent('progress', data);
  };

  const handleStructure = (event: MessageEvent) => {
    const data = JSON.parse(event.data);
    setBookMetadata({
      title: data.data.title,
      author: requestData.author_name || 'AI Generated',
      genre: requestData.genre || 'Unknown',
      total_chapters: data.data.total_chapters,
      total_words: 0,
      total_images: 0,
      generation_time: 0
    });
    setCurrentMessage(`Book structure created: "${data.data.title}"`);
    addEvent('structure', data);
  };

  const handleChapterComplete = (event: MessageEvent) => {
    const data = JSON.parse(event.data);
    const newChapter: Chapter = {
      chapter_number: data.chapter_number,
      title: data.title,
      full_content: data.full_content,
      word_count: data.word_count,
      images: data.images || []
    };
    
    setChapters(prev => [...prev, newChapter]);
    setCurrentMessage(`Chapter ${data.chapter_number} completed: ${data.title}`);
    addEvent('chapter_complete', data);
  };

  const handleImageAdded = (event: MessageEvent) => {
    const data = JSON.parse(event.data);
    setCurrentMessage(`Image added to Chapter ${data.chapter_number}: ${data.image.caption}`);
    addEvent('image_added', data);
  };

  const handleComplete = (event: MessageEvent) => {
    const data = JSON.parse(event.data);
    setStatus('completed');
    setProgress(100);
    setCanPause(false);
    setCurrentMessage('Book generation completed!');
    
    // Update metadata with final stats
    if (data.book_data?.metadata) {
      setBookMetadata(data.book_data.metadata);
    }
    
    if (data.book_data?.pdf_base64) {
      setPdfBase64(data.book_data.pdf_base64);
    }
    
    addEvent('complete', data);
    
    toast({
      title: "Success!",
      description: "Your book has been generated successfully",
    });

    if (onComplete && usageId) {
      onComplete(usageId, data.book_data);
    }
  };

  const handleStored = (event: MessageEvent) => {
    const data = JSON.parse(event.data);
    setCurrentMessage('Book stored successfully in database');
    addEvent('stored', data);
  };

  const handleError = (event: MessageEvent) => {
    const data = JSON.parse(event.data);
    const errorMessage = data.message || 'An error occurred during generation';
    setError(errorMessage);
    setStatus('error');
    setCanPause(false);
    addEvent('error', data);
    
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive"
    });

    if (onError) {
      onError(errorMessage);
    }
  };

  const handleConnectionError = () => {
    setError('Connection lost. The generation may still be running in the background.');
    setStatus('error');
    setCanPause(false);
  };

  const addEvent = (type: string, data: any) => {
    setEvents(prev => [...prev, {
      type,
      data,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const handlePause = async () => {
    if (!usageId) return;
    
    try {
      const response = await fetch(`/api/ai/long-form-book/${usageId}/pause`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setStatus('paused');
        setCanPause(false);
        setCurrentMessage('Generation paused');
        
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
        
        toast({
          title: "Paused",
          description: "Generation has been paused. You can resume it later.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to pause generation",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    if (onCancel) {
      onCancel();
    } else {
      navigate('/book-projects');
    }
  };

  const handleDownload = () => {
    if (pdfBase64) {
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${pdfBase64}`;
      link.download = `${bookMetadata?.title || 'book'}.pdf`;
      link.click();
      
      toast({
        title: "Downloaded",
        description: "PDF downloaded successfully!",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {bookMetadata?.title || 'Generating Book...'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Live Generation • {creditsUsed} credits used
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {canPause && (
              <Button variant="outline" onClick={handlePause}>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}
            
            {status === 'completed' && pdfBase64 && (
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            )}
            
            <Badge variant={
              status === 'completed' ? 'default' :
              status === 'error' ? 'destructive' :
              status === 'paused' ? 'secondary' : 'outline'
            }>
              {status}
            </Badge>
          </div>
        </div>

        {/* Progress Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {status === 'generating' && <Loader2 className="h-5 w-5 animate-spin" />}
              {status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
              {status === 'error' && <AlertTriangle className="h-5 w-5 text-red-500" />}
              Generation Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              
              <p className="text-sm text-muted-foreground">{currentMessage}</p>
              
              {bookMetadata && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <strong>Chapters:</strong> {chapters.length}/{bookMetadata.total_chapters}
                  </div>
                  <div>
                    <strong>Words:</strong> {chapters.reduce((sum, ch) => sum + ch.word_count, 0).toLocaleString()}
                  </div>
                  <div>
                    <strong>Images:</strong> {chapters.reduce((sum, ch) => sum + ch.images.length, 0)}
                  </div>
                  <div>
                    <strong>Genre:</strong> {bookMetadata.genre}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chapters Preview */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Chapters Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  {chapters.length > 0 ? (
                    <div className="space-y-6">
                      {chapters.map((chapter) => (
                        <div key={chapter.chapter_number} className="border-b pb-4 last:border-b-0">
                          <h3 className="font-semibold mb-2">{chapter.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {chapter.word_count} words • {chapter.images.length} images
                          </p>
                          <p className="text-sm line-clamp-3">
                            {chapter.full_content.substring(0, 200)}...
                          </p>
                          
                          {chapter.images.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {chapter.images.slice(0, 3).map((img, idx) => (
                                <div key={idx} className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Image className="h-3 w-3" />
                                  {img.caption.substring(0, 20)}...
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Book className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Chapters will appear here as they are generated...</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Events Log */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Generation Log</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {events.map((event, index) => (
                      <div key={index} className="text-xs p-2 bg-muted rounded">
                        <div className="flex justify-between items-center mb-1">
                          <Badge variant="outline" className="text-xs">
                            {event.type}
                          </Badge>
                          <span className="text-muted-foreground">{event.timestamp}</span>
                        </div>
                        <p className="text-muted-foreground">
                          {event.data.message || `${event.type} event`}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
              {usageId && (
                <div className="mt-2">
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default StreamingBookViewer;
