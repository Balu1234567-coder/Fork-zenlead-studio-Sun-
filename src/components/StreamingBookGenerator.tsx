import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Book, 
  Download, 
  Eye, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle, 
  Clock,
  Loader2,
  CreditCard,
  AlertTriangle,
  X
} from "lucide-react";
import { apiService } from "@/lib/apiService";
import { useToast } from "@/hooks/use-toast";

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

interface StreamingBookGeneratorProps {
  requestData: any;
  onComplete?: (usageId: string, bookData: any) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

const StreamingBookGenerator: React.FC<StreamingBookGeneratorProps> = ({
  requestData,
  onComplete,
  onError,
  onCancel
}) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [bookMetadata, setBookMetadata] = useState<BookMetadata | null>(null);
  const [tableOfContents, setTableOfContents] = useState<any[]>([]);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [usageId, setUsageId] = useState<string>('');
  const [pdfBase64, setPdfBase64] = useState<string>('');
  const [showCreditError, setShowCreditError] = useState(false);
  const [creditErrorInfo, setCreditErrorInfo] = useState<any>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const parseStreamChunk = useCallback((chunk: string): StreamEvent | null => {
    try {
      const trimmed = chunk.trim();
      if (!trimmed) return null;
      return JSON.parse(trimmed);
    } catch (error) {
      console.warn('Failed to parse chunk:', chunk);
      return null;
    }
  }, []);

  const processStreamEvent = useCallback((event: StreamEvent) => {
    console.log('📡 Stream event:', event);

    switch (event.type) {
      case 'start':
        setCurrentMessage(event.message || 'Starting generation...');
        setProgress(0);
        if (event.data?.book_title) {
          setBookMetadata(prev => prev ? { ...prev, title: event.data.book_title } : null);
        }
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
          
          if (event.book_data.pdf_base64) {
            setPdfBase64(event.book_data.pdf_base64);
          }

          if (event.book_data.table_of_contents) {
            setTableOfContents(event.book_data.table_of_contents);
          }
        }
        break;

      case 'stored':
        if (event.usage_id) {
          setUsageId(event.usage_id);
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
  }, [toast, onComplete, onError]);

  const startGeneration = useCallback(async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setProgress(0);
    setCurrentMessage('Initializing...');
    setChapters([]);
    setBookMetadata(null);
    setTableOfContents([]);
    setGenerationComplete(false);
    setPdfBase64('');
    setShowCreditError(false);

    try {
      abortControllerRef.current = new AbortController();
      
      console.log('🚀 Starting streaming book generation...');
      const stream = await apiService.generateLongFormBookStream(requestData);
      
      readerRef.current = stream.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await readerRef.current.read();
        
        if (done) {
          console.log('✅ Stream completed');
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const event = parseStreamChunk(line);
          if (event) {
            processStreamEvent(event);
          }
        }
      }

      if (buffer.trim()) {
        const event = parseStreamChunk(buffer);
        if (event) {
          processStreamEvent(event);
        }
      }

    } catch (error: any) {
      console.error('❌ Streaming error:', error);
      setCurrentMessage(`Error: ${error.message}`);
      toast({
        title: "Error",
        description: error.message || 'Failed to generate book',
        variant: "destructive"
      });
      
      if (onError) {
        onError(error.message);
      }
    } finally {
      setIsGenerating(false);
      readerRef.current = null;
    }
  }, [isGenerating, requestData, parseStreamChunk, processStreamEvent, toast, onError]);

  const stopGeneration = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.cancel();
      readerRef.current = null;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setIsGenerating(false);
    setCurrentMessage('Generation stopped');
  }, []);

  const downloadPDF = useCallback(() => {
    if (!pdfBase64) {
      toast({
        title: "Error",
        description: "PDF not available yet",
        variant: "destructive"
      });
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${pdfBase64}`;
      link.download = `${bookMetadata?.title || 'book'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Success",
        description: "PDF downloaded successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download PDF",
        variant: "destructive"
      });
    }
  }, [pdfBase64, bookMetadata, toast]);

  useEffect(() => {
    startGeneration();
    
    return () => {
      stopGeneration();
    };
  }, [startGeneration]);

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
    <div className="h-full flex gap-6">
      {/* Left Side - Progress & Status */}
      <div className="w-80 flex-shrink-0 space-y-4">
        {/* Progress Card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Generation Progress</CardTitle>
              {isGenerating && (
                <Button variant="outline" size="sm" onClick={stopGeneration}>
                  Stop
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : generationComplete ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              <span className="text-sm">{currentMessage}</span>
            </div>
            <Progress value={progress} className="w-full" />
            <div className="text-sm text-muted-foreground">
              {progress}% Complete
            </div>
            {bookMetadata && (
              <div className="space-y-1 text-sm">
                <div>Chapters: {chapters.length}/{bookMetadata.total_chapters}</div>
                <div>Words: {bookMetadata.total_words}</div>
                <div>Images: {bookMetadata.total_images}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Table of Contents */}
        {tableOfContents.length > 0 && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm">Table of Contents</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-60">
                <div className="space-y-1">
                  {tableOfContents.map((item, index) => (
                    <div key={index} className="text-sm p-2 rounded hover:bg-muted">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-muted-foreground">Page {item.page}</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {generationComplete && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Button className="w-full" onClick={downloadPDF} disabled={!pdfBase64}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <div className="text-xs text-muted-foreground text-center">
                  {usageId && `ID: ${usageId.slice(-8)}`}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Side - A4 PDF Viewer */}
      <div className="flex-1 bg-gray-100 p-8 rounded-lg overflow-hidden">
        <ScrollArea className="h-full">
          {/* A4 Page Container */}
          <div className="max-w-[210mm] mx-auto bg-white shadow-xl" style={{
            minHeight: '297mm', // A4 height
            padding: '20mm', // Standard page margins
            fontFamily: 'Times, serif',
            fontSize: '12pt',
            lineHeight: '1.6',
            color: '#000'
          }}>
            {/* Document Header */}
            {bookMetadata && (
              <div className="text-center pb-8 border-b-2 border-gray-300 mb-8">
                <h1 className="text-3xl font-bold mb-4">{bookMetadata.title}</h1>
                <p className="text-xl text-gray-600">by {bookMetadata.author}</p>
                <div className="mt-6 text-sm text-gray-500">
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
              </div>
            )}

            {/* Table of Contents */}
            {tableOfContents.length > 0 && !isGenerating && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6 text-center">Table of Contents</h2>
                <div className="space-y-2">
                  {tableOfContents.map((item, index) => (
                    <div key={index} className="flex justify-between border-b border-dotted pb-1">
                      <span>{item.title}</span>
                      <span>{item.page}</span>
                    </div>
                  ))}
                </div>
                <div className="page-break-after mt-12 border-b-4 border-gray-200"></div>
              </div>
            )}

            {/* Chapters */}
            {chapters.map((chapter, idx) => (
              <div key={chapter.chapter_number} className={`mb-8 ${idx > 0 ? 'mt-12' : ''}`}>
                {/* Chapter Header */}
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-2xl font-bold">{chapter.title}</h2>
                  {chapter.completed ? (
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                  ) : (
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400 flex-shrink-0" />
                  )}
                </div>
                
                {/* Chapter Content */}
                {chapter.content && (
                  <div className="space-y-4">
                    {chapter.content.split('\n').map((paragraph, pIdx) => {
                      if (paragraph.trim().startsWith('##')) {
                        return (
                          <h3 key={pIdx} className="text-lg font-semibold mt-8 mb-4 text-gray-800">
                            {paragraph.replace('##', '').trim()}
                          </h3>
                        );
                      } else if (paragraph.trim()) {
                        return (
                          <p key={pIdx} className="mb-4 text-justify">
                            {paragraph.trim()}
                          </p>
                        );
                      }
                      return <div key={pIdx} className="h-4"></div>;
                    })}
                  </div>
                )}

                {/* Chapter Images */}
                {chapter.images.length > 0 && (
                  <div className="space-y-6 mt-8">
                    {chapter.images.map((image, imgIdx) => (
                      <div key={imgIdx} className="text-center">
                        <img 
                          src={image.data} 
                          alt={image.caption}
                          className="max-w-full h-auto mx-auto border border-gray-200 rounded"
                          style={{ maxHeight: '400px' }}
                        />
                        <p className="text-sm text-gray-600 mt-2 italic">
                          Figure {imgIdx + 1}: {image.caption}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Chapter Footer */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500">
                  <span>{chapter.word_count} words</span>
                  {chapter.images.length > 0 && (
                    <span className="flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" />
                      {chapter.images.length} images
                    </span>
                  )}
                </div>

                {/* Page Break After Each Chapter */}
                {idx < chapters.length - 1 && (
                  <div className="page-break-after mt-12 border-b-4 border-gray-200"></div>
                )}
              </div>
            ))}

            {/* Generation Status at Bottom */}
            {isGenerating && chapters.length > 0 && (
              <div className="text-center py-8 text-gray-500 border-t border-gray-200">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p>{currentMessage}</p>
                <Progress value={progress} className="w-64 mx-auto mt-4" />
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default StreamingBookGenerator;
