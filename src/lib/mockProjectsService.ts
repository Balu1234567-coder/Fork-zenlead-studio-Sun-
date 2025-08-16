import { Project, ProjectType, ProjectStatus, ProjectGroup } from '@/types/projects';

// Mock data for development and testing
const createMockProject = (
  id: string,
  type: ProjectType,
  title: string,
  status: ProjectStatus,
  overrides: Partial<Project> = {}
): Project => ({
  id,
  type,
  title,
  description: `A sample ${type.replace('-', ' ')} project for testing`,
  status,
  metadata: {
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    progress: status === 'processing' ? Math.floor(Math.random() * 80) + 10 : undefined,
    currentStep: status === 'processing' ? 'Generating content...' : undefined,
    estimatedTime: status === 'processing' ? Math.floor(Math.random() * 300) + 60 : undefined,
    wordCount: type === 'long-form-book' ? Math.floor(Math.random() * 50000) + 10000 : undefined,
    chapterCount: type === 'long-form-book' ? Math.floor(Math.random() * 20) + 5 : undefined,
    audioDuration: ['audio-processing', 'voice-clone', 'audio-enhance'].includes(type) 
      ? Math.floor(Math.random() * 600) + 30 : undefined,
    dimensions: type === 'image-generation' 
      ? { width: 1024, height: 1024 } : undefined,
  },
  thumbnail: type === 'image-generation' ? 'https://via.placeholder.com/150x150' : undefined,
  resultUrl: status === 'completed' ? `/results/${id}` : undefined,
  urlSlug: type === 'long-form-book' ? title.toLowerCase().replace(/\s+/g, '-') : undefined,
  projectUrl: `/ai/${type}/project/${id}`,
  settingsSnapshot: {
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
  },
  ...overrides
});

export const mockProjects: Project[] = [
  // Long-form books
  createMockProject('book-1', 'long-form-book', 'The Future of AI', 'completed'),
  createMockProject('book-2', 'long-form-book', 'Digital Marketing Guide', 'processing'),
  createMockProject('book-3', 'long-form-book', 'Python Programming Basics', 'failed'),
  createMockProject('book-4', 'long-form-book', 'Quantum Computing Explained', 'pending'),
  
  // Image generation
  createMockProject('img-1', 'image-generation', 'Abstract Art Collection', 'completed'),
  createMockProject('img-2', 'image-generation', 'Logo Design Concepts', 'processing'),
  createMockProject('img-3', 'image-generation', 'Character Portraits', 'completed'),
  
  // Audio processing
  createMockProject('audio-1', 'audio-processing', 'Podcast Episode Enhancement', 'completed'),
  createMockProject('audio-2', 'voice-clone', 'Voice Synthesis Model', 'processing'),
  createMockProject('audio-3', 'audio-enhance', 'Music Quality Improvement', 'completed'),
  
  // Video generation
  createMockProject('video-1', 'video-generation', 'Product Demo Video', 'processing'),
  createMockProject('video-2', 'video-generation', 'Animated Explainer', 'completed'),
  
  // Text processing
  createMockProject('text-1', 'course-generation', 'React Development Course', 'completed'),
  createMockProject('text-2', 'letter-generation', 'Business Proposal Letter', 'completed'),
  createMockProject('text-3', 'research-generation', 'Market Analysis Report', 'processing'),
];

export class MockProjectsService {
  private static projects = [...mockProjects];
  
  static async getAllProjects() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      data: {
        projects: this.projects,
        totalCount: this.projects.length,
        hasMore: false
      }
    };
  }
  
  static async getProjectsByType() {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const groupedProjects: Record<ProjectType, Project[]> = {} as any;
    
    // Group projects by type
    this.projects.forEach(project => {
      if (!groupedProjects[project.type]) {
        groupedProjects[project.type] = [];
      }
      groupedProjects[project.type].push(project);
    });
    
    // Convert to ProjectGroup format
    const groups: ProjectGroup[] = Object.entries(groupedProjects).map(([type, projects]) => ({
      type: type as ProjectType,
      displayName: type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      icon: 'Book', // This will be replaced by the actual icon mapping
      projects,
      totalCount: projects.length
    }));
    
    return {
      success: true,
      data: groups
    };
  }
  
  static async getProject(projectId: string) {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const project = this.projects.find(p => p.id === projectId);
    
    if (!project) {
      return {
        success: false,
        error: 'Project not found'
      };
    }
    
    return {
      success: true,
      data: project
    };
  }
  
  static async getProjectStatus(projectId: string) {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const project = this.projects.find(p => p.id === projectId);
    
    if (!project) {
      return {
        success: false,
        error: 'Project not found'
      };
    }
    
    // Simulate progress for processing projects
    if (project.status === 'processing' && project.metadata.progress !== undefined) {
      const newProgress = Math.min(100, project.metadata.progress + Math.random() * 5);
      project.metadata.progress = newProgress;
      
      if (newProgress >= 100) {
        project.status = 'completed';
        project.resultUrl = `/results/${project.id}`;
        project.metadata.progress = undefined;
        project.metadata.currentStep = undefined;
      }
    }
    
    return {
      success: true,
      data: {
        status: project.status,
        progress: project.metadata.progress,
        currentStep: project.metadata.currentStep,
        estimatedTime: project.metadata.estimatedTime
      }
    };
  }
  
  static async deleteProject(projectId: string) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const index = this.projects.findIndex(p => p.id === projectId);
    
    if (index === -1) {
      return {
        success: false,
        error: 'Project not found'
      };
    }
    
    this.projects.splice(index, 1);
    
    return {
      success: true,
      data: undefined
    };
  }
  
  static async duplicateProject(projectId: string) {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const originalProject = this.projects.find(p => p.id === projectId);
    
    if (!originalProject) {
      return {
        success: false,
        error: 'Project not found'
      };
    }
    
    const newProject: Project = {
      ...originalProject,
      id: `${originalProject.type}-${Date.now()}`,
      title: `${originalProject.title} (Copy)`,
      status: 'pending',
      metadata: {
        ...originalProject.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        progress: undefined,
        currentStep: undefined
      },
      resultUrl: undefined
    };
    
    this.projects.unshift(newProject);
    
    return {
      success: true,
      data: newProject
    };
  }
  
  static async cancelProject(projectId: string) {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const project = this.projects.find(p => p.id === projectId);
    
    if (!project) {
      return {
        success: false,
        error: 'Project not found'
      };
    }
    
    if (!['processing', 'pending'].includes(project.status)) {
      return {
        success: false,
        error: 'Cannot cancel project that is not processing'
      };
    }
    
    project.status = 'cancelled';
    project.metadata.progress = undefined;
    project.metadata.currentStep = undefined;
    project.metadata.updatedAt = new Date().toISOString();
    
    return {
      success: true,
      data: undefined
    };
  }
  
  static async updateProject(projectId: string, updates: { title?: string; description?: string }) {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const project = this.projects.find(p => p.id === projectId);
    
    if (!project) {
      return {
        success: false,
        error: 'Project not found'
      };
    }
    
    if (updates.title) project.title = updates.title;
    if (updates.description) project.description = updates.description;
    project.metadata.updatedAt = new Date().toISOString();
    
    return {
      success: true,
      data: project
    };
  }
  
  static async getProjectStats() {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const stats = {
      totalProjects: this.projects.length,
      projectsByType: {} as Record<ProjectType, number>,
      projectsByStatus: {} as Record<ProjectStatus, number>,
      recentActivity: this.projects
        .sort((a, b) => new Date(b.metadata.updatedAt).getTime() - new Date(a.metadata.updatedAt).getTime())
        .slice(0, 5)
    };
    
    // Count by type
    this.projects.forEach(project => {
      stats.projectsByType[project.type] = (stats.projectsByType[project.type] || 0) + 1;
    });
    
    // Count by status
    this.projects.forEach(project => {
      stats.projectsByStatus[project.status] = (stats.projectsByStatus[project.status] || 0) + 1;
    });
    
    return {
      success: true,
      data: stats
    };
  }
}
