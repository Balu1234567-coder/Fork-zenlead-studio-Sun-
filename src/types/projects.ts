export type ProjectStatus = 'processing' | 'completed' | 'failed' | 'cancelled' | 'pending';

export type ProjectType = 'long-form-book' | 'image-generation' | 'audio-processing' | 'video-generation' | 'text-processing' | 'voice-clone' | 'audio-enhance' | 'course-generation' | 'letter-generation' | 'research-generation';

export interface ProjectMetadata {
  // Common metadata for all project types
  createdAt: string;
  updatedAt: string;
  duration?: number; // in milliseconds
  
  // Book-specific metadata
  wordCount?: number;
  chapterCount?: number;
  genre?: string;
  
  // Image-specific metadata
  dimensions?: { width: number; height: number };
  format?: string;
  
  // Audio-specific metadata
  audioDuration?: number; // in seconds
  format?: string;
  language?: string;
  
  // Video-specific metadata
  videoDuration?: number;
  resolution?: string;
  fps?: number;
  
  // Processing metadata
  progress?: number; // 0-100
  currentStep?: string;
  estimatedTime?: number; // in seconds
}

export interface Project {
  id: string; // This will be the usage_id from backend
  type: ProjectType;
  title: string;
  description?: string;
  status: ProjectStatus;
  metadata: ProjectMetadata;
  thumbnail?: string; // URL to thumbnail image
  resultUrl?: string; // URL to view/download result
  settingsSnapshot?: Record<string, any>; // Store the original settings used
  
  // For navigation and URLs
  urlSlug?: string; // For pretty URLs like /ai/book/my-awesome-book
  projectUrl: string; // Full URL path like /ai/long-form-book/project/abc123
}

export interface ProjectGroup {
  type: ProjectType;
  displayName: string;
  icon: string; // Icon name or component
  projects: Project[];
  totalCount: number;
}

export interface ProjectsFilter {
  type?: ProjectType[];
  status?: ProjectStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

export interface ProjectsSortOptions {
  field: 'createdAt' | 'updatedAt' | 'title' | 'status';
  direction: 'asc' | 'desc';
}

export interface ProjectsListOptions {
  filter?: ProjectsFilter;
  sort?: ProjectsSortOptions;
  pagination?: {
    page: number;
    limit: number;
  };
}

// Project type configurations for UI display
export const PROJECT_TYPE_CONFIG: Record<ProjectType, {
  displayName: string;
  icon: string;
  color: string;
  basePath: string;
  description: string;
}> = {
  'long-form-book': {
    displayName: 'Long-Form Book',
    icon: 'Book',
    color: 'blue',
    basePath: '/ai/long-form-book',
    description: 'Generate complete books with chapters and content'
  },
  'image-generation': {
    displayName: 'Image Generation',
    icon: 'Image',
    color: 'purple',
    basePath: '/ai/image',
    description: 'Create AI-generated images and artwork'
  },
  'audio-processing': {
    displayName: 'Audio Processing',
    icon: 'AudioWaveform',
    color: 'green',
    basePath: '/audio',
    description: 'Process and enhance audio files'
  },
  'video-generation': {
    displayName: 'Video Generation',
    icon: 'Video',
    color: 'red',
    basePath: '/video',
    description: 'Generate and edit videos with AI'
  },
  'text-processing': {
    displayName: 'Text Processing',
    icon: 'FileText',
    color: 'yellow',
    basePath: '/text',
    description: 'Process and generate text content'
  },
  'voice-clone': {
    displayName: 'Voice Clone',
    icon: 'Mic',
    color: 'indigo',
    basePath: '/audio/voice-clone',
    description: 'Clone and synthesize voices'
  },
  'audio-enhance': {
    displayName: 'Audio Enhancement',
    icon: 'Volume2',
    color: 'teal',
    basePath: '/audio/enhance',
    description: 'Enhance and improve audio quality'
  },
  'course-generation': {
    displayName: 'Course Generation',
    icon: 'GraduationCap',
    color: 'orange',
    basePath: '/text/course',
    description: 'Generate educational courses and content'
  },
  'letter-generation': {
    displayName: 'Letter Generation',
    icon: 'Mail',
    color: 'pink',
    basePath: '/text/letter',
    description: 'Generate professional letters and documents'
  },
  'research-generation': {
    displayName: 'Research Generation',
    icon: 'Search',
    color: 'cyan',
    basePath: '/text/research',
    description: 'Generate research papers and analysis'
  }
};

// Status configurations for UI display
export const PROJECT_STATUS_CONFIG: Record<ProjectStatus, {
  displayName: string;
  color: string;
  icon: string;
}> = {
  'processing': {
    displayName: 'Processing',
    color: 'blue',
    icon: 'Loader2'
  },
  'completed': {
    displayName: 'Completed',
    color: 'green',
    icon: 'CheckCircle'
  },
  'failed': {
    displayName: 'Failed',
    color: 'red',
    icon: 'XCircle'
  },
  'cancelled': {
    displayName: 'Cancelled',
    color: 'gray',
    icon: 'Ban'
  },
  'pending': {
    displayName: 'Pending',
    color: 'yellow',
    icon: 'Clock'
  }
};
