import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AudioUpload } from "@/components/AudioUpload";
import { TextInput } from "@/components/TextInput";
import { ExcelUpload } from "@/components/ExcelUpload";
import { LanguageSelector } from "@/components/LanguageSelector";
import { VoiceSelector } from "@/components/VoiceSelector";
import { LockedFeature } from "@/components/ui/locked-feature";
import { 
  Mic, 
  FileText, 
  Languages, 
  Clapperboard, 
  Book, 
  FileCheck, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  TrendingUp,
  Clock,
  Star,
  Zap,
  Users,
  BarChart3
} from "lucide-react";

const Dashboard = () => {
  const [targetLanguage, setTargetLanguage] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("");
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const modelsRef = useRef<HTMLDivElement>(null);

  const checkScroll = () => {
    if (modelsRef.current && window.innerWidth >= 768) {
      const { scrollLeft, scrollWidth, clientWidth } = modelsRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    } else {
      setCanScrollLeft(false);
      setCanScrollRight(false);
    }
  };

  const scrollModels = (direction: "left" | "right") => {
    if (modelsRef.current) {
      const scrollAmount = direction === "left" ? -250 : 250;
      modelsRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener("resize", handleResize);
    const modelsContainer = modelsRef.current;
    if (modelsContainer) {
      modelsContainer.addEventListener("scroll", checkScroll);
    }
    return () => {
      window.removeEventListener("resize", handleResize);
      if (modelsContainer) {
        modelsContainer.removeEventListener("scroll", checkScroll);
      }
    };
  }, []);

  const lockedFeatures = {
    audioTab: true,
    textTab: true,
    excelTab: true,
    videoTab: true,
  };

  const topModels = [
    {
      title: "Resume Analyser",
      description: "Upload a PDF or Word resume to get AI-driven suggestions for improvement based on job descriptions.",
      icon: FileText,
      link: "/text-processing",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-500/10",
      badge: "Popular",
      stats: "95% Success Rate"
    },
    {
      title: "Long Book Generation",
      description: "Generate a complete book or research paper (PDF) from a single topic or prompt. Perfect for comprehensive course material.",
      icon: Book,
      link: "/text-processing",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-500/10",
      badge: "AI Powered",
      stats: "Full-Length Content"
    },
    {
      title: "ATS Score",
      description: "Upload a resume and job description to calculate an ATS compatibility score, helping optimize for job applications.",
      icon: FileCheck,
      link: "/text-processing",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-500/10",
      badge: "Career Boost",
      stats: "Instant Analysis"
    },
    {
      title: "Video Generation",
      description: "Create short or long animated videos just by describing your scene. The best-in-class text-to-video AI with vibrant visuals.",
      icon: Clapperboard,
      link: "/video",
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-500/10",
      badge: "New",
      stats: "HD Quality"
    },
  ];

  const usageStats = [
    {
      title: "Audio Files",
      description: "Transform and translate your audio",
      icon: Mic,
      current: 10,
      total: 25,
      unit: "files",
      color: "bg-gradient-to-r from-blue-500 to-blue-600"
    },
    {
      title: "Text-to-Speech",
      description: "Convert text to natural speech",
      icon: FileText,
      current: 30,
      total: 50,
      unit: "minutes",
      color: "bg-gradient-to-r from-green-500 to-green-600"
    },
    {
      title: "Video Generation",
      description: "Generate animated video from a prompt",
      icon: Clapperboard,
      current: 0,
      total: 10,
      unit: "videos",
      color: "bg-gradient-to-r from-purple-500 to-purple-600"
    },
    {
      title: "Language Support",
      description: "Available languages for conversion",
      icon: Languages,
      current: 20,
      total: 20,
      unit: "languages",
      color: "bg-gradient-to-r from-orange-500 to-orange-600"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-r from-primary to-primary/80">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <Badge variant="outline" className="px-3 py-1 bg-card/50 backdrop-blur-sm border-primary/20">
              Pro Dashboard
            </Badge>
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            ZenLead Studio Dashboard
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Process audio, text, and video with advanced AI technology. Transform your ideas into reality with our powerful tools.
          </p>
        </div>

        {/* Top Models Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">🚀 Top AI Models</h2>
              <p className="text-muted-foreground">Discover our most popular and powerful AI tools</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span>Most used this week</span>
            </div>
          </div>
          
          <div className="relative">
            {canScrollLeft && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollModels("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-lg bg-card backdrop-blur-sm border-primary/20 hidden md:flex"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            
            <div
              ref={modelsRef}
              className="flex flex-col md:flex-row md:flex-nowrap overflow-x-auto scrollbar-none gap-6 py-2"
            >
              {topModels.map((model, index) => {
                const Icon = model.icon;
                return (
                  <Card 
                    key={index}
                    className={`group min-w-0 w-full md:min-w-[320px] md:flex-1 bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:scale-105 ${model.bgColor}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-r ${model.color} shadow-lg`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className="text-xs mb-1">
                            {model.badge}
                          </Badge>
                          <p className="text-xs text-primary font-medium">{model.stats}</p>
                        </div>
                      </div>
                      
                      <h3 className="font-semibold text-lg mb-2">{model.title}</h3>
                      <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                        {model.description}
                      </p>
                      
                      <Link to={model.link}>
                        <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
                          Try Now →
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            {canScrollRight && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => scrollModels("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-lg bg-card backdrop-blur-sm border-primary/20 hidden md:flex"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Usage Analytics</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {usageStats.map((stat, index) => {
              const Icon = stat.icon;
              const percentage = (stat.current / stat.total) * 100;
              
              return (
                <Card key={index} className="bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className={`p-2 rounded-lg ${stat.color} text-white`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <Badge variant="outline" className="text-xs">Pro Plan</Badge>
                    </div>
                    <CardTitle className="text-lg">{stat.title}</CardTitle>
                    <CardDescription className="text-sm">{stat.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {stat.current}/{stat.total} {stat.unit}
                        </span>
                        <span className="font-medium text-primary">{percentage.toFixed(0)}%</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Quick Actions
          </h2>
        </div>
        
        <Tabs defaultValue="audio" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-card/50 backdrop-blur-sm border border-border/50">
            <TabsTrigger value="audio" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Audio Processing
            </TabsTrigger>
            <TabsTrigger value="text" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Text to Speech
            </TabsTrigger>
            <TabsTrigger value="excel" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Excel to Audio
            </TabsTrigger>
            <TabsTrigger value="video" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Video Generation
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="audio" className="space-y-6">
            <LockedFeature isLocked={lockedFeatures.audioTab}>
              <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="h-5 w-5 text-primary" />
                    Audio Processing
                  </CardTitle>
                  <CardDescription>
                    Upload an audio file to translate, clone, or enhance with AI
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <AudioUpload onUpload={(file) => console.log(file)} />
                    </div>
                    <div className="space-y-4">
                      <LanguageSelector 
                        onChange={setTargetLanguage} 
                        label="Target Language" 
                        placeholder="Select target language..." 
                      />
                      <VoiceSelector 
                        onChange={setSelectedVoice} 
                        label="Voice Style" 
                        placeholder="Keep original or select new voice..." 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </LockedFeature>
          </TabsContent>
          
          <TabsContent value="text" className="space-y-6">
            <LockedFeature isLocked={lockedFeatures.textTab}>
              <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Text to Speech
                  </CardTitle>
                  <CardDescription>
                    Convert written text to natural-sounding audio with AI voices
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <TextInput onSubmit={(text) => console.log(text)} />
                    </div>
                    <div className="space-y-4">
                      <LanguageSelector 
                        onChange={setTargetLanguage} 
                        label="Content Language" 
                        placeholder="Select content language..." 
                      />
                      <VoiceSelector 
                        onChange={setSelectedVoice} 
                        label="Voice" 
                        placeholder="Select voice..." 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </LockedFeature>
          </TabsContent>
          
          <TabsContent value="excel" className="space-y-6">
            <LockedFeature isLocked={lockedFeatures.excelTab}>
              <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Excel to Audio
                  </CardTitle>
                  <CardDescription>
                    Convert spreadsheet data to spoken audio for accessibility
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <ExcelUpload onUpload={(file) => console.log(file)} />
                    </div>
                    <div className="space-y-4">
                      <LanguageSelector 
                        onChange={setTargetLanguage} 
                        label="Content Language" 
                        placeholder="Select content language..." 
                      />
                      <VoiceSelector 
                        onChange={setSelectedVoice} 
                        label="Voice" 
                        placeholder="Select voice..." 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </LockedFeature>
          </TabsContent>

          <TabsContent value="video" className="space-y-6">
            <LockedFeature isLocked={lockedFeatures.videoTab}>
              <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clapperboard className="h-5 w-5 text-primary" />
                    Video Generation
                  </CardTitle>
                  <CardDescription>
                    Describe your scene and generate an animated video with AI
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <Badge className="mb-4 bg-gradient-to-r from-primary to-purple-600 text-primary-foreground">
                      <Sparkles className="h-3 w-3 mr-1" />
                      New Feature
                    </Badge>
                    <p className="text-muted-foreground mb-6">
                      Create short animated videos by providing a descriptive prompt. Our AI will bring your vision to life.
                    </p>
                    <Link to="/video">
                      <Button size="lg" className="w-full md:w-auto h-12 px-8 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 transition-all duration-300 shadow-lg hover:shadow-xl">
                        Go to Video Generation
                        <Clapperboard className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </LockedFeature>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
