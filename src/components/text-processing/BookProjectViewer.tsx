import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Book, 
  Play, 
  Pause, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Download, 
  ArrowLeft,
  RefreshCw,
  Share2,
  Loader2,
  Eye,
  BookOpen,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EnhancedStreamingBookGenerator from "@/components/EnhancedStreamingBookGenerator";
import { BookContentRenderer } from "@/components/BookContentRenderer";
import { apiService } from "@/lib/apiService";

interface ProjectState {
  usage_id: string;
  project_type: string;
  project_name: string;
  status: string;
  created_at: string;
  completed_at?: string;
  credits_used: number;
  has_results: boolean;
  title: string;
  genre: string;
  book_data?: any;
  navigation: {
    can_duplicate: boolean;
    can_cancel: boolean;
    can_download_pdf: boolean;
    can_view_chapters: boolean;
  };
  status_data: any;
}

interface BookData {
  usage_id: string;
  book_metadata: any;
  table_of_contents: any[];
  full_book_content: any;
  pdf_base64: string;
  chapters_summary: any[];
  generation_info: any;
  storage_info: any;
}

const BookProjectViewer: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [projectState, setProjectState] = useState<ProjectState | null>(null);
  const [bookData, setBookData] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'viewer' | 'generator'>('viewer');
  const [chapters, setChapters] = useState<any[]>([]);

  const action = searchParams.get('action');
  const viewParam = searchParams.get('view');

  useEffect(() => {
    if (projectId) {
      loadProjectState();
    }
  }, [projectId]);

  useEffect(() => {
    // Handle action and view parameters
    if (action === 'resume' && projectState?.navigation.can_cancel) {
      setView('generator');
    } else if (viewParam === 'live' && projectState?.status === 'processing') {
      setView('generator');
    } else if (action === 'edit') {
      setView('generator');
    }
  }, [action, viewParam, projectState]);

  const loadProjectState = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);

      // Get project view data from new backend endpoint
      const response = await fetch(`/api/ai/long-form-book/project/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load project: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to load project');
      }

      const projectData = result.data;
      setProjectState(projectData);

      // If completed, load the full book data
      if (projectData.status === 'completed') {
        try {
          const bookResponse = await fetch(`/api/ai/long-form-book/${projectId}/stored`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
              'Content-Type': 'application/json'
            }
          });

          if (bookResponse.ok) {
            const bookResult = await bookResponse.json();
            if (bookResult.success) {
              setBookData(bookResult.data);

              // Extract chapters for display
              if (bookResult.data.full_book_content?.chapters) {
                setChapters(bookResult.data.full_book_content.chapters);
              }
            }
          }
        } catch (bookError) {
          console.warn('Could not load full book data:', bookError);
        }
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load project state');
      toast({
        title: "Error",
        description: "Failed to load project state",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (actionType: string) => {
    if (!projectState) return;

    try {
      switch (actionType) {
        case 'pause':
          const pauseResponse = await fetch(`/api/ai/long-form-book/${projectState.usage_id}/pause`, {
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

          if (pauseResponse.ok) {
            toast({
              title: "Paused",
              description: "Generation paused successfully. Progress saved.",
            });
            loadProjectState();
          }
          break;

        case 'resume':
          setView('generator');
          break;
          
        case 'download':
          try {
            const response = await fetch(`/api/ai/long-form-book/${projectState.usage_id}/pdf`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                'Content-Type': 'application/json'
              }
            });

            if (response.ok) {
              const result = await response.json();
              if (result.success && result.data.pdf_base64) {
                const link = document.createElement('a');
                link.href = `data:application/pdf;base64,${result.data.pdf_base64}`;
                link.download = result.data.filename || 'book.pdf';
                link.click();

                toast({
                  title: "Downloaded",
                  description: "PDF downloaded successfully!",
                });
              }
            }
          } catch (downloadError) {
            console.error('Download failed:', downloadError);
            toast({
              title: "Error",
              description: "Failed to download PDF",
              variant: "destructive"
            });
          }
          break;
          
        case 'cancel':
          const cancelResponse = await fetch(`/api/ai/long-form-book/${projectState.usage_id}/cancel`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
              'Content-Type': 'application/json'
            }
          });

          if (cancelResponse.ok) {
            const cancelResult = await cancelResponse.json();
            if (cancelResult.success) {
              toast({
                title: "Cancelled",
                description: `Generation cancelled. ${cancelResult.data.credits_refunded} credits refunded.`,
              });
              loadProjectState();
            }
          }
          break;
          
        case 'share':
          navigator.clipboard.writeText(window.location.href);
          toast({
            title: "Link Copied",
            description: "Project link copied to clipboard",
          });
          break;
          
        default:
          break;
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${actionType}`,
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Pause className="h-5 w-5 text-yellow-500" />;
      default:
        return <Book className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !projectState) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error || 'Project not found. Please check the URL or try again.'}
        </AlertDescription>
      </Alert>
    );
  }

  // Show generator view for active generation or resume
  if (view === 'generator' || (projectState.status === 'processing' && !bookData)) {
    return (
      <div className="h-full">
        <EnhancedStreamingBookGenerator
          requestData={projectState.book_data?.settings || {}}
          onComplete={(usageId, data) => {
            setView('viewer');
            loadProjectState();
            toast({
              title: "Success",
              description: "Book generation completed!",
            });
          }}
          onError={(error) => {
            toast({
              title: "Error",
              description: error,
              variant: "destructive"
            });
          }}
          onCancel={() => setView('viewer')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/text')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Text Studio
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {getStatusIcon(projectState.status)}
              {projectState.title || 'Book Project'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Created {new Date(projectState.created_at).toLocaleDateString()} • 
              {projectState.credits_used} credits used
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={projectState.status === 'completed' ? 'default' : 'secondary'}>
            {projectState.status}
          </Badge>
          
          {projectState.status === 'processing' && (
            <Button size="sm" onClick={() => setView('generator')}>
              <Eye className="h-4 w-4 mr-2" />
              Watch Live
            </Button>
          )}
          
          {projectState.navigation.can_cancel && (
            <Button size="sm" variant="outline" onClick={() => handleAction('cancel')}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
          
          {projectState.navigation.can_download_pdf && (
            <Button size="sm" variant="outline" onClick={() => handleAction('download')}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          )}
          
          <Button size="sm" variant="outline" onClick={() => handleAction('share')}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          
          <Button size="sm" variant="outline" onClick={loadProjectState}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Project Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <strong>Genre:</strong> {projectState.genre || 'N/A'}
            </div>
            <div>
              <strong>Status:</strong> {projectState.status}
            </div>
            <div>
              <strong>Credits Used:</strong> {projectState.credits_used}
            </div>
            <div>
              <strong>Has Results:</strong> {projectState.has_results ? 'Yes' : 'No'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Card for Active Generation */}
      {projectState.status === 'processing' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Generation in Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setView('generator')}>
                  <Eye className="h-4 w-4 mr-2" />
                  Watch Live Generation
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleAction('pause')}>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause Generation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Book Content */}
      {bookData && chapters.length > 0 && (
        <div className="space-y-8">
          {/* Book Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Book Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <strong>Author:</strong> {bookData.book_metadata?.author || 'AI Generated'}
                </div>
                <div>
                  <strong>Genre:</strong> {bookData.book_metadata?.genre || 'N/A'}
                </div>
                <div>
                  <strong>Total Words:</strong> {bookData.book_metadata?.total_words?.toLocaleString() || '0'}
                </div>
                <div>
                  <strong>Total Images:</strong> {bookData.book_metadata?.total_images || '0'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table of Contents */}
          {bookData.table_of_contents && bookData.table_of_contents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Table of Contents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {bookData.table_of_contents.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <span className="font-medium">Chapter {item.chapter_number}: {item.title}</span>
                      <span className="text-sm text-muted-foreground">Page {item.page}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chapters */}
          <div className="space-y-12">
            {chapters.map((chapter, index) => (
              <div key={chapter.chapter_number || index}>
                <BookContentRenderer
                  content={chapter.full_content || chapter.content}
                  images={chapter.images || []}
                  title={chapter.title}
                  chapterNumber={chapter.chapter_number}
                  wordCount={chapter.word_count || 0}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {projectState.status === 'completed' && (!bookData || chapters.length === 0) && (
        <div className="text-center py-20">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
          <h2 className="text-xl font-semibold mb-4">Book Content Not Available</h2>
          <p className="text-muted-foreground mb-8">
            The book generation is marked as complete, but the content couldn't be loaded.
          </p>
          <Button onClick={loadProjectState}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Loading
          </Button>
        </div>
      )}

      {/* Pending/Failed States */}
      {(projectState.status === 'pending' || projectState.status === 'failed') && (
        <div className="text-center py-20">
          {projectState.status === 'pending' ? (
            <>
              <Pause className="h-16 w-16 text-yellow-500 mx-auto mb-6" />
              <h2 className="text-xl font-semibold mb-4">Generation Paused</h2>
              <p className="text-muted-foreground mb-8">
                This book generation was paused. You can resume it anytime.
              </p>
              <Button onClick={() => handleAction('resume')}>
                <Play className="h-4 w-4 mr-2" />
                Resume Generation
              </Button>
            </>
          ) : (
            <>
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-6" />
              <h2 className="text-xl font-semibold mb-4">Generation Failed</h2>
              <p className="text-muted-foreground mb-8">
                Something went wrong during generation. You can try creating a new book.
              </p>
              <Button onClick={() => navigate('/text/long-form-book')}>
                Create New Book
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default BookProjectViewer;