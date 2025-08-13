import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LockedFeature } from "@/components/ui/locked-feature";
import { DocumentUpload } from "@/components/DocumentUpload";
import { ArrowRight } from "lucide-react";
import { TextProcessingState } from "@/pages/TextProcessing";
import { AtsScoreShimmer } from "@/components/ContentShimmer";
import { ContentGenerationShimmer } from "@/components/UploadShimmer";

interface AtsScoreProps {
  state: TextProcessingState;
  isLocked: boolean;
}

const AtsScore = ({ state, isLocked }: AtsScoreProps) => {
  const { atsFile, setAtsFile, jobDescription, setJobDescription, atsScore, setAtsScore, isAtsLoading, setIsAtsLoading } = state;

  const handleGenerateAtsScore = () => {
    setIsAtsLoading(true);
    setAtsScore(null);
    setTimeout(() => {
      const score = Math.floor(Math.random() * 41) + 60; // Random score between 60-100 for demo
      setAtsScore(score);
      setIsAtsLoading(false);
    }, 2000);
  };

  return (
    <LockedFeature isLocked={isLocked}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload Resume</CardTitle>
            <CardDescription>
              Upload a PDF or Excel file containing resume or candidate data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentUpload 
              onUpload={setAtsFile} 
              isLoading={isAtsLoading}
            />
            <div className="mt-4">
              <label className="text-sm font-medium mb-1 block">Job Description</label>
              <textarea
                className="w-full border rounded-md p-3 min-h-[100px] resize-none"
                placeholder="Enter the job description for the position..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Ensure the resume contains relevant skills and experience for accurate scoring.
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>ATS Score</CardTitle>
            <CardDescription>
              The calculated ATS score will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-y-auto border bg-background rounded-md px-4 py-3 shadow-inner">
              {isAtsLoading && (
                <AtsScoreShimmer />
              )}
              {!isAtsLoading && atsScore !== null && (
                <div className="space-y-4">
                  <h3 className="font-bold text-lg">ATS Score: {atsScore}%</h3>
                  <p className="text-base text-gray-700">
                    This score represents how well the resume matches the job description based on keywords, skills, and experience.
                  </p>
                </div>
              )}
              {!isAtsLoading && atsScore === null && (
                <div className="text-muted-foreground text-sm text-center py-10">
                  No score generated yet. Upload a file and enter a job description to start!
                </div>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <Button
                onClick={handleGenerateAtsScore}
                disabled={!atsFile || !jobDescription.trim() || isAtsLoading}
                className="w-full"
              >
                {isAtsLoading ? (
                  <ContentGenerationShimmer />
                ) : (
                  <>
                    Generate ATS Score
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Higher scores indicate better alignment with the job requirements.
          </CardFooter>
        </Card>
      </div>
    </LockedFeature>
  );
};

export default AtsScore;
