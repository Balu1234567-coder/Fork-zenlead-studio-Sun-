import { useState } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Video } from "lucide-react";

import { AIStudioBase } from "@/components/ai-studio/AIStudioBase";
import { ModelSelectionInterface } from "@/components/ai-studio/ModelSelectionInterface";
import { ModelPage } from "@/components/ai-studio/ModelPage";
import { ModelModal } from "@/components/ModelModal";
import { useAIModels } from "@/hooks/useAIModels";

import VideoGenerationEnhanced from "@/components/video-processing/VideoGenerationEnhanced";

export interface VideoProcessingState {
  prompt: string;
  setPrompt: (prompt: string) => void;
  isGenerating: boolean;
  setIsGenerating: (isGenerating: boolean) => void;
}

const VideoProcessing = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch video models from API
  const { 
    models: traditionalModels, 
    contentPresets: videoContentPresets, 
    projects, 
    loading, 
    error 
  } = useAIModels('video');

  // Traditional model state - persistent settings
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Modal state for traditional models
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const state: VideoProcessingState = {
    prompt, setPrompt, isGenerating, setIsGenerating,
  };

  // Create filter types from available models
  const filterTypes = traditionalModels.map(model => ({
    value: model.key,
    label: model.title.replace('Video ', '').replace(' Video', '')
  }));

  const lockedTabs = traditionalModels.reduce((acc, model) => {
    acc[model.key] = true;
    return acc;
  }, {} as Record<string, boolean>);

  const handleNewProject = () => {
    navigate('/video');
  };

  const handleItemSelect = (item: any, type: 'traditional' | 'content-generation') => {
    if (type === 'traditional') {
      const model = item;
      navigate(`/video${model.path}`);
    } else {
      const preset = item;
      navigate(`/video${preset.path}`);
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
      case "ai-video-creator":
      case "video-generation":
        return <VideoGenerationEnhanced />;
      default:
        return <VideoGenerationEnhanced />;
    }
  };

  // Get current model based on path
  const getCurrentModel = (path: string) => {
    const cleanPath = path.replace('/video/', '').replace('/video', '');
    return traditionalModels.find(model => 
      model.path.includes(cleanPath) || 
      model.key === cleanPath ||
      model.key.replace('-', '_') === cleanPath
    );
  };

  // Show error in a toast/banner instead of full page
  const showError = error && !loading;

  return (
    <AIStudioBase
      title="AI Video Processing Studio"
      subtitle="Video Processing"
      icon={Video}
      projects={projects}
      traditionalModels={traditionalModels}
      contentPresets={videoContentPresets}
      activeItem={null}
      activeType={null}
      onItemSelect={handleItemSelect}
      onNewProject={handleNewProject}
      filterTypes={filterTypes}
      category="video"
      loading={loading}
    >
      <Routes>
        {/* Main selection interface */}
        <Route 
          path="/" 
          element={
            <ModelSelectionInterface
              title="AI Video Processing Studio"
              subtitle="Transform your ideas into stunning animated videos with cutting-edge AI technology. Create professional content in minutes."
              traditionalModels={traditionalModels}
              contentPresets={videoContentPresets}
              basePath="/video"
              loading={loading}
            />
          } 
        />
        
        {/* Dynamic routes for traditional models */}
        {traditionalModels.map((model) => (
          <Route 
            key={model.key}
            path={model.path} 
            element={<VideoGenerationEnhanced />} 
          />
        ))}

        {/* Legacy routes for backward compatibility */}
        <Route 
          path="/video-generation" 
          element={<VideoGenerationEnhanced />} 
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

export default VideoProcessing;
