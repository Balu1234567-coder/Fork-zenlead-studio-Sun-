import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LockedFeature } from "@/components/ui/locked-feature";
import { DocumentUpload } from "@/components/DocumentUpload";
import { ArrowRight } from "lucide-react";
import { TextProcessingState } from "@/pages/TextProcessing";
import { ResumeAnalysisShimmer } from "@/components/ContentShimmer";
import { ContentGenerationShimmer } from "@/components/UploadShimmer";
import { apiService } from "@/lib/apiService";
import { useToast } from "@/hooks/use-toast";

interface ResumeAnalyserProps {
  state: TextProcessingState;
  isLocked: boolean;
}

const ResumeAnalyser = ({ state, isLocked }: ResumeAnalyserProps) => {
  const { toast } = useToast();
  const { resumeFile, setResumeFile, resumeJobDescription, setResumeJobDescription, resumeAnalysis, setResumeAnalysis, isResumeLoading, setIsResumeLoading } = state;

  const handleAnalyseResume = async () => {
    if (!resumeFile || !resumeJobDescription.trim()) {
      toast({
        title: "Error",
        description: "Please upload a resume and enter a job description",
        variant: "destructive"
      });
      return;
    }

    setIsResumeLoading(true);
    setResumeAnalysis(null);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('resume_file', resumeFile);
      formData.append('job_description', resumeJobDescription);

      console.log('🔍 Analyzing resume with API...');
      const response = await apiService.analyzeResume(formData);
      console.log('📋 Resume analysis response:', response);

      if (response.success && response.data) {
        // Set the analysis data from API response
        setResumeAnalysis(response.data);
        
        toast({
          title: "Success",
          description: "Resume analyzed successfully!",
        });
      } else {
        throw new Error(response.message || 'Failed to analyze resume');
      }
    } catch (error: any) {
      console.error('❌ Resume analysis failed:', error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to analyze resume. Please try again.",
        variant: "destructive"
      });

      // Fallback to example data for development/testing
      const fallbackAnalysis = {
        bestPractices: [
          "Use strong action verbs (e.g., 'led', 'developed', 'implemented') to describe your achievements.",
          "Quantify results where possible (e.g., 'increased sales by 20%').",
          "Keep your resume concise, ideally one page for most roles.",
        ],
        tailoredSuggestions: [
          `Include keywords from the job description, such as "${resumeJobDescription.slice(0, 20)}...".`,
          "Highlight relevant skills that match the job requirements.",
          "Emphasize experience that aligns with the role's responsibilities.",
        ],
        generalRecommendations: [
          "Use a clean, professional format with consistent fonts and spacing.",
          "Ensure no spelling or grammatical errors.",
          "Include a summary section tailored to the job.",
        ],
      };
      
      console.warn('🔄 Using fallback analysis data due to API error');
      setResumeAnalysis(fallbackAnalysis);
    } finally {
      setIsResumeLoading(false);
    }
  };

  return (
    <LockedFeature isLocked={isLocked}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload Resume</CardTitle>
            <CardDescription>
              Upload a PDF or Word document containing your resume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentUpload 
              onUpload={setResumeFile} 
              isLoading={isResumeLoading}
            />
            <div className="mt-4">
              <label className="text-sm font-medium mb-1 block">Job Description</label>
              <textarea
                className="w-full border rounded-md p-3 min-h-[100px] resize-none"
                placeholder="Enter the job description or profile for the position..."
                value={resumeJobDescription}
                onChange={(e) => setResumeJobDescription(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Ensure the resume is well-formatted for accurate analysis.
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resume Analysis</CardTitle>
            <CardDescription>
              AI-powered suggestions and best practices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-y-auto border bg-background rounded-md px-4 py-3 shadow-inner">
              {isResumeLoading && (
                <ResumeAnalysisShimmer />
              )}
              {!isResumeLoading && resumeAnalysis && (
                <div className="space-y-6">
                  {resumeAnalysis.bestPractices && (
                    <section>
                      <h3 className="font-bold text-lg mb-2">Best Practices</h3>
                      <ul className="list-disc pl-5 text-base text-gray-700">
                        {resumeAnalysis.bestPractices.map((item: string, idx: number) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {resumeAnalysis.tailoredSuggestions && (
                    <section>
                      <h3 className="font-bold text-lg mb-2">Tailored Suggestions</h3>
                      <ul className="list-disc pl-5 text-base text-gray-700">
                        {resumeAnalysis.tailoredSuggestions.map((item: string, idx: number) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {resumeAnalysis.generalRecommendations && (
                    <section>
                      <h3 className="font-bold text-lg mb-2">General Recommendations</h3>
                      <ul className="list-disc pl-5 text-base text-gray-700">
                        {resumeAnalysis.generalRecommendations.map((item: string, idx: number) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {resumeAnalysis.tags && resumeAnalysis.tags.length > 0 && (
                    <section>
                      <h3 className="font-bold text-lg mb-2">Analysis Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {resumeAnalysis.tags.map((tag: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}
                  {resumeAnalysis.score && (
                    <section>
                      <h3 className="font-bold text-lg mb-2">Overall Score</h3>
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{width: `${resumeAnalysis.score}%`}}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{resumeAnalysis.score}/100</span>
                      </div>
                    </section>
                  )}
                </div>
              )}
              {!isResumeLoading && !resumeAnalysis && (
                <div className="text-muted-foreground text-sm text-center py-10">
                  No analysis generated yet. Upload a resume and enter a job description to start!
                </div>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <Button
                onClick={handleAnalyseResume}
                disabled={!resumeFile || !resumeJobDescription.trim() || isResumeLoading}
                className="w-full"
              >
                {isResumeLoading ? (
                  <ContentGenerationShimmer />
                ) : (
                  <>
                    Analyse Resume
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Analysis powered by AI to help improve your resume's effectiveness.
          </CardFooter>
        </Card>
      </div>
    </LockedFeature>
  );
};

export default ResumeAnalyser;
