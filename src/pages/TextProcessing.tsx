import { useState, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";

import { AIStudioBase } from "@/components/ai-studio/AIStudioBase";
import { ModelSelectionInterface } from "@/components/ai-studio/ModelSelectionInterface";
import { ModelPage } from "@/components/ai-studio/ModelPage";
import { ModelModal } from "@/components/ModelModal";
import { useAIModels } from "@/hooks/useAIModels";

// Import existing components
import LongBook from "@/components/text-processing/long-book";
import TextToSpeech from "@/components/text-processing/text-to-speech";
import ExcelToSpeech from "@/components/text-processing/excel-to-speech";
import Summarize from "@/components/text-processing/summarize";
import AtsScore from "@/components/text-processing/ats-score";
import ResumeAnalyser from "@/components/text-processing/resume-analyser";

// Import content generation components
import BookGeneration from "@/components/text-processing/BookGeneration";
import CourseGeneration from "@/components/text-processing/CourseGeneration";
import ResearchGeneration from "@/components/text-processing/ResearchGeneration";
import LetterGeneration from "@/components/text-processing/LetterGeneration";

// Existing state interface
export interface TextProcessingState {
  text: string;
  setText: (text: string) => void;
  excelFile: File | null;
  setExcelFile: (file: File | null) => void;
  targetLanguage: string;
  setTargetLanguage: (lang: string) => void;
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
  bookPrompt: string;
  setBookPrompt: (prompt: string) => void;
  bookContent: { heading: string; content: string }[] | null;
  setBookContent: (content: { heading: string; content: string }[] | null) => void;
  isBookLoading: boolean;
  setIsBookLoading: (isLoading: boolean) => void;
  atsFile: File | null;
  setAtsFile: (file: File | null) => void;
  jobDescription: string;
  setJobDescription: (desc: string) => void;
  atsScore: number | null;
  setAtsScore: (score: number | null) => void;
  isAtsLoading: boolean;
  setAtsLoading: (isLoading: boolean) => void;
  resumeFile: File | null;
  setResumeFile: (file: File | null) => void;
  resumeJobDescription: string;
  setResumeJobDescription: (desc: string) => void;
  resumeAnalysis: { bestPractices: string[]; tailoredSuggestions: string[]; generalRecommendations: string[] } | null;
  setResumeAnalysis: (analysis: { bestPractices: string[]; tailoredSuggestions: string[]; generalRecommendations: string[] } | null) => void;
  isResumeLoading: boolean;
  setIsResumeLoading: (isLoading: boolean) => void;
}

const TextProcessing = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch models from API - all text and content models are in 'text' category
  const {
    models: textModels,
    contentPresets,
    projects,
    loading: textLoading,
    error: textError
  } = useAIModels('text');

  // Use models directly from API
  const traditionalModels = textModels;
  const finalContentPresets = contentPresets;

  // Traditional model state - persistent settings
  const [text, setText] = useState("");
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [targetLanguage, setTargetLanguage] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookPrompt, setBookPrompt] = useState("");
  const [bookContent, setBookContent] = useState<{ heading: string; content: string }[] | null>(null);
  const [isBookLoading, setIsBookLoading] = useState(false);
  const [atsFile, setAtsFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [isAtsLoading, setAtsLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeJobDescription, setResumeJobDescription] = useState("");
  const [resumeAnalysis, setResumeAnalysis] = useState<{
    bestPractices: string[];
    tailoredSuggestions: string[];
    generalRecommendations: string[];
  } | null>(null);
  const [isResumeLoading, setIsResumeLoading] = useState(false);

  // Modal state for traditional models
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const state: TextProcessingState = {
    text, setText, excelFile, setExcelFile, targetLanguage, setTargetLanguage,
    selectedVoice, setSelectedVoice, isProcessing, setIsProcessing, bookPrompt, setBookPrompt,
    bookContent, setBookContent, isBookLoading, setIsBookLoading, atsFile, setAtsFile,
    jobDescription, setJobDescription, atsScore, setAtsScore, isAtsLoading, setAtsLoading,
    resumeFile, setResumeFile, resumeJobDescription, setResumeJobDescription,
    resumeAnalysis, setResumeAnalysis, isResumeLoading, setIsResumeLoading,
  };

  // Create filter types from available models
  const filterTypes = [
    ...traditionalModels.map(model => ({
      value: model.key,
      label: model.title.replace('Text ', '').replace(' Text', '')
    })),
    ...finalContentPresets.map(preset => ({
      value: preset.id,
      label: preset.title
    }))
  ];

  const lockedTabs = traditionalModels.reduce((acc, model) => {
    acc[model.key] = true;
    return acc;
  }, {} as Record<string, boolean>);

  const handleNewProject = () => {
    navigate('/text');
  };

  const handleItemSelect = (item: any, type: 'traditional' | 'content-generation') => {
    if (type === 'traditional') {
      const model = item;
      navigate(`/text${model.path}`);
    } else {
      const preset = item;
      navigate(`/text${preset.path}`);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsFullscreen(false);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const renderModelContent = (modelKey: string) => {
    switch (modelKey) {
      case "long-book":
        return <LongBook state={state} isLocked={lockedTabs["text-to-speech"]} />;
      case "text-to-speech":
      case "text_to_speech":
        return <TextToSpeech state={state} isLocked={lockedTabs["text-to-speech"] || lockedTabs["text_to_speech"]} />;
      case "excel-to-charts":
      case "excel_to_charts":
        return <ExcelToSpeech state={state} isLocked={lockedTabs["excel-to-charts"] || lockedTabs["excel_to_charts"]} />;
      case "summarize":
        return <Summarize state={state} isLocked={lockedTabs["summarize"]} />;
      case "ats-score":
      case "ats_score":
        return <AtsScore state={state} isLocked={lockedTabs["ats-score"] || lockedTabs["ats_score"]} />;
      case "resume-analyser":
      case "resume_analyzer":
      case "resume-analyzer":
        return <ResumeAnalyser state={state} isLocked={lockedTabs["resume-analyser"] || lockedTabs["resume_analyzer"]} />;
      default:
        return null;
    }
  };

  // Get current model based on path
  const getCurrentModel = (path: string) => {
    const cleanPath = path.replace('/text/', '').replace('/text', '');
    return traditionalModels.find(model => 
      model.path.includes(cleanPath) || 
      model.key === cleanPath ||
      model.key.replace('-', '_') === cleanPath
    );
  };

  const loading = textLoading;
  const error = textError;

  // Show error in a toast/banner instead of full page
  const showError = error && !loading;

  return (
    <AIStudioBase
      title="AI Text Processing Studio"
      subtitle="Text Processing"
      icon={FileText}
      projects={projects}
      traditionalModels={traditionalModels}
      contentPresets={finalContentPresets}
      activeItem={null}
      activeType={null}
      onItemSelect={handleItemSelect}
      onNewProject={handleNewProject}
      filterTypes={filterTypes}
      category="text"
      loading={loading}
    >
      <Routes>
        {/* Main selection interface */}
        <Route 
          path="/" 
          element={
            <ModelSelectionInterface
              title="AI Text Processing Studio"
              subtitle="Transform your text with AI-powered tools and content generation. Choose your processing type to get started."
              traditionalModels={traditionalModels}
              contentPresets={finalContentPresets}
              basePath="/text"
              loading={loading}
            />
          } 
        />
        
        {/* Dynamic routes for traditional models */}
        {traditionalModels.map((model) => (
          <Route 
            key={model.key}
            path={model.path} 
            element={
              <ModelPage 
                model={model}
                backPath="/text"
              >
                {renderModelContent(model.key)}
              </ModelPage>
            } 
          />
        ))}

        {/* Content generation routes */}
        <Route
          path="/long-form-book"
          element={<BookGeneration />}
        />

        <Route
          path="/research-paper"
          element={<ResearchGeneration />}
        />

        <Route
          path="/course-material"
          element={<CourseGeneration />}
        />

        <Route
          path="/professional-letter"
          element={<LetterGeneration />}
        />

        {/* Legacy short routes for backward compatibility */}
        <Route path="/book" element={<BookGeneration />} />
        <Route path="/research" element={<ResearchGeneration />} />
        <Route path="/course" element={<CourseGeneration />} />
        <Route path="/letter" element={<LetterGeneration />} />

        {/* Legacy routes for backward compatibility */}
        <Route 
          path="/text-to-speech" 
          element={
            <ModelPage 
              model={traditionalModels.find(m => m.key.includes("text-to-speech")) || traditionalModels[0]}
              backPath="/text"
            >
              {renderModelContent("text-to-speech")}
            </ModelPage>
          } 
        />
        
        <Route 
          path="/excel-to-charts" 
          element={
            <ModelPage 
              model={traditionalModels.find(m => m.key.includes("excel")) || traditionalModels[0]}
              backPath="/text"
            >
              {renderModelContent("excel-to-charts")}
            </ModelPage>
          } 
        />
        
        <Route 
          path="/summarize" 
          element={
            <ModelPage 
              model={traditionalModels.find(m => m.key.includes("summarize")) || traditionalModels[0]}
              backPath="/text"
            >
              {renderModelContent("summarize")}
            </ModelPage>
          } 
        />
        
        <Route 
          path="/ats-score" 
          element={
            <ModelPage 
              model={traditionalModels.find(m => m.key.includes("ats")) || traditionalModels[0]}
              backPath="/text"
            >
              {renderModelContent("ats-score")}
            </ModelPage>
          } 
        />
        
        <Route 
          path="/resume-analyser" 
          element={
            <ModelPage 
              model={traditionalModels.find(m => m.key.includes("resume")) || traditionalModels[0]}
              backPath="/text"
            >
              {renderModelContent("resume-analyser")}
            </ModelPage>
          } 
        />
      </Routes>

      {/* Enhanced Modal for Traditional Tools */}
      <ModelModal
        isOpen={isModalOpen}
        onClose={closeModal}
        model={getCurrentModel(location.pathname) as any}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      >
        {renderModelContent(getCurrentModel(location.pathname)?.key || "")}
      </ModelModal>
    </AIStudioBase>
  );
};

export default TextProcessing;
