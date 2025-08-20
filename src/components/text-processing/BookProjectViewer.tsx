import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  X,
  Copy,
  FileText,
  CreditCard,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EnhancedStreamingBookGenerator from "@/components/EnhancedStreamingBookGenerator";
import { BookContentRenderer } from "@/components/BookContentRenderer";
import { apiService } from "@/lib/apiService";
import { format } from 'date-fns';

interface ProjectState {
  usage_id: string;
  project_type: string;
  project_name: string;
  status: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  credits_used: number;
  error_message?: string;
  book_data: {
    title: string;
    concept: string;
    genre: string;
    settings: any;
  };
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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [projectState, setProjectState] = useState<ProjectState | null>(null);
  const [bookData, setBookData] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'viewer' | 'generator'>('viewer');
  const [chapters, setChapters] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

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
      const projectResult = await apiService.getBookProjectView(projectId);
      
      if (!projectResult.success) {
        throw new Error(projectResult.message || 'Failed to load project');
      }

      const projectData = projectResult.data;
      setProjectState(projectData);

      // If completed, load the full book data
      if (projectData.status === 'completed') {
        try {
          const bookResult = await apiService.getStoredBook(projectId);
          
          if (bookResult.success) {
            setBookData(bookResult.data);

            // Extract chapters for display
            if (bookResult.data.full_book_content?.chapters) {
              setChapters(bookResult.data.full_book_content.chapters);
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
          const pauseResult = await apiService.pauseProject('long-form-book', projectState.usage_id, {
            reason: 'user_requested',
            save_checkpoint: true,
            preserve_url: true
          });

          if (pauseResult.success) {
            toast({
              title: "Paused",
              description: "Generation paused successfully. Progress saved.",
            });
            loadProjectState();
          }
          break;

        case 'resume':
          // Update URL to show live view
          setSearchParams({ view: 'live' });
          setView('generator');
          break;
          
        case 'download':
          try {
            const result = await apiService.getBookPDF(projectState.usage_id);

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
          const cancelResult = await apiService.cancelBookGeneration(projectState.usage_id);

          if (cancelResult.success) {
            toast({
              title: "Cancelled",
              description: `Generation cancelled. ${cancelResult.data.credits_refunded || 0} credits refunded.`,
            });
            loadProjectState();
          }
          break;
          
        case 'share':
          navigator.clipboard.writeText(window.location.href);
          toast({
            title: "Link Copied",
            description: "Project link copied to clipboard",
          });
          break;

        case 'duplicate':
          try {
            const duplicateResult = await apiService.duplicateBookSettings(projectState.usage_id);
            
            if (duplicateResult.success) {
              navigate('/text/long-form-book', { 
                state: { templateSettings: duplicateResult.data.settings } 
              });
            }
          } catch (duplicateError) {
            toast({
              title: "Error",
              description: "Failed to duplicate book settings",
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
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Pause className="h-5 w-5 text-yellow-500" />;
      case 'cancelled':
        return <X className="h-5 w-5 text-gray-500" />;
      default:
        return <Book className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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
  if (view === 'generator' && (projectState.status === 'processing' || viewParam === 'live')) {
    return (
      <div className="h-full">
        <div className="mb-4">
          <Button variant="outline" onClick={() => {
            setView('viewer');
            setSearchParams({});
          }}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project View
          </Button>
        </div>
        <EnhancedStreamingBookGenerator
          requestData={projectState.book_data?.settings || {}}
          usageId={projectState.usage_id}
          onComplete={(usageId, data) => {
            setView('viewer');
            setSearchParams({});
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
          onCancel={() => {
            setView('viewer');
            setSearchParams({});
          }}
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
              {projectState.book_data?.title || 'Book Project'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Created {format(new Date(projectState.created_at), 'PPP')} • 
              {projectState.credits_used} credits used
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={`${getStatusColor(projectState.status)} border-0`}>
            {projectState.status}
          </Badge>
          
          {projectState.status === 'processing' && (
            <Button size="sm" onClick={() => {
              setSearchParams({ view: 'live' });
              setView('generator');
            }}>
              <Eye className="h-4 w-4 mr-2" />
              Watch Live
            </Button>
          )}
          
          {projectState.navigation.can_cancel && projectState.status === 'processing' && (
            <Button size="sm" variant="outline" onClick={() => handleAction('pause')}>
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          )}
          
          {projectState.status === 'pending' && (
            <Button size="sm" variant="outline" onClick={() => handleAction('resume')}>
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
          )}
          
          {projectState.navigation.can_download_pdf && (
            <Button size="sm" variant="outline" onClick={() => handleAction('download')}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          )}

          {projectState.navigation.can_duplicate && (
            <Button size="sm" variant="outline" onClick={() => handleAction('duplicate')}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
          )}
          
          {projectState.navigation.can_cancel && (
            <Button size="sm" variant="outline" onClick={() => handleAction('cancel')}>
              <X className="h-4 w-4 mr-2" />
              Cancel
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {bookData && <TabsTrigger value="content">Book Content</TabsTrigger>}
          <TabsTrigger value="details">Project Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Project Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                Project Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <strong>Title:</strong> {projectState.book_data?.title || 'Untitled'}
                </div>
                <div>
                  <strong>Genre:</strong> {projectState.book_data?.genre || 'N/A'}
                </div>
                <div>
                  <strong>Status:</strong> 
                  <Badge className={`ml-2 ${getStatusColor(projectState.status)} border-0 text-xs`}>
                    {projectState.status}
                  </Badge>
                </div>
                <div>
                  <strong>Credits Used:</strong> {projectState.credits_used}
                </div>
              </div>

              {projectState.book_data?.concept && (
                <div className="mt-4">
                  <strong>Concept:</strong>
                  <p className="text-muted-foreground mt-1">{projectState.book_data.concept}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress Card for Active Generation */}
          {projectState.status === 'processing' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  Generation in Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => {
                      setSearchParams({ view: 'live' });
                      setView('generator');
                    }}>
                      <Eye className="h-4 w-4 mr-2" />
                      Watch Live Generation
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleAction('pause')}>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause Generation
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your book is being generated. You can watch the progress live or check back later.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Book Metadata Card */}
          {bookData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Book Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <strong>Author:</strong> {bookData.book_metadata?.author || 'AI Generated'}
                  </div>
                  <div>
                    <strong>Total Words:</strong> {bookData.book_metadata?.total_words?.toLocaleString() || '0'}
                  </div>
                  <div>
                    <strong>Total Images:</strong> {bookData.book_metadata?.total_images || '0'}
                  </div>
                  <div>
                    <strong>Total Pages:</strong> {bookData.book_metadata?.total_pages || '0'}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generation Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Created</span>
                  <span>{format(new Date(projectState.created_at), 'PPP p')}</span>
                </div>
                {projectState.started_at && (
                  <div className="flex items-center justify-between text-sm">
                    <span>Generation Started</span>
                    <span>{format(new Date(projectState.started_at), 'PPP p')}</span>
                  </div>
                )}
                {projectState.completed_at && (
                  <div className="flex items-center justify-between text-sm">
                    <span>Completed</span>
                    <span>{format(new Date(projectState.completed_at), 'PPP p')}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          {bookData && chapters.length > 0 ? (
            <div className="space-y-8">
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
                          <span className="text-sm text-muted-foreground">
                            {item.word_count && `${item.word_count} words`}
                          </span>
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
          ) : (
            <div className="text-center py-20">
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
              <h2 className="text-xl font-semibold mb-4">Book Content Not Available</h2>
              <p className="text-muted-foreground mb-8">
                {projectState.status === 'completed' 
                  ? "The book generation is complete, but content couldn't be loaded."
                  : "Book content will be available once generation is complete."
                }
              </p>
              {projectState.status === 'completed' && (
                <Button onClick={loadProjectState}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Loading
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          {/* Detailed Project Information */}
          <Card>
            <CardHeader>
              <CardTitle>Technical Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <strong>Project ID:</strong> {projectState.usage_id}
                </div>
                <div>
                  <strong>Project Type:</strong> {projectState.project_type}
                </div>
                {projectState.error_message && (
                  <div>
                    <strong>Error Message:</strong>
                    <p className="text-red-600 mt-1">{projectState.error_message}</p>
                  </div>
                )}
                {bookData?.generation_info && (
                  <div>
                    <strong>Generation Info:</strong>
                    <pre className="bg-muted p-2 rounded mt-1 text-xs overflow-auto">
                      {JSON.stringify(bookData.generation_info, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Storage Information */}
          {bookData?.storage_info && (
            <Card>
              <CardHeader>
                <CardTitle>Storage Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Stored At:</span>
                    <span>{bookData.storage_info.stored_at}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Size:</span>
                    <span>{(bookData.storage_info.total_size / 1024).toFixed(2)} KB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Has PDF:</span>
                    <span>{bookData.storage_info.has_pdf ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Has Full Content:</span>
                    <span>{bookData.storage_info.has_full_content ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Pending/Failed States */}
      {(projectState.status === 'pending' || projectState.status === 'failed' || projectState.status === 'cancelled') && activeTab === 'overview' && (
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
          ) : projectState.status === 'cancelled' ? (
            <>
              <X className="h-16 w-16 text-gray-500 mx-auto mb-6" />
              <h2 className="text-xl font-semibold mb-4">Generation Cancelled</h2>
              <p className="text-muted-foreground mb-8">
                This book generation was cancelled. You can create a new book or duplicate the settings.
              </p>
              <div className="space-x-2">
                <Button onClick={() => handleAction('duplicate')}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate Settings
                </Button>
                <Button variant="outline" onClick={() => navigate('/text/long-form-book')}>
                  Create New Book
                </Button>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-6" />
              <h2 className="text-xl font-semibold mb-4">Generation Failed</h2>
              <p className="text-muted-foreground mb-4">
                Something went wrong during generation.
              </p>
              {projectState.error_message && (
                <p className="text-sm text-red-600 mb-8">
                  Error: {projectState.error_message}
                </p>
              )}
              <div className="space-x-2">
                <Button onClick={() => handleAction('duplicate')}>
                  <Copy className="h-4 w-4 mr-2" />
                  Try Again with Same Settings
                </Button>
                <Button variant="outline" onClick={() => navigate('/text/long-form-book')}>
                  Create New Book
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default BookProjectViewer;
