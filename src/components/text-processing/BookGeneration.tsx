import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Book, Download, RefreshCw, ArrowLeft, AlertTriangle, Sparkles } from "lucide-react";
import { apiService } from "@/lib/apiService";
import { useToast } from "@/hooks/use-toast";
import DynamicFormGenerator from "@/components/DynamicFormGenerator";
import EnhancedStreamingBookGenerator from "@/components/EnhancedStreamingBookGenerator";
import { BookGenerationUtils, BookGenerationStateManager } from "@/lib/bookGenerationState";
import { ProjectUtils } from "@/lib/projectUtils";

const BookGeneration = () => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationRequestData, setGenerationRequestData] = useState<any>(null);
  const [generatedBooks, setGeneratedBooks] = useState<Array<{ usageId: string; bookData: any; requestData: any }>>([]);
  const [resumeState, setResumeState] = useState<any>(null);
  const [showResumeOption, setShowResumeOption] = useState(false);
  const [templateSettings, setTemplateSettings] = useState<any>(null);
  const [autoStartRequested, setAutoStartRequested] = useState(false);

  // Handle template settings from navigation state
  useEffect(() => {
    const state = location.state as any;
    if (state?.templateSettings) {
      setTemplateSettings(state.templateSettings);

      // If auto-start is requested, prepare for automatic generation
      if (state.autoStart && !autoStartRequested) {
        setAutoStartRequested(true);
        toast({
          title: "Quick Start",
          description: "Template loaded. Starting book generation...",
          duration: 3000,
        });

        // Small delay to let the form populate, then auto-start
        setTimeout(() => {
          handleGenerate(state.templateSettings);
        }, 1000);
      }
    }
  }, [location.state, autoStartRequested, toast]);

  // Check for active generation on component mount
  useEffect(() => {
    // Skip if we're handling template auto-start
    if (autoStartRequested) return;

    // Clear any potentially corrupted state first
    try {
      const savedState = localStorage.getItem('book_generation_state');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        // Check if saved state has invalid usage_id
        if (!parsed.usageId || parsed.usageId.length < 8) {
          console.log('Clearing invalid book generation state');
          localStorage.removeItem('book_generation_state');
        }
      }
    } catch (error) {
      console.log('Clearing corrupted book generation state');
      localStorage.removeItem('book_generation_state');
    }

    const activeGeneration = BookGenerationUtils.hasActiveGeneration();

    if (activeGeneration.active) {
      const savedState = BookGenerationStateManager.loadState();

      if (savedState) {
        // Check if generation might have timed out
        const twentyMinutes = 20 * 60 * 1000;
        const timeSinceStart = Date.now() - savedState.startTime;

        if (timeSinceStart > twentyMinutes && savedState.status === 'generating') {
          // Offer to resume or start fresh
          setShowResumeOption(true);
          setResumeState(savedState);
        } else if (savedState.status === 'generating') {
          // Auto-resume if within reasonable time
          setGenerationRequestData(savedState.requestData);
          setResumeState(savedState);
          setIsGenerating(true);
        }
      }
    }
  }, [autoStartRequested]);

  const handleGenerate = async (validatedData: any) => {
    // Create unique identifiers for this project
    const projectTitle = validatedData.book_title || validatedData.concept || ProjectUtils.generateProjectTitle(validatedData.concept);
    const projectMeta = ProjectUtils.createProjectIdentifiers(projectTitle);

    // Save project metadata immediately
    const projectData = {
      usage_id: '', // Will be set when we get response from backend
      project_uuid: projectMeta.project_uuid,
      url_slug: projectMeta.url_slug,
      project_title: projectTitle,
      unique_url: projectMeta.unique_url,
      shareable_url: projectMeta.shareable_url,
      created_at: new Date().toISOString(),
      status: 'processing'
    };

    // Include project metadata in the request
    const enhancedData = {
      ...validatedData,
      project_title: projectTitle,
      project_uuid: projectMeta.project_uuid,
      url_slug: projectMeta.url_slug
    };

    setGenerationRequestData(enhancedData);
    setIsGenerating(true);
    setResumeState(null);
    setShowResumeOption(false);

    // Clear any existing state
    BookGenerationStateManager.clearState();

    // Save initial project state
    ProjectUtils.saveProjectToLocalHistory(projectData);

    // Navigate to the unique URL for live viewing with /text/long-form-book prefix
    setTimeout(() => {
      navigate(`/text/long-form-book/${projectMeta.url_slug}?view=live`);
    }, 1000);
  };

  const handleResumeGeneration = () => {
    if (resumeState) {
      setGenerationRequestData(resumeState.requestData);
      setIsGenerating(true);
      setShowResumeOption(false);
    }
  };

  const handleStartFreshGeneration = () => {
    BookGenerationStateManager.clearState();
    setResumeState(null);
    setShowResumeOption(false);
  };

  const handleGenerationComplete = (usageId: string, bookData: any) => {
    setGeneratedBooks(prev => [
      { usageId, bookData, requestData: generationRequestData },
      ...prev
    ]);

    setIsGenerating(false);
    BookGenerationStateManager.clearState();

    // Create project metadata for unique URL access
    const projectTitle = bookData?.book_metadata?.title || generationRequestData?.book_title || 'AI Generated Book';
    const projectMeta = ProjectUtils.createProjectIdentifiers(projectTitle);

    // Save to local history for quick access
    ProjectUtils.saveProjectToLocalHistory({
      usage_id: usageId,
      project_uuid: projectMeta.project_uuid,
      url_slug: projectMeta.url_slug,
      project_title: projectTitle,
      unique_url: projectMeta.unique_url,
      shareable_url: projectMeta.shareable_url,
      created_at: new Date().toISOString(),
      status: 'completed'
    });

    toast({
      title: "Success",
      description: "Book generated successfully! Redirecting to your project...",
    });

    // Navigate to the unique URL with /text/long-form-book prefix
    setTimeout(() => {
      navigate(`/text/long-form-book/${projectMeta.url_slug}`);
    }, 2000);
  };

  const handleGenerationError = (error: string) => {
    setIsGenerating(false);
    BookGenerationUtils.failGeneration(error);
    
    toast({
      title: "Generation Failed", 
      description: error,
      variant: "destructive"
    });
  };

  const handleCancelGeneration = () => {
    setIsGenerating(false);
    setGenerationRequestData(null);
    setResumeState(null);
    BookGenerationStateManager.clearState();
  };

  const downloadPDF = async (usageId: string, title: string) => {
    try {
      const response = await apiService.getBookPDF(usageId);
      
      if (response.success && response.data.pdf_base64) {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${response.data.pdf_base64}`;
        link.download = response.data.filename || `${title}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Success",
          description: "PDF downloaded successfully!",
        });
      } else {
        throw new Error(response.message || 'Failed to get PDF');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to download PDF",
        variant: "destructive"
      });
    }
  };

  // Show resume option if there's an interrupted generation
  if (showResumeOption && resumeState) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Previous Generation Found</h3>
                <p className="text-sm mb-3">
                  We found a book generation that was in progress. The book "{resumeState.bookMetadata?.title || 'Untitled'}" 
                  was {resumeState.progress}% complete when it was interrupted.
                </p>
                <div className="bg-yellow-100 p-3 rounded-md text-sm">
                  <p><strong>Progress:</strong> {resumeState.progress}%</p>
                  <p><strong>Chapters:</strong> {resumeState.chapters?.length || 0} completed</p>
                  <p><strong>Status:</strong> {resumeState.currentMessage}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleResumeGeneration}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  View Progress
                </Button>
                <Button variant="outline" size="sm" onClick={handleStartFreshGeneration}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Start New Generation
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // If generating, show the enhanced streaming interface
  if (isGenerating && generationRequestData) {
    return (
      <div className="h-screen">
        <EnhancedStreamingBookGenerator
          requestData={generationRequestData}
          onComplete={handleGenerationComplete}
          onError={handleGenerationError}
          onCancel={handleCancelGeneration}
          resumeState={resumeState}
        />
      </div>
    );
  }

  // Default view - form and history
  return (
    <div className="space-y-8">
      {/* Template Info Banner */}
      {templateSettings && !autoStartRequested && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-blue-800">
                  Template Loaded: {templateSettings.book_title || 'Professional Book Template'}
                </p>
                <p className="text-sm text-blue-700">
                  Your form has been pre-filled with optimized settings. You can modify them or generate directly.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dynamic Form */}
      <DynamicFormGenerator
        modelSlug="long-form-book"
        onSubmit={handleGenerate}
        isLoading={false}
        submitButtonText="Generate Long-Form Book"
        initialValues={templateSettings}
      />

      {/* Generated Books History */}
      {generatedBooks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-6 w-6" />
              Generated Books
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {generatedBooks.map((book, index) => (
                <div key={book.usageId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium">
                      {book.bookData?.book_metadata?.title || 
                       book.requestData?.concept?.substring(0, 50) || 
                       `Book ${index + 1}`}
                    </h3>
                    <div className="text-sm text-muted-foreground mt-1">
                      {book.bookData?.book_metadata?.total_chapters || 0} chapters • 
                      {book.bookData?.book_metadata?.total_words || 0} words • 
                      Generated {new Date(book.bookData?.generation_info?.completed_at || Date.now()).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Genre: {book.requestData?.genre?.replace('-', ' ') || 'Unknown'} • 
                      Author: {book.bookData?.book_metadata?.author || 'AI Generated'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => downloadPDF(book.usageId, book.bookData?.book_metadata?.title || 'book')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto font-bold">1</div>
              <h3 className="font-medium">Configure Settings</h3>
              <p className="text-muted-foreground">
                Choose your book's genre, length, tone, and structure using our dynamic form
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto font-bold">2</div>
              <h3 className="font-medium">Watch Live Generation</h3>
              <p className="text-muted-foreground">
                See your book being created in real-time with chapters and images streaming in
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto font-bold">3</div>
              <h3 className="font-medium">Export & Save</h3>
              <p className="text-muted-foreground">
                Download your professional PDF or save for later access
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookGeneration;
