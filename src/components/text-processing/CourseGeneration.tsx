import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Upload, Sparkles, Clock, Zap, Sun } from "lucide-react";

const CourseGeneration = () => {
  const [courseIdea, setCourseIdea] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedCommitment, setSelectedCommitment] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [customHours, setCustomHours] = useState("");

  const examplePrompts = [
    "I want to learn React with a focus on modern practices and real-world applications",
    "Complete guide to financial planning for beginners",
    "Advanced machine learning algorithms for data scientists",
    "Digital marketing strategies for small businesses",
    "Introduction to cloud computing with AWS"
  ];

  const industries = [
    "Technology", "Finance", "Healthcare", "Consultancy", "Cross Industries"
  ];

  const levels = [
    {
      id: "beginner",
      emoji: "🌱",
      title: "Beginner",
      subtitle: "New to the subject",
      features: ["Foundational concepts", "Basic terminology", "Guided practice"]
    },
    {
      id: "intermediate", 
      emoji: "🌿",
      title: "Intermediate",
      subtitle: "Familiar with basics",
      features: ["Advanced concepts", "Real-world examples", "Independent projects"]
    },
    {
      id: "advanced",
      emoji: "🌳", 
      title: "Advanced",
      subtitle: "Experienced practitioner",
      features: ["Expert techniques", "Complex problems", "Specialized topics"]
    }
  ];

  const commitments = [
    {
      id: "light",
      emoji: "☀️",
      title: "Light",
      subtitle: "Casual pace",
      time: "1-2 hours/week"
    },
    {
      id: "moderate",
      emoji: "🌤️", 
      title: "Moderate",
      subtitle: "Balanced learning",
      time: "3-5 hours/week"
    },
    {
      id: "intensive",
      emoji: "⚡",
      title: "Intensive", 
      subtitle: "Deep focus",
      time: "6+ hours/week"
    }
  ];

  const suggestedDurations = [
    { hours: 10, label: "Quick Skill boost" },
    { hours: 20, label: "Comprehensive Learning" },
    { hours: 40, label: "Deep Mastery" }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Course Generation</h1>
        <p className="text-muted-foreground">Create comprehensive courses with AI assistance</p>
      </div>

      {/* Course Idea Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            What course do you want to create?
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Tell us your idea - don't worry about making it perfect!
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Example: I want to learn React with a focus on modern practices and real-world applications..."
            value={courseIdea}
            onChange={(e) => setCourseIdea(e.target.value)}
            className="min-h-24"
          />
          
          <div className="space-y-3">
            <p className="text-sm font-medium">Try these examples:</p>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setCourseIdea(prompt)}
                  className="text-left h-auto p-2 whitespace-normal"
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium">Industry focus:</p>
            <div className="flex flex-wrap gap-2">
              {industries.map((industry) => (
                <Badge key={industry} variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                  {industry}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Want to use existing materials?
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload files or add online resources to help create your course
          </p>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Drop files here or click to upload
            </p>
            <Button variant="outline" size="sm">Choose Files</Button>
          </div>
        </CardContent>
      </Card>

      {/* Level Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Your Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {levels.map((level) => (
              <Card
                key={level.id}
                className={`cursor-pointer transition-all ${
                  selectedLevel === level.id 
                    ? 'ring-2 ring-primary border-primary' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedLevel(level.id)}
              >
                <CardContent className="p-4 text-center space-y-3">
                  <div className="text-3xl">{level.emoji}</div>
                  <div>
                    <h3 className="font-semibold">{level.title}</h3>
                    <p className="text-sm text-muted-foreground">{level.subtitle}</p>
                  </div>
                  <div className="space-y-1">
                    {level.features.map((feature, index) => (
                      <p key={index} className="text-xs text-muted-foreground">
                        {feature}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Time Commitment */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Time Commitment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {commitments.map((commitment) => (
              <Card
                key={commitment.id}
                className={`cursor-pointer transition-all ${
                  selectedCommitment === commitment.id 
                    ? 'ring-2 ring-primary border-primary' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedCommitment(commitment.id)}
              >
                <CardContent className="p-4 text-center space-y-2">
                  <div className="text-2xl">{commitment.emoji}</div>
                  <div>
                    <h3 className="font-semibold">{commitment.title}</h3>
                    <p className="text-sm text-muted-foreground">{commitment.subtitle}</p>
                    <p className="text-sm font-medium">{commitment.time}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Duration Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Total Duration</CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose or enter your desired course length
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Custom Duration */}
          <div className="space-y-3">
            <h3 className="font-medium">Custom Duration</h3>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                placeholder="Enter hours"
                value={customHours}
                onChange={(e) => setCustomHours(e.target.value)}
                className="w-32"
                min="2"
                max="60"
              />
              <span className="text-sm text-muted-foreground">Hours</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter any duration between 2 - 60 Hours
            </p>
          </div>

          <Separator />

          {/* Suggested Durations */}
          <div className="space-y-3">
            <h3 className="font-medium">Suggested Durations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {suggestedDurations.map((duration) => (
                <Button
                  key={duration.hours}
                  variant={selectedDuration === duration.hours.toString() ? "default" : "outline"}
                  className="h-auto p-4 flex flex-col gap-1"
                  onClick={() => setSelectedDuration(duration.hours.toString())}
                >
                  <span className="font-semibold">{duration.hours} Hour</span>
                  <span className="text-xs opacity-75">{duration.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button size="lg" className="px-8">
          <Sparkles className="mr-2 h-5 w-5" />
          Generate Course
        </Button>
      </div>
    </div>
  );
};

export default CourseGeneration;
