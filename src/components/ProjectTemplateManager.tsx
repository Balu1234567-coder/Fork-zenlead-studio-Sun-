import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Copy,
  Star,
  Clock,
  ChevronRight,
  Plus,
  Tag,
  Wand2,
  Sparkles,
  BookOpen,
  Loader2,
  Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EnhancedBookApiService } from "@/lib/bookApiService";

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  genre: string;
  target_audience: string;
  estimated_time: string;
  credits_required: number;
  settings: any;
  tags: string[];
  is_featured: boolean;
  use_count: number;
  success_rate: number;
}

interface RecentProject {
  usage_id: string;
  title: string;
  status: string;
  created_at: string;
  settings: any;
  can_duplicate: boolean;
}

interface ProjectTemplateManagerProps {
  onTemplateSelect: (settings: any) => void;
  onQuickStart: (settings: any) => void;
  className?: string;
}

const ProjectTemplateManager: React.FC<ProjectTemplateManagerProps> = ({
  onTemplateSelect,
  onQuickStart,
  className = ""
}) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [customizing, setCustomizing] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');

  // Pre-built templates based on your backend model structure
  const defaultTemplates: ProjectTemplate[] = [
    {
      id: 'business-guide',
      name: 'Business Strategy Guide',
      description: 'Comprehensive business strategy and growth planning guide',
      genre: 'business',
      target_audience: 'professionals',
      estimated_time: '20-25 minutes',
      credits_required: 50,
      settings: {
        concept: 'Complete guide to developing effective business strategies for modern enterprises',
        genre: 'business',
        target_audience: 'professionals',
        book_length: 'standard',
        tone: 'professional',
        complexity: 'intermediate',
        perspective: 'third-person',
        chapters_count: 12,
        sections_per_chapter: 5,
        pages_per_section: 3,
        include_toc: true,
        include_images: true,
        include_bibliography: true,
        include_index: false,
        include_cover: true,
        author_name: 'AI Business Expert'
      },
      tags: ['business', 'strategy', 'professional'],
      is_featured: true,
      use_count: 156,
      success_rate: 94
    },
    {
      id: 'educational-tech',
      name: 'Technology Education',
      description: 'Educational technology concepts made simple',
      genre: 'educational',
      target_audience: 'students',
      estimated_time: '18-22 minutes',
      credits_required: 50,
      settings: {
        concept: 'Educational guide explaining modern technology concepts in an accessible way',
        genre: 'educational',
        target_audience: 'students',
        book_length: 'standard',
        tone: 'friendly',
        complexity: 'beginner',
        perspective: 'second-person',
        chapters_count: 10,
        sections_per_chapter: 6,
        pages_per_section: 3,
        include_toc: true,
        include_images: true,
        include_bibliography: true,
        include_index: true,
        include_cover: true,
        author_name: 'AI Education Specialist'
      },
      tags: ['education', 'technology', 'beginner-friendly'],
      is_featured: true,
      use_count: 89,
      success_rate: 91
    },
    {
      id: 'health-wellness',
      name: 'Health & Wellness Guide',
      description: 'Comprehensive wellness and healthy lifestyle guide',
      genre: 'health',
      target_audience: 'general',
      estimated_time: '25-30 minutes',
      credits_required: 50,
      settings: {
        concept: 'Complete guide to achieving optimal health and wellness through practical strategies',
        genre: 'health',
        target_audience: 'general',
        book_length: 'extended',
        tone: 'conversational',
        complexity: 'intermediate',
        perspective: 'second-person',
        chapters_count: 15,
        sections_per_chapter: 4,
        pages_per_section: 3,
        include_toc: true,
        include_images: true,
        include_bibliography: true,
        include_index: false,
        include_cover: true,
        author_name: 'AI Health Advisor'
      },
      tags: ['health', 'wellness', 'lifestyle'],
      is_featured: false,
      use_count: 234,
      success_rate: 96
    },
    {
      id: 'fiction-adventure',
      name: 'Adventure Fiction',
      description: 'Exciting adventure story with compelling characters',
      genre: 'fiction',
      target_audience: 'general',
      estimated_time: '30-35 minutes',
      credits_required: 50,
      settings: {
        concept: 'Thrilling adventure story with rich characters and engaging plot',
        genre: 'fiction',
        target_audience: 'general',
        book_length: 'extended',
        tone: 'conversational',
        complexity: 'intermediate',
        perspective: 'third-person',
        chapters_count: 18,
        sections_per_chapter: 4,
        pages_per_section: 4,
        include_toc: true,
        include_images: false,
        include_bibliography: false,
        include_index: false,
        include_cover: true,
        author_name: 'AI Storyteller'
      },
      tags: ['fiction', 'adventure', 'story'],
      is_featured: false,
      use_count: 67,
      success_rate: 88
    }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load recent projects that can be duplicated
      const history = await EnhancedBookApiService.getUserBookHistory(5, 0);
      const duplicatableProjects = history.books
        .filter((book: any) => book.status === 'completed')
        .map((book: any) => ({
          usage_id: book.usage_id,
          title: book.book_title || 'Untitled Book',
          status: book.status,
          created_at: book.created_at,
          settings: book.original_settings || {},
          can_duplicate: true
        }));

      setRecentProjects(duplicatableProjects);
      setTemplates(defaultTemplates);
    } catch (error) {
      console.warn('Failed to load template data:', error);
      setTemplates(defaultTemplates);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    onTemplateSelect(template.settings);
  };

  const handleQuickStart = async (template: ProjectTemplate) => {
    try {
      // Check credits before starting
      const creditCheck = await EnhancedBookApiService.checkCredits();
      if (!creditCheck.data.has_sufficient_credits) {
        toast({
          title: "Insufficient Credits",
        navigate('/text/long-form-book', { 
          variant: "destructive"
        });
        return;
      }

      // Start generation immediately with template settings
      onQuickStart(template.settings);
      
      toast({
        title: "Quick Start",
        description: `Starting ${template.name} generation...`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start quick generation",
        variant: "destructive"
      });
    }
  };

  const handleDuplicateProject = async (project: RecentProject) => {
    try {
      const duplicateData = await EnhancedBookApiService.getDuplicateSettings(project.usage_id);
      onTemplateSelect(duplicateData.settings);
      
      toast({
        title: "Project Duplicated",
        description: `Settings from "${project.title}" loaded successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to duplicate project",
        variant: "destructive"
      });
    }
  };

  const handleCustomizeTemplate = () => {
    if (!selectedTemplate) return;
    
    setCustomTitle(selectedTemplate.name);
    setCustomDescription(selectedTemplate.description);
    setCustomizing(true);
  };

  const handleCreateCustomProject = () => {
    if (!selectedTemplate) return;

    const customSettings = {
      ...selectedTemplate.settings,
      book_title: customTitle,
      concept: customDescription
    };

    onTemplateSelect(customSettings);
    setCustomizing(false);
    
    toast({
      title: "Custom Project Created",
      description: "Your customized project settings are ready.",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Featured Templates */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          <h2 className="text-xl font-semibold">Featured Templates</h2>
          <Badge variant="secondary" className="text-xs">Popular</Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.filter(t => t.is_featured).map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-all cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="text-xs">
                      {template.credits_required} credits
                    </Badge>
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{template.description}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-1">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {template.estimated_time}
                  </div>
                  <div className="flex items-center gap-1">
                    <Copy className="h-3 w-3" />
                    {template.use_count} uses
                  </div>
                  <div className="flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    {template.success_rate}% success
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleTemplateSelect(template)}
                    className="flex-1"
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    Customize
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleQuickStart(template)}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Quick Start
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* All Templates */}
      <div>
        <h2 className="text-xl font-semibold mb-6">All Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.filter(t => !t.is_featured).map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-all cursor-pointer group">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-sm truncate">{template.name}</h3>
                    <Badge variant="outline" className="text-xs ml-2">
                      {template.credits_required}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleTemplateSelect(template)}
                      className="flex-1 text-xs"
                    >
                      Use Template
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleQuickStart(template)}
                      className="text-xs"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Projects */}
      {recentProjects.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-6">Duplicate Recent Projects</h2>
          <div className="space-y-3">
            {recentProjects.map((project) => (
              <Card key={project.usage_id} className="hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-medium text-sm">{project.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(project.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDuplicateProject(project)}
                      disabled={!project.can_duplicate}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Customization Dialog */}
      <Dialog open={customizing} onOpenChange={setCustomizing}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Customize Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Book Title</Label>
              <Input
                id="title"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Enter your book title"
              />
            </div>
            <div>
              <Label htmlFor="description">Book Concept</Label>
              <Textarea
                id="description"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Describe what your book should be about"
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateCustomProject} className="flex-1">
                Create Project
              </Button>
              <Button variant="outline" onClick={() => setCustomizing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectTemplateManager;
