import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Video, Sparkles, Play, Settings, Palette, Clock, Monitor, Camera, Wand2 } from "lucide-react";

const VideoGenerationEnhanced = () => {
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("15");
  const [selectedRatio, setSelectedRatio] = useState("16:9");
  const [selectedResolution, setSelectedResolution] = useState("1080p");
  const [creativityLevel, setCreativityLevel] = useState([7]);
  const [motionIntensity, setMotionIntensity] = useState([5]);

  const examplePrompts = [
    {
      category: "Nature",
      emoji: "🌅",
      text: "A serene sunset over calm ocean waves with seagulls flying gracefully in the distance",
      style: "Cinematic"
    },
    {
      category: "Urban",
      emoji: "🌃", 
      text: "A bustling city street at night with neon lights reflecting on wet pavement after rain",
      style: "Dramatic"
    },
    {
      category: "Fantasy",
      emoji: "🧚",
      text: "A magical forest with glowing fireflies and ancient trees covered in mystical light",
      style: "Mystical"
    },
    {
      category: "Sci-Fi",
      emoji: "🚀",
      text: "An astronaut exploring a colorful alien planet with multiple moons in the sky",
      style: "Futuristic"
    },
    {
      category: "Abstract",
      emoji: "🎨",
      text: "Colorful geometric shapes morphing and flowing in dynamic patterns with smooth transitions",
      style: "Artistic"
    },
    {
      category: "Business",
      emoji: "💼",
      text: "A modern office space with people collaborating on innovative projects and technology",
      style: "Professional"
    }
  ];

  const videoStyles = [
    { id: "cinematic", label: "Cinematic", desc: "Film-like quality with depth of field" },
    { id: "dramatic", label: "Dramatic", desc: "High contrast with bold lighting" },
    { id: "mystical", label: "Mystical", desc: "Ethereal and dreamlike atmosphere" },
    { id: "futuristic", label: "Futuristic", desc: "Sci-fi aesthetic with sleek design" },
    { id: "artistic", label: "Artistic", desc: "Creative and abstract visual style" },
    { id: "professional", label: "Professional", desc: "Clean and business-appropriate" },
    { id: "vintage", label: "Vintage", desc: "Retro aesthetic with film grain" },
    { id: "minimalist", label: "Minimalist", desc: "Simple and clean composition" }
  ];

  const aspectRatios = [
    { value: "16:9", label: "16:9", desc: "Widescreen (YouTube, TV)" },
    { value: "9:16", label: "9:16", desc: "Vertical (TikTok, Stories)" },
    { value: "1:1", label: "1:1", desc: "Square (Instagram)" },
    { value: "4:3", label: "4:3", desc: "Traditional (Presentations)" }
  ];

  const resolutions = [
    { value: "720p", label: "720p HD", desc: "1280x720 - Good quality" },
    { value: "1080p", label: "1080p Full HD", desc: "1920x1080 - High quality" },
    { value: "4k", label: "4K Ultra HD", desc: "3840x2160 - Premium quality" }
  ];

  const durations = [
    { value: "5", label: "5 seconds", desc: "Quick preview" },
    { value: "10", label: "10 seconds", desc: "Short clip" },
    { value: "15", label: "15 seconds", desc: "Standard duration" },
    { value: "30", label: "30 seconds", desc: "Extended clip" },
    { value: "60", label: "1 minute", desc: "Long form" }
  ];

  const advancedSettings = [
    { id: "camera-movement", label: "Camera Movement", options: ["Static", "Slow Pan", "Dynamic", "Cinematic"] },
    { id: "lighting", label: "Lighting Style", options: ["Natural", "Dramatic", "Soft", "High Contrast"] },
    { id: "color-palette", label: "Color Palette", options: ["Vibrant", "Muted", "Monochrome", "Warm", "Cool"] },
    { id: "mood", label: "Overall Mood", options: ["Calm", "Energetic", "Mysterious", "Uplifting", "Intense"] }
  ];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Video className="h-8 w-8" />
          AI Video Generation
        </h1>
        <p className="text-muted-foreground">Transform your ideas into stunning videos with AI</p>
      </div>

      {/* Main Prompt Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Describe your video
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Be specific about scenes, actions, and visual elements you want to see
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Example: A serene sunset over calm ocean waves with seagulls flying gracefully in the distance..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-32 text-base"
          />
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {prompt.length}/500 characters
            </span>
            <Button variant="outline" size="sm">
              <Wand2 className="w-4 h-4 mr-2" />
              Enhance Prompt
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Example Prompts */}
      <Card>
        <CardHeader>
          <CardTitle>Try these examples</CardTitle>
          <p className="text-sm text-muted-foreground">Click any prompt to get started</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {examplePrompts.map((example, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-md transition-all hover:scale-105 border-2 hover:border-primary/50"
                onClick={() => {
                  setPrompt(example.text);
                  setSelectedStyle(example.style.toLowerCase());
                }}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{example.emoji}</span>
                    <div>
                      <Badge variant="outline" className="text-xs">{example.category}</Badge>
                      <Badge variant="secondary" className="text-xs ml-2">{example.style}</Badge>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed">{example.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Video Style */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Visual Style
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {videoStyles.map((style) => (
              <Card
                key={style.id}
                className={`cursor-pointer transition-all ${
                  selectedStyle === style.id 
                    ? 'ring-2 ring-primary border-primary bg-primary/5' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedStyle(style.id)}
              >
                <CardContent className="p-4 text-center space-y-2">
                  <h3 className="font-semibold text-sm">{style.label}</h3>
                  <p className="text-xs text-muted-foreground">{style.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Video Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Format & Quality
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Aspect Ratio */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Aspect Ratio</label>
              <div className="grid grid-cols-2 gap-2">
                {aspectRatios.map((ratio) => (
                  <Button
                    key={ratio.value}
                    variant={selectedRatio === ratio.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedRatio(ratio.value)}
                    className="h-auto p-3 flex flex-col gap-1"
                  >
                    <span className="font-semibold">{ratio.label}</span>
                    <span className="text-xs opacity-75">{ratio.desc}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Resolution */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Resolution</label>
              <Select value={selectedResolution} onValueChange={setSelectedResolution}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {resolutions.map((res) => (
                    <SelectItem key={res.value} value={res.value}>
                      <div className="flex flex-col items-start">
                        <span>{res.label}</span>
                        <span className="text-xs text-muted-foreground">{res.desc}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Duration & Motion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Duration */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Duration</label>
              <div className="grid grid-cols-1 gap-2">
                {durations.map((duration) => (
                  <Button
                    key={duration.value}
                    variant={selectedDuration === duration.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDuration(duration.value)}
                    className="justify-start h-auto p-3"
                  >
                    <div className="flex justify-between w-full">
                      <span className="font-semibold">{duration.label}</span>
                      <span className="text-xs opacity-75">{duration.desc}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Advanced Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Creativity & Motion Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Creativity Level</label>
                <span className="text-sm text-muted-foreground">{creativityLevel[0]}/10</span>
              </div>
              <Slider
                value={creativityLevel}
                onValueChange={setCreativityLevel}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Higher values create more artistic and unexpected results
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Motion Intensity</label>
                <span className="text-sm text-muted-foreground">{motionIntensity[0]}/10</span>
              </div>
              <Slider
                value={motionIntensity}
                onValueChange={setMotionIntensity}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Controls how much movement and action appears in the video
              </p>
            </div>
          </div>

          <Separator />

          {/* Additional Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {advancedSettings.map((setting) => (
              <div key={setting.id} className="space-y-2">
                <label className="text-sm font-medium">{setting.label}</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${setting.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {setting.options.map((option) => (
                      <SelectItem key={option} value={option.toLowerCase()}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="flex flex-col items-center space-y-4">
        <Button size="lg" className="px-12 h-12">
          <Play className="mr-3 h-5 w-5" />
          Generate Video
        </Button>
        <p className="text-sm text-muted-foreground text-center">
          Estimated generation time: 2-5 minutes depending on duration and quality
        </p>
      </div>
    </div>
  );
};

export default VideoGenerationEnhanced;
