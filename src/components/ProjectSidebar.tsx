import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Project, 
  ProjectType, 
  ProjectStatus, 
  ProjectGroup,
  PROJECT_TYPE_CONFIG,
  PROJECT_STATUS_CONFIG 
} from '@/types/projects';
import { ProjectsApiService, ProjectUtils } from '@/lib/projectsApiService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Eye,
  Copy,
  Trash2,
  Download,
  StopCircle,
  RefreshCw,
  Book,
  Image,
  AudioWaveform,
  Video,
  FileText,
  Mic,
  Volume2,
  GraduationCap,
  Mail,
  Loader2,
  CheckCircle,
  XCircle,
  Ban,
  Clock
} from 'lucide-react';

// Icon mapping
const iconMap = {
  Book, Image, AudioWaveform, Video, FileText, Mic, Volume2, GraduationCap, Mail,
  Search, Loader2, CheckCircle, XCircle, Ban, Clock
};

interface ProjectSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

interface SidebarState {
  projects: Project[];
  projectGroups: ProjectGroup[];
  loading: boolean;
  searchQuery: string;
  selectedTypes: ProjectType[];
  selectedStatuses: ProjectStatus[];
  expandedGroups: Set<ProjectType>;
  activeProjectId: string | null;
}

export const ProjectSidebar: React.FC<ProjectSidebarProps> = ({
  isOpen,
  onToggle,
  className = ''
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [state, setState] = useState<SidebarState>({
    projects: [],
    projectGroups: [],
    loading: true,
    searchQuery: '',
    selectedTypes: [],
    selectedStatuses: [],
    expandedGroups: new Set(),
    activeProjectId: null
  });

  // Load projects on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Update active project based on current URL
  useEffect(() => {
    const extractProjectIdFromUrl = () => {
      const path = location.pathname;
      
      // Extract project ID from various URL patterns
      if (path.includes('/project/')) {
        return path.split('/project/')[1]?.split('/')[0];
      }
      
      if (path.includes('/book-generation/')) {
        const slug = path.split('/book-generation/')[1]?.split('/')[0];
        // Find project by URL slug
        const project = state.projects.find(p => p.urlSlug === slug || p.id === slug);
        return project?.id || null;
      }
      
      return null;
    };

    const projectId = extractProjectIdFromUrl();
    setState(prev => ({ ...prev, activeProjectId: projectId }));
  }, [location.pathname, state.projects]);

  const loadProjects = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const response = await ProjectsApiService.getProjectsByType();
      
      if (response.success) {
        const allProjects = response.data.flatMap(group => group.projects);
        setState(prev => ({
          ...prev,
          projects: allProjects,
          projectGroups: response.data,
          loading: false
        }));
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive"
      });
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleProjectClick = (project: Project) => {
    const url = ProjectUtils.generateProjectUrl(project);
    navigate(url);
  };

  const handleNewProject = () => {
    // Show project type selection dropdown or navigate to dashboard
    navigate('/dashboard');
  };

  const handleProjectAction = async (action: string, project: Project) => {
    switch (action) {
      case 'view':
        handleProjectClick(project);
        break;
        
      case 'duplicate':
        try {
          const response = await ProjectsApiService.duplicateProject(project.id);
          if (response.success) {
            toast({
              title: "Success",
              description: "Project duplicated successfully"
            });
            loadProjects();
          }
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to duplicate project",
            variant: "destructive"
          });
        }
        break;
        
      case 'delete':
        try {
          const response = await ProjectsApiService.deleteProject(project.id);
          if (response.success) {
            toast({
              title: "Success",
              description: "Project deleted successfully"
            });
            loadProjects();
          }
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to delete project",
            variant: "destructive"
          });
        }
        break;
        
      case 'cancel':
        try {
          const response = await ProjectsApiService.cancelProject(project.id);
          if (response.success) {
            toast({
              title: "Success",
              description: "Project cancelled successfully"
            });
            loadProjects();
          }
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to cancel project",
            variant: "destructive"
          });
        }
        break;
    }
  };

  const toggleGroup = (type: ProjectType) => {
    setState(prev => {
      const newExpanded = new Set(prev.expandedGroups);
      if (newExpanded.has(type)) {
        newExpanded.delete(type);
      } else {
        newExpanded.add(type);
      }
      return { ...prev, expandedGroups: newExpanded };
    });
  };

  const filteredGroups = state.projectGroups.filter(group => {
    // Filter by selected types
    if (state.selectedTypes.length > 0 && !state.selectedTypes.includes(group.type)) {
      return false;
    }
    
    // Filter projects within group
    const filteredProjects = group.projects.filter(project => {
      // Filter by search query
      if (state.searchQuery && !project.title.toLowerCase().includes(state.searchQuery.toLowerCase())) {
        return false;
      }
      
      // Filter by selected statuses
      if (state.selectedStatuses.length > 0 && !state.selectedStatuses.includes(project.status)) {
        return false;
      }
      
      return true;
    });
    
    return filteredProjects.length > 0;
  }).map(group => ({
    ...group,
    projects: group.projects.filter(project => {
      if (state.searchQuery && !project.title.toLowerCase().includes(state.searchQuery.toLowerCase())) {
        return false;
      }
      if (state.selectedStatuses.length > 0 && !state.selectedStatuses.includes(project.status)) {
        return false;
      }
      return true;
    })
  }));

  const ProjectItem: React.FC<{ project: Project }> = ({ project }) => {
    const config = PROJECT_TYPE_CONFIG[project.type];
    const statusConfig = PROJECT_STATUS_CONFIG[project.status];
    const StatusIcon = iconMap[statusConfig.icon as keyof typeof iconMap];
    const metadata = ProjectUtils.formatMetadata(project);
    const isActive = state.activeProjectId === project.id;
    const isProcessing = ProjectUtils.isProcessing(project);

    return (
      <div 
        className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent/50 ${
          isActive ? 'bg-accent border border-border' : ''
        }`}
        onClick={() => handleProjectClick(project)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm truncate">{project.title}</h4>
            <Badge variant="outline" className={`text-xs ${statusConfig.color}`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig.displayName}
            </Badge>
          </div>
          
          {metadata.length > 0 && (
            <p className="text-xs text-muted-foreground truncate">
              {metadata.join(' • ')}
            </p>
          )}
          
          {isProcessing && project.metadata.progress !== undefined && (
            <div className="mt-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex-1 bg-secondary rounded-full h-1">
                  <div 
                    className="bg-primary h-1 rounded-full transition-all duration-300"
                    style={{ width: `${project.metadata.progress}%` }}
                  />
                </div>
                <span>{project.metadata.progress}%</span>
              </div>
              {project.metadata.currentStep && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {project.metadata.currentStep}
                </p>
              )}
            </div>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleProjectAction('view', project)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            
            {project.status === 'completed' && project.resultUrl && (
              <DropdownMenuItem onClick={() => window.open(project.resultUrl, '_blank')}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem onClick={() => handleProjectAction('duplicate', project)}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            
            {isProcessing && (
              <DropdownMenuItem onClick={() => handleProjectAction('cancel', project)}>
                <StopCircle className="h-4 w-4 mr-2" />
                Cancel
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={() => handleProjectAction('delete', project)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  const ProjectGroup: React.FC<{ group: ProjectGroup }> = ({ group }) => {
    const config = PROJECT_TYPE_CONFIG[group.type];
    const Icon = iconMap[config.icon as keyof typeof iconMap];
    const isExpanded = state.expandedGroups.has(group.type);
    const processingCount = group.projects.filter(p => ProjectUtils.isProcessing(p)).length;

    return (
      <Collapsible open={isExpanded} onOpenChange={() => toggleGroup(group.type)}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-accent/50 rounded-lg group">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${config.color}-100 text-${config.color}-600`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-sm">{config.displayName}</h3>
              <p className="text-xs text-muted-foreground">
                {group.projects.length} project{group.projects.length !== 1 ? 's' : ''}
                {processingCount > 0 && ` • ${processingCount} processing`}
              </p>
            </div>
          </div>
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </CollapsibleTrigger>
        
        <CollapsibleContent className="ml-4 space-y-1">
          {group.projects.map((project) => (
            <ProjectItem key={project.id} project={project} />
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={`w-80 border-r bg-background flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Projects</h2>
          <Button onClick={handleNewProject} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={state.searchQuery}
            onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
            className="pl-9"
          />
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-2 mt-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
                {(state.selectedTypes.length > 0 || state.selectedStatuses.length > 0) && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                    {state.selectedTypes.length + state.selectedStatuses.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Project Types</DropdownMenuLabel>
              {Object.entries(PROJECT_TYPE_CONFIG).map(([type, config]) => (
                <DropdownMenuItem
                  key={type}
                  onClick={() => {
                    setState(prev => ({
                      ...prev,
                      selectedTypes: prev.selectedTypes.includes(type as ProjectType)
                        ? prev.selectedTypes.filter(t => t !== type)
                        : [...prev.selectedTypes, type as ProjectType]
                    }));
                  }}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={state.selectedTypes.includes(type as ProjectType)}
                      readOnly
                    />
                    {config.displayName}
                  </div>
                </DropdownMenuItem>
              ))}
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              {Object.entries(PROJECT_STATUS_CONFIG).map(([status, config]) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => {
                    setState(prev => ({
                      ...prev,
                      selectedStatuses: prev.selectedStatuses.includes(status as ProjectStatus)
                        ? prev.selectedStatuses.filter(s => s !== status)
                        : [...prev.selectedStatuses, status as ProjectStatus]
                    }));
                  }}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={state.selectedStatuses.includes(status as ProjectStatus)}
                      readOnly
                    />
                    {config.displayName}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={loadProjects}
            disabled={state.loading}
          >
            <RefreshCw className={`w-4 h-4 ${state.loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      
      {/* Projects List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {state.loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No projects found</p>
              {state.searchQuery && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setState(prev => ({ ...prev, searchQuery: '' }))}
                  className="mt-2"
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <>
              {filteredGroups.map((group) => (
                <ProjectGroup key={group.type} group={group} />
              ))}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ProjectSidebar;
