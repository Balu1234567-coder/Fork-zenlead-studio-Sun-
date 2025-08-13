import { useState, ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NewProjectModal } from "@/components/NewProjectModal";
import { ProjectListSkeleton } from "@/components/ModelCardSkeleton";
import {
  Plus,
  History,
  Search,
  Menu,
  LucideIcon
} from "lucide-react";

export interface BaseProject {
  id: string;
  title: string;
  type: string;
  timestamp: string;
  status: 'draft' | 'completed' | 'processing';
  model: string;
  preview: string;
  category: 'traditional' | 'content-generation';
  section: string; // 'audio', 'text', 'video', etc.
  metadata?: Record<string, any>;
}

export interface BaseModel {
  key: string;
  title: string;
  titletagline: string;
  description: string;
  modelName: string;
  modelkeywords: string[];
  sucessrate: number;
  processingspeed: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  badge: string;
  category: 'traditional' | 'content-generation';
  path: string; // URL path for the model
}

export interface BaseContentPreset {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  estimatedTime: string;
  features: string[];
  path: string; // URL path for the preset
}

interface AIStudioBaseProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  projects: BaseProject[];
  traditionalModels: BaseModel[];
  contentPresets: BaseContentPreset[];
  activeItem: BaseModel | BaseContentPreset | null;
  activeType: 'traditional' | 'content-generation' | null;
  children: ReactNode;
  onItemSelect: (item: BaseModel | BaseContentPreset, type: 'traditional' | 'content-generation') => void;
  onNewProject: () => void;
  filterTypes: { value: string; label: string }[];
  category: string; // 'audio', 'text', 'video', etc.
  loading?: boolean;
}

export const AIStudioBase = ({
  title,
  subtitle,
  icon: StudioIcon,
  projects,
  traditionalModels,
  contentPresets,
  activeItem,
  activeType,
  children,
  onItemSelect,
  onNewProject,
  filterTypes,
  category,
  loading = false
}: AIStudioBaseProps) => {
  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // New project modal state
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  // Project history state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || project.type === filterType;
    const matchesCategory = filterCategory === "all" || project.category === filterCategory;
    const matchesSection = project.section === category;
    return matchesSearch && matchesType && matchesCategory && matchesSection;
  });

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'processing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Project History Sidebar Component
  const ProjectHistorySidebar = ({ onClose }: { onClose?: () => void }) => (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 lg:p-6 border-b flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-gradient-to-r from-primary to-primary/80">
            <StudioIcon className="h-4 w-4 lg:h-5 lg:w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-base lg:text-lg">AI Studio</h2>
            <p className="text-xs lg:text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        
        <Button className="w-full gap-2 text-sm" onClick={() => {setIsNewProjectModalOpen(true); onClose?.();}}>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="p-3 lg:p-4 border-b space-y-3 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="traditional">Traditional Tools</SelectItem>
              <SelectItem value="content-generation">Content Generation</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full text-xs">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {filterTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Project History - Scrollable with full remaining height */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="p-3 lg:p-4 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-sm">Recent Projects</h3>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-280px)] px-3 lg:px-4">
          {loading ? (
            <ProjectListSkeleton count={5} />
          ) : (
            <div className="space-y-3 pb-4">
            {filteredProjects.map((project) => {
              const traditionalModel = traditionalModels.find(m => m.key === project.type);
              const contentPreset = contentPresets.find(p => p.id === project.type);
              const item = traditionalModel || contentPreset;
              const Icon = item?.icon || StudioIcon;

              return (
                <Card
                  key={project.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onClose?.()}
                >
                  <CardContent className="p-3 lg:p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${item?.color || 'from-gray-500 to-gray-600'} text-white flex-shrink-0`}>
                        {(() => {
                          const IconComponent = Icon;
                          return <IconComponent className="h-3 w-3 lg:h-4 lg:w-4" />;
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-xs lg:text-sm truncate mb-1">{project.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{project.preview}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`text-xs ${getStatusColor(project.status)}`}>
                              {project.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {project.category === 'traditional' ? 'Tool' : 'Gen'}
                            </Badge>
                            {project.metadata?.duration && (
                              <Badge variant="outline" className="text-xs">
                                {project.metadata.duration}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(project.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredProjects.length === 0 && !loading && (
              <div className="text-center py-8">
                <StudioIcon className="h-8 w-8 lg:h-12 lg:w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No projects found</p>
              </div>
            )}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex h-[calc(100vh-64px)] relative">
        {/* Desktop Sidebar */}
        <div className="w-80 border-r bg-card/30 backdrop-blur-sm hidden lg:block h-full overflow-hidden">
          <ProjectHistorySidebar />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
          <SheetContent side="left" className="w-full sm:w-80 p-0 h-full overflow-hidden">
            <SheetHeader className="sr-only">
              <SheetTitle>Project History</SheetTitle>
            </SheetHeader>
            <ProjectHistorySidebar onClose={() => setIsMobileSidebarOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header */}
          <div className="lg:hidden border-b bg-card/50 backdrop-blur-sm p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-semibold text-lg">AI Studio</h1>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              </div>
            </div>
            <Button
              onClick={() => setIsNewProjectModalOpen(true)}
              size="sm"
              variant="outline"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New
            </Button>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto h-[calc(100vh-64px)]">
            {children}
          </div>
        </div>
      </div>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        title={title}
        traditionalModels={traditionalModels}
        contentPresets={contentPresets}
        onModelSelect={(model) => onItemSelect(model, 'traditional')}
        onPresetSelect={(preset) => onItemSelect(preset, 'content-generation')}
      />
    </div>
  );
};
