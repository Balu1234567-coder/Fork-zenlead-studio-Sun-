import { BaseModel, BaseContentPreset, BaseProject } from '@/components/ai-studio/AIStudioBase';
import { 
  Languages, Headphones, Wand2, Volume2, 
  BarChart3, FileDigit, FileCheck, Users,
  Book, GraduationCap, Mail, Video
} from 'lucide-react';

// Fallback data in case API is unavailable
export const fallbackAudioModels: BaseModel[] = [
  {
    key: "audio-translation",
    title: "Audio Translation",
    titletagline: "Multilingual voice conversion",
    description: "Translate audio into 20+ languages while preserving the original voice's emotion, tone, and speaking style.",
    modelName: "AudioTrans",
    modelkeywords: ["Audio Translation", "Multilingual"],
    sucessrate: 97,
    processingspeed: "Fast",
    icon: Languages,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    badge: "Popular",
    category: 'traditional',
    path: "/audio_translation"
  },
  {
    key: "voice-cloning",
    title: "Voice Cloning",
    titletagline: "AI-powered voice replication",
    description: "Create an accurate digital clone of any voice from just a few audio samples.",
    modelName: "VoiceReplicator",
    modelkeywords: ["Voice Cloning", "AI Voice"],
    sucessrate: 94,
    processingspeed: "Moderate",
    icon: Headphones,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    badge: "AI Powered",
    category: 'traditional',
    path: "/voice_cloning"
  },
  {
    key: "audio-enhancement",
    title: "Audio Enhancement",
    titletagline: "Professional audio cleanup",
    description: "Transform low-quality audio into crystal-clear recordings with advanced noise reduction.",
    modelName: "AudioClear",
    modelkeywords: ["Audio Enhancement", "Noise Reduction"],
    sucessrate: 92,
    processingspeed: "Fast",
    icon: Wand2,
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    badge: "Pro Tools",
    category: 'traditional',
    path: "/audio_enhancement"
  },
];

export const fallbackTextModels: BaseModel[] = [
  {
    key: "text-to-speech",
    title: "Text to Speech",
    titletagline: "Natural voice synthesis",
    description: "Convert text into natural-sounding speech with customizable voices and multilingual support.",
    modelName: "VoiceCraft",
    modelkeywords: ["Text-to-Speech", "Voice Synthesis"],
    sucessrate: 94,
    processingspeed: "Fast",
    icon: Volume2,
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    badge: "Popular",
    category: 'traditional',
    path: "/text_to_speech"
  },
  {
    key: "excel-to-charts",
    title: "Excel to Charts",
    titletagline: "Visualize spreadsheet data",
    description: "Transform Excel or CSV data into comprehensive audio summaries and visual charts.",
    modelName: "Excelerate",
    modelkeywords: ["Excel", "CSV"],
    sucessrate: 92,
    processingspeed: "Moderate",
    icon: BarChart3,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    badge: "Data Viz",
    category: 'traditional',
    path: "/excel_to_charts"
  },
  {
    key: "ats-score",
    title: "ATS Score",
    titletagline: "Resume optimization scoring",
    description: "Evaluate resumes against job descriptions for ATS compatibility and provide detailed improvement suggestions.",
    modelName: "ResumeRater",
    modelkeywords: ["ATS", "Resume Analysis"],
    sucessrate: 96,
    processingspeed: "Fast",
    icon: FileCheck,
    color: "from-red-500 to-red-600",
    bgColor: "bg-red-50 dark:bg-red-950/20",
    badge: "Career Boost",
    category: 'traditional',
    path: "/ats_score"
  },
];

export const fallbackVideoModels: BaseModel[] = [
  {
    key: "ai-video-creator",
    title: "AI Video Creator",
    titletagline: "Create cinematic videos from text",
    description: "Generate stunning animated videos from simple text descriptions using state-of-the-art AI technology.",
    modelName: "VideoGenix Pro",
    modelkeywords: ["Video Generation", "AI Animation"],
    sucessrate: 95,
    processingspeed: "Fast",
    icon: Video,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    badge: "AI Powered",
    category: 'traditional',
    path: "/ai_video_creator"
  },
];

export const fallbackContentPresets: BaseContentPreset[] = [
  {
    id: 'long-form-book',
    title: 'Long-form Book',
    description: 'Generate comprehensive books with chapters, cover page, images, and research references',
    icon: Book,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    estimatedTime: '15-30 minutes',
    features: ['Chapter Structure', 'Cover Design', 'Image Integration', 'Bibliography', 'Table of Contents'],
    path: "/long-form-book"
  },
  {
    id: 'course-material',
    title: 'Course Material',
    description: 'Develop comprehensive courses with lesson modules, diagrams, and assignments',
    icon: GraduationCap,
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    estimatedTime: '20-40 minutes',
    features: ['Lesson Modules', 'Interactive Exercises', 'Diagrams', 'Assessments', 'Progress Tracking'],
    path: "/course-material"
  },
  {
    id: 'research-paper',
    title: 'Research Paper',
    description: 'Create academic papers with abstract, methodology, results, citations, and appendix',
    icon: FileCheck,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    estimatedTime: '10-20 minutes',
    features: ['Abstract', 'Literature Review', 'Methodology', 'Citations', 'Appendix'],
    path: "/research-paper"
  },
  {
    id: 'professional-letter',
    title: 'Professional Letter',
    description: 'Craft formal and informal letters with custom branding and formatting',
    icon: Mail,
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    estimatedTime: '2-5 minutes',
    features: ['Letterhead', 'Formal Structure', 'Custom Branding', 'Multiple Formats', 'Templates'],
    path: "/professional-letter"
  }
];

export const getFallbackData = (category: string) => {
  switch (category) {
    case 'audio':
      return {
        models: fallbackAudioModels,
        contentPresets: [],
        projects: []
      };
    case 'text':
      return {
        models: fallbackTextModels,
        contentPresets: fallbackContentPresets,
        projects: []
      };
    case 'video':
      return {
        models: fallbackVideoModels,
        contentPresets: [],
        projects: []
      };
    default:
      return {
        models: [],
        contentPresets: [],
        projects: []
      };
  }
};
