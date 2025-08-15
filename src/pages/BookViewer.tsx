import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
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
  Loader2,
  Eye,
  BookOpen
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BookContentRenderer } from "@/components/BookContentRenderer";
import StreamingBookViewer from "@/components/StreamingBookViewer";

interface ProjectState {
  usage_id: string;
  project_uuid: string;
  url_slug: string;
  project_title: string;
  status: string;
  progress: number;
  created_at: string;
  last_accessed: string;
  can_resume: boolean;
  has_output: boolean;
  metadata?: any;
}

interface BookData {
  usage_id: string;
  book_metadata: any;
  table_of_contents: any[];
  full_book_content: any;
  pdf_base64: string;
  chapters_summary: any[];
  generation_info: any;
}

const BookViewer: React.FC = () => {
  const { uniqueId } = useParams<{ uniqueId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [state, setState] = useState<ProjectState | null>(null);
  const [bookData, setBookData] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chapters, setChapters] = useState<any[]>([]);

  // Check if we should show live generation view
  const viewMode = searchParams.get('view');
  const action = searchParams.get('action');
  const requestData = location.state?.requestData;

  // Show streaming viewer for live view with request data
  const shouldShowStreamingViewer = (viewMode === 'live' && requestData) || 
                                   (state?.status === 'processing' && viewMode === 'live') ||
                                   action === 'resume';

  useEffect(() => {
    if (uniqueId) {
      loadProjectState();
    }
  }, [uniqueId]);

  const loadProjectState = async () => {
    if (!uniqueId) {
      setError('No project identifier provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Try to get project by URL slug first
      let projectResponse = await fetch(`/api/ai/long-form-book/project/${uniqueId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      let projectData: ProjectState | null = null;

      if (projectResponse.ok) {
        const result = await projectResponse.json();
        if (result.success) {
          projectData = {
            usage_id: result.data.usage_id,
            project_uuid: result.data.project_uuid || '',
            url_slug: result.data.url_slug || uniqueId,
            project_title: result.data.project_title || 'Untitled Book',
            status: result.data.status,
            progress: result.data.progress || 0,
            created_at: result.data.created_at,
            last_accessed: result.data.last_accessed,
            can_resume: result.data.can_resume || false,
            has_output: result.data.has_output || false,
            metadata: result.data.metadata
          };
        }
      }

      // If slug resolution fails, try as usage ID directly
      if (!projectData) {
        const statusResponse = await fetch(`/api/ai/long-form-book/${uniqueId}/status`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (statusResponse.ok) {
          const statusResult = await statusResponse.json();
          if (statusResult.success) {
            projectData = {
              usage_id: uniqueId,
              project_uuid: '',
              url_slug: uniqueId,
              project_title: 'Book Project',
              status: statusResult.data.status,
              progress: statusResult.data.progress_info?.progress || 0,
              created_at: statusResult.data.created_at,
              last_accessed: statusResult.data.created_at,
              can_resume: statusResult.data.progress_info?.is_pending || false,
              has_output: statusResult.data.has_output || false
            };
          }
        }
      }

      if (!projectData) {
        throw new Error('Project not found');
      }

      setState(projectData);

      // If completed, try to load the full book data
      if (projectData.status === 'completed') {
        try {
          const bookResponse = await fetch(`/api/ai/long-form-book/${projectData.usage_id}/stored`, {
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
      console.error('BookViewer error:', err);
      setError(err.message || 'Failed to load project');
      toast({
        title: "Error",
        description: err.message || 'Failed to load project',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (actionType: string) => {
    if (!state) return;

    try {
      switch (actionType) {
        case 'pause':
          const pauseResponse = await fetch(`/api/ai/long-form-book/${state.usage_id}/pause`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
              'Content-Type': 'application/json'
            }
          });

          if (pauseResponse.ok) {
            toast({
              title: "Paused",
              description: "Generation paused successfully",
            });
            loadProjectState();
          }
          break;

        case 'resume':
          // Navigate to live view for resuming
          navigate(`/text/long-form-book/${state.url_slug}?view=live`);
          break;
          
        case 'download':
          try {
            const response = await fetch(`/api/ai/long-form-book/${state.usage_id}/pdf`, {
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
                link.download = result.data.filename || `${state.project_title}.pdf`;
                link.click();

                toast({
                  title: "Downloaded",
                  description: "PDF downloaded successfully!",
                });
              }
            }
          } catch (downloadError) {
            toast({
              title: "Error",
              description: "Failed to download PDF",
              variant: "destructive"
            });
          }
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

  // Show streaming viewer for live generation
  if (shouldShowStreamingViewer) {
    return (
      <StreamingBookViewer
        requestData={requestData}
        usageId={state?.usage_id}
        onComplete={(usageId, data) => {
          navigate(`/text/long-form-book/${state?.url_slug || uniqueId}`);
          loadProjectState();
        }}
        onError={(error) => {
          toast({
            title: "Generation Error",
            description: error,
            variant: "destructive"
          });
        }}
        onCancel={() => navigate('/book-projects')}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Project not found. Please check the URL or try again.'}
            </AlertDescription>
          </Alert>
          <div className="mt-6">
            <Button onClick={() => navigate('/book-projects')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/book-projects')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {getStatusIcon(state.status)}
                {bookData?.book_metadata?.title || state.project_title}
              </h1>
              <p className="text-sm text-muted-foreground">
                Created {new Date(state.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={state.status === 'completed' ? 'default' : 'secondary'}>
              {state.status}
            </Badge>
            
            {state.status === 'processing' && (
              <>
                <Button size="sm" variant="outline" onClick={() => handleAction('pause')}>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
                <Button size="sm" onClick={() => navigate(`/text/long-form-book/${state.url_slug}?view=live`)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Watch Live
                </Button>
              </>
            )}
            
            {state.can_resume && (
              <Button size="sm" onClick={() => handleAction('resume')}>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
            )}
            
            {state.status === 'completed' && (
              <Button size="sm" variant="outline" onClick={() => handleAction('download')}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            )}
            
            <Button size="sm" variant="outline" onClick={loadProjectState}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress Card for Active Generation */}
        {state.status === 'processing' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Generation in Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Progress</span>
                    <span>{state.progress}%</span>
                  </div>
                  <Progress value={state.progress} className="h-2" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => navigate(`/text/long-form-book/${state.url_slug}?view=live`)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Watch Live
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
        {state.status === 'completed' && (!bookData || chapters.length === 0) && (
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
        {(state.status === 'pending' || state.status === 'failed') && (
          <div className="text-center py-20">
            {state.status === 'pending' ? (
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
                <Button onClick={() => navigate('/ai-studio/long-form-book')}>
                  Create New Book
                </Button>
              </>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default BookViewer;
