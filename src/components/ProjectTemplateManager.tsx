import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Book, 
  Sparkles,
  ArrowRight,
  Clock
} from "lucide-react";

interface Template {
  id: string;
  title: string;
  description: string;
  genre: string;
  complexity: string;
  estimatedTime: string;
  settings: any;
}

interface ProjectTemplateManagerProps {
  onTemplateSelect: (settings: any) => void;
  onQuickStart: (settings: any) => void;
}

const ProjectTemplateManager: React.FC<ProjectTemplateManagerProps> = ({
  onTemplateSelect,
  onQuickStart
}) => {
  
  const templates: Template[] = [
    {
      id: 'business-guide',
      title: 'Business Strategy Guide',
      description: 'Professional business book with comprehensive strategy frameworks',
      genre: 'business',
      complexity: 'intermediate',
      estimatedTime: '20-25 mins',
      settings: {
        concept: 'A comprehensive guide to modern business strategy and implementation',
        genre: 'business',
        target_audience: 'professionals',
        book_length: 'standard',
        tone: 'professional',
        complexity: 'intermediate',
        chapters_count: 12,
        include_images: true,
        include_toc: true
      }
    },
    {
      id: 'tech-tutorial',
      title: 'Technology Tutorial',
      description: 'Step-by-step technical guide with examples and best practices',
      genre: 'technology',
      complexity: 'beginner',
      estimatedTime: '15-20 mins',
      settings: {
        concept: 'A beginner-friendly guide to modern web development technologies',
        genre: 'technology',
        target_audience: 'beginners',
        book_length: 'standard',
        tone: 'friendly',
        complexity: 'beginner',
        chapters_count: 10,
        include_images: true,
        include_toc: true
      }
    },
    {
      id: 'educational-course',
      title: 'Educational Course Material',
      description: 'Structured learning material with exercises and assessments',
      genre: 'educational',
      complexity: 'intermediate',
      estimatedTime: '25-30 mins',
      settings: {
        concept: 'Educational course material on artificial intelligence fundamentals',
        genre: 'educational',
        target_audience: 'students',
        book_length: 'extended',
        tone: 'academic',
        complexity: 'intermediate',
        chapters_count: 15,
        include_images: true,
        include_toc: true
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Quick Start Templates</h2>
        <p className="text-muted-foreground">
          Choose a template to start generating your book with pre-configured settings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Book className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{template.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {template.description}
              </p>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{template.genre}</Badge>
                <Badge variant="outline">{template.complexity}</Badge>
              </div>
              
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {template.estimatedTime}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onTemplateSelect(template.settings)}
                  className="flex-1"
                >
                  Customize
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => onQuickStart(template.settings)}
                  className="flex-1"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Quick Start
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="font-semibold">Need something custom?</h3>
            <p className="text-sm text-muted-foreground">
              Create a book from scratch with complete control over all settings
            </p>
            <Button 
              variant="outline" 
              onClick={() => onTemplateSelect({})}
            >
              <Book className="h-4 w-4 mr-2" />
              Start From Scratch
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectTemplateManager;
