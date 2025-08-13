import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowRight,
  Play,
  CheckCircle2,
  Clock,
  Target,
  Copy,
  Download,
  Edit
} from "lucide-react";
import { ContentGenerationShimmer } from "@/components/UploadShimmer";

interface ContentPreset {
  id: string;
  type: 'book' | 'research' | 'course' | 'letter' | 'report' | 'article';
  title: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  estimatedTime: string;
  features: string[];
  settings: {
    tone?: string[];
    style?: string[];
    length?: string[];
    format?: string[];
  };
}

interface ContentGenerationWorkspaceProps {
  preset: ContentPreset;
  onBack: () => void;
  onGenerate: (contentIdea: string, settings: any) => void;
  isGenerating: boolean;
  generatedContent: string;
}

const ContentGenerationWorkspace = ({ 
  preset, 
  onBack, 
  onGenerate, 
  isGenerating, 
  generatedContent 
}: ContentGenerationWorkspaceProps) => {
  const [contentIdea, setContentIdea] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [timeCommitment, setTimeCommitment] = useState("");
  const [duration, setDuration] = useState(10);

  const handleGenerate = () => {
    onGenerate(contentIdea, {
      level: selectedLevel,
      timeCommitment,
      duration
    });
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row">
      {/* Settings Panel */}
      <div className="w-full lg:w-96 border-b lg:border-b-0 lg:border-r bg-card/30 backdrop-blur-sm p-4 lg:p-6 max-h-screen overflow-y-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
          </Button>
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${preset.color}`}>
              {(() => {
                const Icon = preset.icon;
                return <Icon className="h-4 w-4 text-white" />;
              })()}
            </div>
            <div>
              <h2 className="font-semibold text-lg lg:text-xl">{preset.title}</h2>
              <p className="text-sm text-muted-foreground">{preset.estimatedTime}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Content Idea Input */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              What do you want to create?
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Textarea
              placeholder={`Tell us your idea - don't worry about making it perfect!\n\nExample: Create a comprehensive onboarding course for new backend developers using our tech stack documentation and coding standards...`}
              value={contentIdea}
              onChange={(e) => setContentIdea(e.target.value)}
              className="min-h-32 resize-none"
            />
          </div>

          {/* Course-specific settings for demo */}
          {preset.type === 'course' && (
            <>
              {/* Level Selection */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Select Your Level</Label>
                <div className="grid gap-3">
                  {[
                    { id: 'beginner', emoji: '🌱', title: 'Beginner', desc: 'New to the subject' },
                    { id: 'intermediate', emoji: '🌿', title: 'Intermediate', desc: 'Familiar with basics' },
                    { id: 'advanced', emoji: '🌳', title: 'Advanced', desc: 'Experienced practitioner' }
                  ].map((level) => (
                    <Card
                      key={level.id}
                      className={`cursor-pointer transition-all ${selectedLevel === level.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                      onClick={() => setSelectedLevel(level.id)}
                    >
                      <CardContent className="p-3 lg:p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl lg:text-2xl">{level.emoji}</span>
                          <div>
                            <p className="font-medium text-sm lg:text-base">{level.title}</p>
                            <p className="text-xs lg:text-sm text-muted-foreground">{level.desc}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Time Commitment */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Weekly Time Commitment</Label>
                <div className="grid gap-3">
                  {[
                    { id: 'light', emoji: '☀️', title: 'Light', desc: '1-2 hours/week' },
                    { id: 'moderate', emoji: '🌤️', title: 'Moderate', desc: '3-5 hours/week' },
                    { id: 'intensive', emoji: '⚡', title: 'Intensive', desc: '6+ hours/week' }
                  ].map((commitment) => (
                    <Card
                      key={commitment.id}
                      className={`cursor-pointer transition-all ${timeCommitment === commitment.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                      onClick={() => setTimeCommitment(commitment.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{commitment.emoji}</span>
                          <div>
                            <p className="font-medium text-sm">{commitment.title}</p>
                            <p className="text-xs text-muted-foreground">{commitment.desc}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Total Duration</Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      min={2}
                      max={60}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">Hours</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 10, label: 'Quick Skill' },
                      { value: 20, label: 'Comprehensive' },
                      { value: 40, label: 'Deep Mastery' }
                    ].map((presetOption) => (
                      <Button
                        key={presetOption.value}
                        variant={duration === presetOption.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDuration(presetOption.value)}
                        className="text-xs"
                      >
                        {presetOption.value}h
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Generate Button */}
          <div className="pt-4">
            <Button
              className="w-full gap-2"
              onClick={handleGenerate}
              disabled={!contentIdea.trim() || isGenerating}
            >
              {isGenerating ? (
                <ContentGenerationShimmer />
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Generate {preset.title}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
        {generatedContent ? (
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
                <h2 className="text-xl lg:text-2xl font-bold">Content Generated Successfully</h2>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
            
            <Card className="bg-white dark:bg-gray-900 shadow-lg">
              <CardContent className="p-6 lg:p-8">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap">{generatedContent}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center">
              <div className={`p-6 rounded-xl bg-gradient-to-r ${preset.color} text-white mx-auto mb-6 w-fit`}>
                {(() => {
                  const Icon = preset.icon;
                  return <Icon className="h-12 w-12" />;
                })()}
              </div>
              <h2 className="text-xl lg:text-2xl font-bold mb-3">Ready to Generate Your {preset.title}</h2>
              <p className="text-muted-foreground text-base lg:text-lg mb-6 max-w-md mx-auto">
                Fill out the settings in the left panel and click generate to create your content.
              </p>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{preset.estimatedTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <span>High Quality</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentGenerationWorkspace;
