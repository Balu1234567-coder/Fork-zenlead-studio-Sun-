import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Book, Loader2, CheckCircle } from 'lucide-react';

// Sample project data for demo
const sampleProjects = [
  {
    usage_id: 'book_demo_123',
    project_type: 'long-form-book',
    title: 'AI and Machine Learning Guide',
    status: 'completed' as const,
    created_at: new Date().toISOString(),
    url: '/ai/long-form-book/project/book_demo_123'
  },
  {
    usage_id: 'book_demo_456', 
    project_type: 'long-form-book',
    title: 'Digital Marketing Strategies',
    status: 'processing' as const,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    url: '/ai/long-form-book/project/book_demo_456'
  },
  {
    usage_id: 'book_demo_789',
    project_type: 'long-form-book', 
    title: 'Python Programming Fundamentals',
    status: 'failed' as const,
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    url: '/ai/long-form-book/project/book_demo_789'
  }
];

const ProjectUrlDemo: React.FC = () => {
  const navigate = useNavigate();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <div className="w-4 h-4 rounded-full bg-red-600" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'processing':
        return 'text-blue-600 bg-blue-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Book className="w-5 h-5" />
          Project URL Demo
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Click on any project below to test the unique URL tracking system. Each project will have a bookmarkable URL like:
          <code className="ml-1 px-1 py-0.5 bg-muted rounded text-xs">/ai/long-form-book/project/[usage_id]</code>
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {sampleProjects.map((project) => (
          <div 
            key={project.usage_id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 cursor-pointer"
            onClick={() => navigate(project.url)}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Book className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm">{project.title}</h4>
                <p className="text-xs text-muted-foreground">
                  {new Date(project.created_at).toLocaleDateString()} • ID: {project.usage_id}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-xs ${getStatusColor(project.status)}`}>
                {getStatusIcon(project.status)}
                <span className="ml-1 capitalize">{project.status}</span>
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  // Copy URL to clipboard for testing
                  navigator.clipboard.writeText(window.location.origin + project.url);
                  alert('URL copied to clipboard!');
                }}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <h5 className="font-medium text-sm mb-2">Features to test:</h5>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Click on any project to navigate to its unique URL</li>
            <li>• Bookmark the page - it should return to the same project</li>
            <li>• Refresh the page - it should stay on the same project</li>
            <li>• Use browser back/forward buttons</li>
            <li>• Share the URL with others (unique project access)</li>
            <li>• Processing projects show real-time status updates</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectUrlDemo;
