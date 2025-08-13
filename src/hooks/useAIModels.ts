import { useState, useEffect } from 'react';
import { apiService, AIModel, UsageHistory } from '@/lib/apiService';
import { BaseModel, BaseContentPreset, BaseProject } from '@/components/ai-studio/AIStudioBase';
import { getFallbackData } from '@/lib/fallbackData';
import { LucideIcon } from 'lucide-react';
import {
  Languages, Headphones, Wand2, Volume2, Mic, AudioWaveform,
  FileText, BarChart3, FileDigit, FileCheck, Users, Book,
  GraduationCap, Mail, Video, Play, Film
} from 'lucide-react';

// Icon mapping for different model types
const getIconForModel = (slug: string, category: string): LucideIcon => {
  const iconMap: Record<string, LucideIcon> = {
    // Audio models
    'audio-translation': Languages,
    'voice-cloning': Headphones,
    'audio-enhancement': Wand2,
    'text-to-speech': Volume2,
    
    // Text/Data models
    'excel-to-charts': BarChart3,
    'ats-score': FileCheck,
    'resume-analyzer': Users,
    'summarize': FileDigit,
    
    // Content models
    'long-form-book': Book,
    'research-paper': FileCheck,
    'course-material': GraduationCap,
    'professional-letter': Mail,
    
    // Video models
    'ai-video-creator': Video,
    'video-generation': Play,
  };

  return iconMap[slug] || FileText;
};

// Color mapping for different categories
const getColorForCategory = (category: string, index: number): string => {
  const colorSets = {
    audio: [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600', 
      'from-green-500 to-green-600',
      'from-orange-500 to-orange-600'
    ],
    text: [
      'from-green-500 to-green-600',
      'from-blue-500 to-blue-600',
      'from-orange-500 to-orange-600',
      'from-red-500 to-red-600',
      'from-indigo-500 to-indigo-600'
    ],
    content: [
      'from-purple-500 to-purple-600',
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-orange-500 to-orange-600'
    ],
    video: [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600'
    ],
    image: [
      'from-pink-500 to-pink-600',
      'from-purple-500 to-purple-600'
    ]
  };

  const colors = colorSets[category as keyof typeof colorSets] || colorSets.text;
  return colors[index % colors.length];
};

const getBgColorForCategory = (category: string): string => {
  const bgColorMap: Record<string, string> = {
    audio: 'bg-blue-50 dark:bg-blue-950/20',
    text: 'bg-green-50 dark:bg-green-950/20',
    content: 'bg-purple-50 dark:bg-purple-950/20',
    video: 'bg-blue-50 dark:bg-blue-950/20',
    image: 'bg-pink-50 dark:bg-pink-950/20'
  };
  
  return bgColorMap[category] || 'bg-gray-50 dark:bg-gray-950/20';
};

// Convert API model to BaseModel format
const convertToBaseModel = (apiModel: AIModel, index: number): BaseModel => {
  const badge = apiModel.tags.find(tag => 
    ['Popular', 'AI Powered', 'Pro Tools', 'Career Boost', 'Data Viz'].includes(tag)
  ) || 'Available';

  return {
    key: apiModel.slug,
    title: apiModel.extra_info.display_name || apiModel.name,
    titletagline: apiModel.description,
    description: apiModel.extra_info.description_detail || apiModel.description,
    modelName: apiModel.name,
    modelkeywords: apiModel.extra_info.labels || apiModel.features.slice(0, 2),
    sucessrate: apiModel.success_rate,
    processingspeed: 'Fast', // Could be derived from estimated_time
    icon: getIconForModel(apiModel.slug, apiModel.category),
    color: getColorForCategory(apiModel.category, index),
    bgColor: getBgColorForCategory(apiModel.category),
    badge: badge,
    category: 'traditional' as const,
    path: `/${apiModel.slug.replace('-', '_')}`
  };
};

// Convert API model to BaseContentPreset format (for content category)
const convertToBaseContentPreset = (apiModel: AIModel, index: number): BaseContentPreset => {
  return {
    id: apiModel.slug,
    title: apiModel.extra_info.display_name || apiModel.name,
    description: apiModel.extra_info.description_detail || apiModel.description,
    icon: getIconForModel(apiModel.slug, apiModel.category),
    color: getColorForCategory(apiModel.category, index),
    bgColor: getBgColorForCategory(apiModel.category),
    estimatedTime: apiModel.estimated_time,
    features: apiModel.features,
    path: `/${apiModel.slug}`
  };
};

// Convert usage history to BaseProject format
const convertToBaseProject = (usage: UsageHistory, model: AIModel): BaseProject => {
  return {
    id: usage._id,
    title: `${model.extra_info.display_name || model.name} Project`,
    type: model.slug,
    timestamp: usage.created_at,
    status: usage.status === 'completed' ? 'completed' : 
            usage.status === 'processing' ? 'processing' : 'draft',
    model: model.name,
    preview: `Generated using ${model.name}...`,
    category: model.category === 'content' ? 'content-generation' : 'traditional',
    section: model.category === 'content' ? 'text' : model.category, // Map content to text section
    metadata: { 
      credits_used: usage.credits_used,
      has_output: usage.has_output
    }
  };
};

export const useAIModels = (category?: string) => {
  const [models, setModels] = useState<BaseModel[]>([]);
  const [contentPresets, setContentPresets] = useState<BaseContentPreset[]>([]);
  const [projects, setProjects] = useState<BaseProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch models for the specific category
        console.log(`🔍 Fetching models for category: ${category}`);
        const response = await apiService.getModelsByCategory(category || '');
        console.log('📡 API Response:', response);

        if (response.success && response.data.models) {
          const apiModels = response.data.models;
          console.log('📋 API Models received:', apiModels.length, 'models');

          // Define content generation model slugs
          const contentGenerationSlugs = [
            'long-form-book', 'research-paper', 'course-material', 'professional-letter'
          ];

          // Separate traditional models from content generation
          const traditionalModels = apiModels
            .filter(model => !contentGenerationSlugs.includes(model.slug))
            .map((model, index) => convertToBaseModel(model, index));

          const contentModels = apiModels
            .filter(model => contentGenerationSlugs.includes(model.slug))
            .map((model, index) => convertToBaseContentPreset(model, index));

          console.log('📚 Traditional models:', traditionalModels.length);
          console.log('🎨 Content models:', contentModels.length);
          console.log('📝 Content models details:', contentModels);

          setModels(traditionalModels);
          setContentPresets(contentModels);

          // Fetch usage history for projects (if user is authenticated)
          try {
            const allProjects: BaseProject[] = [];

            for (const model of apiModels) {
              try {
                const historyResponse = await apiService.getUsageHistory(model.slug, 5);
                if (historyResponse.success && historyResponse.data) {
                  const modelProjects = historyResponse.data.map(usage =>
                    convertToBaseProject(usage, model)
                  );
                  allProjects.push(...modelProjects);
                }
              } catch (error) {
                // Skip individual model history errors (likely auth issues)
                console.warn(`Could not fetch history for ${model.slug}:`, error);
              }
            }

            setProjects(allProjects);
          } catch (error) {
            console.warn('Could not fetch usage history:', error);
            setProjects([]); // Set empty projects if history fetch fails
          }
        } else {
          // If API call succeeds but no data, set empty arrays
          setModels([]);
          setContentPresets([]);
          setProjects([]);
        }
      } catch (error) {
        console.error('Error fetching AI models:', error);
        console.warn('Falling back to offline data...');

        // Use fallback data when API is unavailable
        const fallbackData = getFallbackData(category || '');
        setModels(fallbackData.models);
        setContentPresets(fallbackData.contentPresets);
        setProjects(fallbackData.projects);

        // Still set error but don't crash the UI
        setError(`API unavailable, using offline data. ${error instanceof Error ? error.message : 'Failed to fetch models'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [category]);

  return {
    models,
    contentPresets,
    projects,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      // Re-trigger the effect
      setModels([]);
      setContentPresets([]);
      setProjects([]);
    }
  };
};

export const useModelMetadata = (slug: string) => {
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!slug) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiService.getModelMetadata(slug);
        
        if (response.success) {
          setMetadata(response.data);
        }
      } catch (error) {
        console.error('Error fetching model metadata:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch metadata');
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [slug]);

  return { metadata, loading, error };
};
