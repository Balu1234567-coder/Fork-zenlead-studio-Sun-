import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
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
  Edit,
  ArrowLeft,
  RefreshCw,
  Share2,
  Loader2,
  Eye,
  BookOpen
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BookApiService } from "@/lib/bookApi";
import EnhancedStreamingBookGenerator from "@/components/EnhancedStreamingBookGenerator";
import { BookContentRenderer } from "@/components/BookContentRenderer";
import UniqueUrlHandler, { useUniqueUrl } from "@/components/UniqueUrlHandler";

interface GenerationState {
  usage_id: string;
  status: string;
  progress: number;
  current_chapter: number;
  url_slug: string;
  created_at: string;
  updated_at: string;
  can_pause: boolean;
  can_resume: boolean;
  can_cancel: boolean;
  access_level: string;
  shareable_url: string;
  last_heartbeat?: string;
  has_recovery_data: boolean;
  // Enhanced fields from new backend
  current_operation?: string;
  estimated_completion?: string;
  book_context?: any;
  live_data?: any;
  recovery_info?: any;
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

const BookViewer: React.FC = () => {
  const { urlSlug, projectId } = useParams<{ urlSlug?: string; projectId?: string; uniqueId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { identifier, viewMode, action, updateViewMode, saveState } = useUniqueUrl();

  const [state, setState] = useState<GenerationState | null>(null);
  const [bookData, setBookData] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'viewer' | 'generator'>('viewer');
  const [chapters, setChapters] = useState<any[]>([]);
  const [projectResolved, setProjectResolved] = useState(false);

  // Use URL slug from params or identifier from hook
  const currentIdentifier = urlSlug || projectId || identifier;

  // Extract possible usage ID from identifier for fallback
  const extractedUsageId = currentIdentifier?.includes('-') ? currentIdentifier.split('-').pop() : currentIdentifier;

  useEffect(() => {
    if (currentIdentifier && projectResolved) {
      loadBookState();
    }
  }, [currentIdentifier, projectResolved]);

  useEffect(() => {
    // Handle view parameter
    if (viewParam === 'live' && state?.status === 'processing') {
      setView('generator');
    }
  }, [viewParam, state]);

  useEffect(() => {
    // Handle action parameters
    if (action === 'resume' && state?.can_resume) {
      setView('generator');
    } else if (action === 'edit') {
      setView('generator');
    }
  }, [action, state]);

  const loadBookState = async () => {
    if (!identifier) return;

    try {
      setLoading(true);

      let currentUsageId = extractedUsageId;
      let projectResponse = null;
      let resolvedFromBackend = false;

      // Try different resolution methods based on identifier format
      if (identifier) {
        try {
          // First check local storage for quick resolution
          const localProject = ProjectUtils.findProjectBySlug(identifier);
          if (localProject && localProject.usage_id) {
            currentUsageId = localProject.usage_id;
            console.log('Resolved from local storage:', localProject.project_title);
          }

          // Always try backend resolution for latest state
          // First try as URL slug
          const slugResponse = await fetch(`/api/ai/long-form-book/project/${identifier}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
              'Content-Type': 'application/json'
            }
          });

          if (slugResponse.ok) {
            const slugResult = await slugResponse.json();
            if (slugResult.success) {
              projectResponse = slugResult.data;
              currentUsageId = projectResponse.usage_id;
              resolvedFromBackend = true;
              console.log('Resolved from backend via slug:', projectResponse.project_title);
            }
          }

          // If slug resolution fails, try as UUID
          if (!resolvedFromBackend) {
            const uuidResponse = await fetch(`/api/ai/usage/project/uuid/${identifier}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                'Content-Type': 'application/json'
              }
            });

            if (uuidResponse.ok) {
              const uuidResult = await uuidResponse.json();
              if (uuidResult.success) {
                projectResponse = uuidResult.data;
                currentUsageId = projectResponse.usage_id;
                resolvedFromBackend = true;
                console.log('Resolved from backend via UUID:', projectResponse.project_title);
              }
            }
          }
        } catch (resolveError) {
          console.warn('Failed to resolve project identifier:', resolveError);
          // Fall back to local storage if available
          if (!currentUsageId) {
            const localProject = ProjectUtils.findProjectBySlug(identifier);
            if (localProject && localProject.usage_id) {
              currentUsageId = localProject.usage_id;
              console.log('Falling back to local storage resolution');
            }
          }
        }
      }

      if (!currentUsageId) {
        throw new Error('Project not found');
      }

      // Get enhanced state from new backend endpoint
      let enhancedState: GenerationState;
      let statusResponse: any;

      try {
        const stateResponse = await fetch(`/api/ai/long-form-book/${currentUsageId}/state`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (stateResponse.ok) {
          const stateResult = await stateResponse.json();
          if (stateResult.success) {
            const stateData = stateResult.data;

            enhancedState = {
              usage_id: currentUsageId,
              status: stateData.status,
              progress: stateData.progress || 0,
              current_chapter: stateData.current_chapter || 1,
              url_slug: stateData.url_slug || urlSlug || `book-${currentUsageId.slice(0, 8)}`,
              created_at: stateData.created_at || new Date().toISOString(),
              updated_at: stateData.updated_at || new Date().toISOString(),
              can_pause: stateData.can_pause || false,
              can_resume: stateData.can_resume || false,
              can_cancel: stateData.can_cancel || false,
              access_level: stateData.access_level || 'private',
              shareable_url: stateData.shareable_url || `/book-generation/${stateData.url_slug}`,
              has_recovery_data: stateData.has_recovery_data || false,
              // Enhanced fields
              current_operation: stateData.current_operation,
              estimated_completion: stateData.estimated_completion,
              book_context: stateData.book_context,
              live_data: stateData.live_data,
              recovery_info: stateData.recovery_info
            };

            statusResponse = { status: stateData.status };
          } else {
            throw new Error('Failed to get state');
          }
        } else {
          throw new Error(`State endpoint failed: ${stateResponse.status}`);
        }
      } catch (stateError) {
        console.warn('Enhanced state not available, falling back to basic status:', stateError);

        // Fallback to existing status endpoint
        statusResponse = await BookApiService.getGenerationStatus(currentUsageId);

        // Create fallback state with proper URL slug
        const fallbackUrlSlug = identifier || urlSlug || `book-${currentUsageId?.slice(0, 8) || 'unknown'}`;

        enhancedState = {
          usage_id: currentUsageId || '',
          status: statusResponse?.status || 'unknown',
          progress: 0,
          current_chapter: 1,
          url_slug: fallbackUrlSlug,
          created_at: statusResponse?.created_at || new Date().toISOString(),
          updated_at: statusResponse?.created_at || new Date().toISOString(),
          can_pause: statusResponse?.status === 'processing',
          can_resume: statusResponse?.status === 'pending',
          can_cancel: ['pending', 'processing'].includes(statusResponse?.status || ''),
          access_level: 'private',
          shareable_url: `/${fallbackUrlSlug}`,
          has_recovery_data: statusResponse?.has_output || false
        };
      }

      setState(enhancedState);

      // Update local storage with latest state if we resolved from backend
      if (resolvedFromBackend && projectResponse) {
        ProjectUtils.saveProjectToLocalHistory({
          usage_id: currentUsageId || '',
          project_uuid: projectResponse.project_uuid || '',
          url_slug: enhancedState.url_slug,
          project_title: projectResponse.project_title || 'Unknown Project',
          unique_url: `/${enhancedState.url_slug}`,
          shareable_url: `/${enhancedState.url_slug}`,
          created_at: enhancedState.created_at,
          status: enhancedState.status,
          last_accessed: new Date().toISOString()
        } as any);
      }

      // If completed, try to load the full book data using new stored endpoint
      if (enhancedState.status === 'completed') {
        try {
          const response = await fetch(`/api/ai/long-form-book/${currentUsageId}/stored`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              setBookData(result.data);

              // Extract chapters for display
              if (result.data.full_book_content?.chapters) {
                setChapters(result.data.full_book_content.chapters);
              }
            }
          }
        } catch (bookError) {
          console.warn('Could not load full book data:', bookError);
        }
      }

      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load book state');
      toast({
        title: "Error",
        description: "Failed to load book state",
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
            },
            body: JSON.stringify({
              reason: 'user_requested',
              save_checkpoint: true,
              preserve_url: true
            })
          });

          if (pauseResponse.ok) {
            const pauseResult = await pauseResponse.json();
            if (pauseResult.success) {
              toast({
                title: "Paused",
                description: "Generation paused successfully. Progress saved.",
              });
            }
          }
          loadBookState();
          break;

        case 'resume':
          // Check if we should resume in generator view or call resume endpoint
          if (state.can_resume && state.has_recovery_data) {
            const resumeResponse = await fetch(`/api/ai/long-form-book/${state.usage_id}/resume`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                resume_from: 'last_checkpoint'
              })
            });

            if (resumeResponse.ok) {
              setView('generator');
              toast({
                title: "Resuming",
                description: "Generation resumed from saved checkpoint.",
              });
            }
          } else {
            setView('generator');
          }
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
          
        case 'share':
          navigator.clipboard.writeText(window.location.href);
          toast({
            title: "Link Copied",
            description: "Shareable link copied to clipboard",
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
              {error || 'Book not found. Please check the URL or try again.'}
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

  // Show generator view for active generation or resume
  if (view === 'generator' || (state.status === 'processing' && !bookData)) {
    return (
      <div className="min-h-screen bg-background">
        <EnhancedStreamingBookGenerator
          requestData={{}} // You'd pass the original request data here
          onComplete={(usageId, data) => {
            setView('viewer');
            loadBookState();
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
                {bookData?.book_metadata?.title || 'Book Project'}
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
            
            {state.can_pause && (
              <Button size="sm" variant="outline" onClick={() => handleAction('pause')}>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}
            
            {state.can_resume && (
              <Button size="sm" onClick={() => handleAction('resume')}>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
            )}
            
            {state.status === 'completed' && (
              <>
                <Button size="sm" variant="outline" onClick={() => handleAction('download')}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleAction('share')}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </>
            )}
            
            <Button size="sm" variant="outline" onClick={loadBookState}>
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
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Current Chapter:</strong> {state.current_chapter}
                  </div>
                  <div>
                    <strong>Last Update:</strong> {new Date(state.updated_at).toLocaleTimeString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setView('generator')}>
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
            <Button onClick={loadBookState}>
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
