import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Book, Sparkles, AlertTriangle, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BookSettings {
  concept: string;
  book_title?: string;
  author_name: string;
  genre: string;
  target_audience: string;
  book_length: string;
  tone: string;
  complexity: string;
  perspective: string;
  chapters_count: number;
  sections_per_chapter: number;
  pages_per_section: number;
  include_toc: boolean;
  include_images: boolean;
  include_bibliography: boolean;
  include_cover: boolean;
}

interface SimpleBookGeneratorProps {
  onStart?: (settings: BookSettings) => void;
}

const SimpleBookGenerator: React.FC<SimpleBookGeneratorProps> = ({ onStart }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<BookSettings>({
    concept: '',
    book_title: '',
    author_name: 'AI Generated',
    genre: 'educational',
    target_audience: 'general',
    book_length: 'standard',
    tone: 'professional',
    complexity: 'intermediate',
    perspective: 'third-person',
    chapters_count: 10,
    sections_per_chapter: 6,
    pages_per_section: 3,
    include_toc: true,
    include_images: true,
    include_bibliography: true,
    include_cover: true
  });

  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState<{ available: number; required: number; sufficient: boolean } | null>(null);

  // Check credits on component mount
  React.useEffect(() => {
    checkCredits();
  }, []);

  const checkCredits = async () => {
    try {
      const response = await fetch('/api/ai/long-form-book/check-credits', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCredits({
            available: result.data.user_credits,
            required: result.data.credits_required,
            sufficient: result.data.has_sufficient_credits
          });
        }
      }
    } catch (error) {
      console.error('Failed to check credits:', error);
    }
  };

  const handleGenerate = async () => {
    if (!settings.concept.trim()) {
      toast({
        title: "Missing Information",
        description: "Please describe what book you want to create",
        variant: "destructive"
      });
      return;
    }

    if (!credits?.sufficient) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${credits?.required || 50} credits to generate a book`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Generate unique URL slug for this book
      const title = settings.book_title || settings.concept;
      const urlSlug = generateUrlSlug(title);

      // Start the generation process via your streaming endpoint
      const requestData = {
        ...settings,
        project_title: title,
        url_slug: urlSlug
      };

      // Navigate to the unique URL for live viewing
      navigate(`/text/long-form-book/${urlSlug}?view=live`, {
        state: { requestData }
      });

      // Optional: Call onStart callback
      if (onStart) {
        onStart(settings);
      }

      toast({
        title: "Generation Started",
        description: `Starting to generate "${title}". You can safely refresh the page.`,
        duration: 3000,
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start generation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateUrlSlug = (title: string): string => {
    const clean = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    const timestamp = Date.now().toString(36);
    return `${clean.substring(0, 30)}-${timestamp}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-6 w-6" />
            AI Book Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Create a comprehensive book with AI. Each book gets a unique URL that you can refresh safely during generation.
          </p>
        </CardContent>
      </Card>

      {/* Credit Status */}
      {credits && (
        <Card className={!credits.sufficient ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CreditCard className={`h-5 w-5 ${credits.sufficient ? 'text-green-600' : 'text-red-600'}`} />
              <div>
                <p className={`font-medium ${credits.sufficient ? 'text-green-800' : 'text-red-800'}`}>
                  {credits.sufficient ? 'Ready to generate' : 'Insufficient credits'}
                </p>
                <p className={`text-sm ${credits.sufficient ? 'text-green-700' : 'text-red-700'}`}>
                  You have {credits.available} credits, need {credits.required} to generate a book
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Book Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle>Book Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="concept">Book Concept *</Label>
              <Textarea
                id="concept"
                placeholder="Describe what book you want to create..."
                value={settings.concept}
                onChange={(e) => setSettings(prev => ({ ...prev, concept: e.target.value }))}
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="book_title">Book Title (optional)</Label>
                <Input
                  id="book_title"
                  placeholder="Auto-generated if empty"
                  value={settings.book_title}
                  onChange={(e) => setSettings(prev => ({ ...prev, book_title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author_name">Author Name</Label>
                <Input
                  id="author_name"
                  value={settings.author_name}
                  onChange={(e) => setSettings(prev => ({ ...prev, author_name: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Content Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Genre</Label>
              <Select value={settings.genre} onValueChange={(value) => setSettings(prev => ({ ...prev, genre: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="educational">Educational</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="self-help">Self Help</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="history">History</SelectItem>
                  <SelectItem value="biography">Biography</SelectItem>
                  <SelectItem value="non-fiction">Non-Fiction</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Select value={settings.target_audience} onValueChange={(value) => setSettings(prev => ({ ...prev, target_audience: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="professionals">Professionals</SelectItem>
                  <SelectItem value="students">Students</SelectItem>
                  <SelectItem value="beginners">Beginners</SelectItem>
                  <SelectItem value="advanced-users">Advanced Users</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Book Length</Label>
              <Select value={settings.book_length} onValueChange={(value) => setSettings(prev => ({ ...prev, book_length: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short (50-100 pages)</SelectItem>
                  <SelectItem value="standard">Standard (150-250 pages)</SelectItem>
                  <SelectItem value="extended">Extended (300-400 pages)</SelectItem>
                  <SelectItem value="epic">Epic (500+ pages)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Writing Style */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Writing Tone</Label>
              <Select value={settings.tone} onValueChange={(value) => setSettings(prev => ({ ...prev, tone: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="conversational">Conversational</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Complexity Level</Label>
              <Select value={settings.complexity} onValueChange={(value) => setSettings(prev => ({ ...prev, complexity: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Writing Perspective</Label>
              <Select value={settings.perspective} onValueChange={(value) => setSettings(prev => ({ ...prev, perspective: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first-person">First Person</SelectItem>
                  <SelectItem value="second-person">Second Person</SelectItem>
                  <SelectItem value="third-person">Third Person</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Structure Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Chapters</Label>
              <Input
                type="number"
                min="5"
                max="20"
                value={settings.chapters_count}
                onChange={(e) => setSettings(prev => ({ ...prev, chapters_count: parseInt(e.target.value) || 10 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Sections per Chapter</Label>
              <Input
                type="number"
                min="3"
                max="10"
                value={settings.sections_per_chapter}
                onChange={(e) => setSettings(prev => ({ ...prev, sections_per_chapter: parseInt(e.target.value) || 6 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Pages per Section</Label>
              <Input
                type="number"
                min="1"
                max="8"
                value={settings.pages_per_section}
                onChange={(e) => setSettings(prev => ({ ...prev, pages_per_section: parseInt(e.target.value) || 3 }))}
              />
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <Label>Features to Include</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include_toc"
                  checked={settings.include_toc}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, include_toc: !!checked }))}
                />
                <Label htmlFor="include_toc" className="text-sm">Table of Contents</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include_images"
                  checked={settings.include_images}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, include_images: !!checked }))}
                />
                <Label htmlFor="include_images" className="text-sm">AI Images</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include_bibliography"
                  checked={settings.include_bibliography}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, include_bibliography: !!checked }))}
                />
                <Label htmlFor="include_bibliography" className="text-sm">Bibliography</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include_cover"
                  checked={settings.include_cover}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, include_cover: !!checked }))}
                />
                <Label htmlFor="include_cover" className="text-sm">Cover Design</Label>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="pt-6">
            <Button 
              onClick={handleGenerate}
              disabled={loading || !credits?.sufficient || !settings.concept.trim()}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Starting Generation...
                </>
              ) : (
                <>
                  <Book className="h-4 w-4 mr-2" />
                  Generate Book ({credits?.required || 50} credits)
                </>
              )}
            </Button>
            
            {!credits?.sufficient && (
              <p className="text-sm text-red-600 text-center mt-2">
                You need more credits to generate a book.{' '}
                <a href="/pricing" className="underline">Recharge here</a>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estimated Output */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Estimated Output</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-medium">Total Pages</p>
              <p className="text-muted-foreground">
                ~{settings.chapters_count * settings.sections_per_chapter * settings.pages_per_section} pages
              </p>
            </div>
            <div>
              <p className="font-medium">Word Count</p>
              <p className="text-muted-foreground">
                ~{(settings.chapters_count * settings.sections_per_chapter * settings.pages_per_section * 300).toLocaleString()} words
              </p>
            </div>
            <div>
              <p className="font-medium">Generation Time</p>
              <p className="text-muted-foreground">15-30 minutes</p>
            </div>
            <div>
              <p className="font-medium">Output Format</p>
              <p className="text-muted-foreground">PDF + Web View</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleBookGenerator;
