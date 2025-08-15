import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Book, 
  Link, 
  RefreshCw, 
  Eye, 
  Share2, 
  Copy,
  CheckCircle,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProjectUtils } from '@/lib/projectUtils';
import { UrlStateManager } from '@/lib/urlStateManager';
import { useUniqueUrl } from '@/components/UniqueUrlHandler';

/**
 * URLDemo - Demonstrates the unique URL functionality for book generation
 * 
 * This component shows:
 * 1. How unique URLs are generated
 * 2. How state persists across refreshes
 * 3. How projects can be accessed via shareable links
 * 4. Local storage backup system
 */
const URLDemo: React.FC = () => {
  const { toast } = useToast();
  const { identifier, viewMode, saveState, canRefresh } = useUniqueUrl();
  
  const [demoProject, setDemoProject] = useState<any>(null);
  const [localProjects, setLocalProjects] = useState<any[]>([]);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    // Load demo data
    setCurrentUrl(window.location.href);
    loadLocalProjects();
  }, []);

  const loadLocalProjects = () => {
    const projects = ProjectUtils.getLocalProjectHistory();
    setLocalProjects(projects.slice(0, 5)); // Show recent 5
  };

  const createDemoProject = () => {
    const demoTitle = "AI-Generated Book Demo";
    const projectMeta = ProjectUtils.createProjectIdentifiers(demoTitle);
    
    const project = {
      usage_id: 'demo-' + Date.now(),
      project_uuid: projectMeta.project_uuid,
      url_slug: projectMeta.url_slug,
      project_title: demoTitle,
      unique_url: projectMeta.unique_url,
      shareable_url: projectMeta.shareable_url,
      created_at: new Date().toISOString(),
      status: 'demo',
      last_accessed: new Date().toISOString()
    };

    // Save to local storage
    ProjectUtils.saveProjectToLocalHistory(project);
    setDemoProject(project);
    loadLocalProjects();

    toast({
      title: "Demo Project Created",
      description: `Unique URL: ${project.unique_url}`,
      duration: 4000
    });
  };

  const navigateToProject = (project: any) => {
    const url = `${window.location.origin}${project.unique_url}`;
    window.open(url, '_blank');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
      duration: 2000
    });
  };

  const testRefreshPersistence = () => {
    if (demoProject) {
      // Save state
      UrlStateManager.saveGenerationState(demoProject.url_slug, {
        url_slug: demoProject.url_slug,
        project_uuid: demoProject.project_uuid,
        usage_id: demoProject.usage_id,
        status: 'processing',
        can_refresh: true,
        view_mode: 'live'
      });

      toast({
        title: "State Saved",
        description: "Try refreshing the page - your state will persist!",
        duration: 3000
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Unique URL System Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This system generates unique, refreshable URLs for book generation projects.
              Users can bookmark, share, and refresh without losing their progress.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Current URL Analysis</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Full URL:</strong> 
                  <p className="text-xs text-muted-foreground break-all">{currentUrl}</p>
                </div>
                <div>
                  <strong>Identifier:</strong> 
                  <Badge variant="outline">{identifier || 'None'}</Badge>
                </div>
                <div>
                  <strong>View Mode:</strong> 
                  <Badge variant="secondary">{viewMode || 'default'}</Badge>
                </div>
                <div>
                  <strong>Can Refresh:</strong> 
                  <Badge variant={canRefresh ? 'default' : 'destructive'}>
                    {canRefresh ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-2">Demo Project</h3>
              {demoProject ? (
                <div className="space-y-2">
                  <div>
                    <strong>Title:</strong> {demoProject.project_title}
                  </div>
                  <div>
                    <strong>URL Slug:</strong> 
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {demoProject.url_slug}
                    </code>
                  </div>
                  <div>
                    <strong>Unique URL:</strong>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="ml-2 h-6"
                      onClick={() => copyToClipboard(demoProject.unique_url, 'Unique URL')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={() => navigateToProject(demoProject)}>
                      <Eye className="h-3 w-3 mr-1" />
                      Open
                    </Button>
                    <Button size="sm" variant="outline" onClick={testRefreshPersistence}>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Test Refresh
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <Button onClick={createDemoProject}>
                    <Book className="h-4 w-4 mr-2" />
                    Create Demo Project
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            Recent Projects (Local Storage)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {localProjects.length > 0 ? (
            <div className="space-y-3">
              {localProjects.map((project, index) => (
                <div key={project.project_uuid} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{project.project_title}</div>
                    <div className="text-sm text-muted-foreground">
                      Status: <Badge variant="outline" className="text-xs">{project.status}</Badge>
                      <span className="mx-2">•</span>
                      Created: {new Date(project.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      URL: <code>{project.unique_url}</code>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(`${window.location.origin}${project.unique_url}`, 'Project URL')}
                    >
                      <Share2 className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => navigateToProject(project)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Book className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No projects in local storage yet.</p>
              <p className="text-sm">Create a demo project to see how unique URLs work!</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                URL Generation
              </h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Clean title slug + unique 8-char ID</li>
                <li>• Pattern: /book-title-abc12345</li>
                <li>• Collision-resistant UUIDs</li>
                <li>• SEO-friendly structure</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                State Persistence
              </h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Local storage backup</li>
                <li>• Backend state resolution</li>
                <li>• Refresh-safe design</li>
                <li>• Progressive recovery</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                URL Parameters
              </h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• ?view=live (live generation)</li>
                <li>• ?view=viewer (read-only)</li>
                <li>• ?action=resume (resume paused)</li>
                <li>• ?shared=true (shared access)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Features
              </h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Bookmark-able links</li>
                <li>• Shareable projects</li>
                <li>• Network resilience</li>
                <li>• Quick access sidebar</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default URLDemo;
