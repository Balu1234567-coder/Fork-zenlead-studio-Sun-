import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus,
  Edit,
  Trash2,
  Copy,
  Save,
  X,
  Book,
  Briefcase,
  GraduationCap,
  Heart,
  Users,
  Clock,
  CreditCard,
  Star,
  FileText,
  Image as ImageIcon
} from "lucide-react";
import { ProjectTemplateManager as ProjectTemplateManagerLib, ProjectTemplate, ProjectSettings } from "@/lib/projectManagement";

interface ProjectTemplateManagerProps {
  isOpen?: boolean;
  onClose?: () => void;
  onTemplateSelect?: (template: ProjectTemplate) => void;
}

const ProjectTemplateManager: React.FC<ProjectTemplateManagerProps> = ({
  isOpen = false,
  onClose,
  onTemplateSelect
}) => {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');
  const [newTemplate, setNewTemplate] = useState<Partial<ProjectTemplate>>({
    name: '',
    description: '',
    category: 'Technical',
    is_public: false,
    tags: [],
    settings: {
      genre: 'non-fiction',
      target_audience: 'general',
      tone: 'professional',
      complexity: 'intermediate',
      chapters_count: 10,
      sections_per_chapter: 3,
      pages_per_section: 5,
      include_toc: true,
      include_images: false,
      include_bibliography: false,
      include_index: false,
      include_cover: true,
      formatting_style: 'modern'
    }
  });
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const defaultTemplates = ProjectTemplateManagerLib.getDefaultTemplates();
    setTemplates(defaultTemplates);
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'technical':
        return <FileText className="h-4 w-4" />;
      case 'business':
        return <Briefcase className="h-4 w-4" />;
      case 'education':
        return <GraduationCap className="h-4 w-4" />;
      case 'self-help':
        return <Heart className="h-4 w-4" />;
      default:
        return <Book className="h-4 w-4" />;
    }
  };

  const handleCreateTemplate = async () => {
    try {
      if (!newTemplate.name || !newTemplate.description) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }

      const template: ProjectTemplate = {
        id: `custom_${Date.now()}`,
        name: newTemplate.name!,
        description: newTemplate.description!,
        category: newTemplate.category!,
        is_public: newTemplate.is_public!,
        tags: newTemplate.tags || [],
        settings: newTemplate.settings as ProjectSettings,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // In a real app, this would save to backend
      setTemplates([...templates, template]);
      
      toast({
        title: "Success",
        description: "Template created successfully"
      });

      setIsCreating(false);
      setNewTemplate({
        name: '',
        description: '',
        category: 'Technical',
        is_public: false,
        tags: [],
        settings: {
          genre: 'non-fiction',
          target_audience: 'general',
          tone: 'professional',
          complexity: 'intermediate',
          chapters_count: 10,
          sections_per_chapter: 3,
          pages_per_section: 5,
          include_toc: true,
          include_images: false,
          include_bibliography: false,
          include_index: false,
          include_cover: true,
          formatting_style: 'modern'
        }
      });
    } catch (error) {
      console.error('Failed to create template:', error);
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      setTemplates(templates.filter(t => t.id !== templateId));
      toast({
        title: "Success",
        description: "Template deleted successfully"
      });
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive"
      });
    }
  };

  const handleDuplicateTemplate = (template: ProjectTemplate) => {
    const duplicated: ProjectTemplate = {
      ...template,
      id: `custom_${Date.now()}`,
      name: `${template.name} (Copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setTemplates([...templates, duplicated]);
    toast({
      title: "Success",
      description: "Template duplicated successfully"
    });
  };

  const TemplateCard: React.FC<{ template: ProjectTemplate }> = ({ template }) => (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getCategoryIcon(template.category)}
            <CardTitle className="text-lg">{template.name}</CardTitle>
            {template.is_public && (
              <Badge variant="secondary">Public</Badge>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDuplicateTemplate(template)}
            >
              <Copy className="h-3 w-3" />
            </Button>
            {template.id.startsWith('custom_') && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedTemplate(template);
                    setIsEditing(true);
                  }}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteTemplate(template.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{template.description}</p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <Book className="h-3 w-3" />
              {template.settings.chapters_count} chapters
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {template.settings.target_audience}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {template.settings.include_images && (
              <Badge variant="outline" className="text-xs">
                <ImageIcon className="h-2 w-2 mr-1" />
                Images
              </Badge>
            )}
            {template.settings.include_toc && (
              <Badge variant="outline" className="text-xs">TOC</Badge>
            )}
            {template.settings.include_bibliography && (
              <Badge variant="outline" className="text-xs">Bibliography</Badge>
            )}
          </div>

          <Button 
            size="sm" 
            className="w-full"
            onClick={() => onTemplateSelect?.(template)}
          >
            Use Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const TemplateForm: React.FC = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Template Name *</Label>
          <Input
            id="name"
            value={newTemplate.name || ''}
            onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
            placeholder="Enter template name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={newTemplate.category}
            onValueChange={(value) => setNewTemplate({...newTemplate, category: value})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Technical">Technical</SelectItem>
              <SelectItem value="Business">Business</SelectItem>
              <SelectItem value="Education">Education</SelectItem>
              <SelectItem value="Self-Help">Self-Help</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={newTemplate.description || ''}
          onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
          placeholder="Describe what this template is for"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="chapters">Chapters</Label>
          <Input
            id="chapters"
            type="number"
            value={newTemplate.settings?.chapters_count || 10}
            onChange={(e) => setNewTemplate({
              ...newTemplate,
              settings: {...newTemplate.settings!, chapters_count: parseInt(e.target.value)}
            })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sections">Sections per Chapter</Label>
          <Input
            id="sections"
            type="number"
            value={newTemplate.settings?.sections_per_chapter || 3}
            onChange={(e) => setNewTemplate({
              ...newTemplate,
              settings: {...newTemplate.settings!, sections_per_chapter: parseInt(e.target.value)}
            })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pages">Pages per Section</Label>
          <Input
            id="pages"
            type="number"
            value={newTemplate.settings?.pages_per_section || 5}
            onChange={(e) => setNewTemplate({
              ...newTemplate,
              settings: {...newTemplate.settings!, pages_per_section: parseInt(e.target.value)}
            })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="genre">Genre</Label>
          <Select
            value={newTemplate.settings?.genre}
            onValueChange={(value) => setNewTemplate({
              ...newTemplate,
              settings: {...newTemplate.settings!, genre: value}
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fiction">Fiction</SelectItem>
              <SelectItem value="non-fiction">Non-Fiction</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="business">Business</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="audience">Target Audience</Label>
          <Select
            value={newTemplate.settings?.target_audience}
            onValueChange={(value) => setNewTemplate({
              ...newTemplate,
              settings: {...newTemplate.settings!, target_audience: value}
            })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="academic">Academic</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="students">Students</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <Label>Features</Label>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'include_toc', label: 'Table of Contents' },
            { key: 'include_images', label: 'AI Generated Images' },
            { key: 'include_bibliography', label: 'Bibliography' },
            { key: 'include_index', label: 'Index' },
            { key: 'include_cover', label: 'Cover Design' }
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center space-x-2">
              <Switch
                id={key}
                checked={newTemplate.settings?.[key as keyof ProjectSettings] as boolean}
                onCheckedChange={(checked) => setNewTemplate({
                  ...newTemplate,
                  settings: {...newTemplate.settings!, [key]: checked}
                })}
              />
              <Label htmlFor={key}>{label}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="public"
          checked={newTemplate.is_public}
          onCheckedChange={(checked) => setNewTemplate({...newTemplate, is_public: checked})}
        />
        <Label htmlFor="public">Make this template public</Label>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleCreateTemplate} className="flex-1">
          <Save className="h-4 w-4 mr-2" />
          Save Template
        </Button>
        <Button 
          variant="outline" 
          onClick={() => {
            setIsCreating(false);
            setIsEditing(false);
          }}
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  );

  if (onClose) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Template Manager</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Template Manager</h1>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="browse">Browse Templates</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Template</CardTitle>
            </CardHeader>
            <CardContent>
              <TemplateForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {(isCreating || isEditing) && (
        <Dialog open={true} onOpenChange={() => {
          setIsCreating(false);
          setIsEditing(false);
        }}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Edit Template' : 'Create New Template'}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <TemplateForm />
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ProjectTemplateManager;
