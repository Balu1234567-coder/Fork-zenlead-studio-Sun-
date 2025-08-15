import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Book,
  Plus,
  Sparkles,
  BarChart3,
  FileText,
  Loader2,
  CreditCard,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EnhancedProjectDashboard from "@/components/EnhancedProjectDashboard";
import ProjectTemplateManager from "@/components/ProjectTemplateManager";
import ProjectManager from "@/components/ProjectManager";
import { EnhancedBookApiService } from "@/lib/bookApiService";

interface BookProjectsState {
  loading: boolean;
  selectedTab: string;
  creditInfo: {
    available: number;
    required: number;
    has_sufficient: boolean;
  } | null;
}

const BookProjects: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [state, setState] = useState<BookProjectsState>({
    loading: true,
    selectedTab: 'dashboard',
    creditInfo: null
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      // Check user credits
      const creditCheck = await EnhancedBookApiService.checkCredits();
      setState(prev => ({
        ...prev,
        creditInfo: {
          available: creditCheck.data.user_credits,
          required: creditCheck.data.credits_required,
          has_sufficient: creditCheck.data.has_sufficient_credits
        }
      }));
    } catch (error) {
      console.warn('Failed to load initial data:', error);
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleTemplateSelect = (settings: any) => {
    navigate('/ai-studio/long-form-book', { 
      state: { templateSettings: settings } 
    });
  };

  const handleQuickStart = async (settings: any) => {
    try {
      // Check credits before starting
      if (!state.creditInfo?.has_sufficient) {
        toast({
          title: "Insufficient Credits",
          description: `You need ${state.creditInfo?.required || 50} credits to start this project.`,
          variant: "destructive"
        });
        return;
      }

      // Start generation immediately
      navigate('/ai-studio/long-form-book', { 
        state: { 
          templateSettings: settings,
          autoStart: true 
        } 
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start quick generation",
        variant: "destructive"
      });
    }
  };

  const CreditWarning: React.FC = () => {
    if (!state.creditInfo || state.creditInfo.has_sufficient) return null;
    
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-amber-800">
                You need more credits to create new books
              </p>
              <p className="text-sm text-amber-700">
                You have {state.creditInfo.available} credits, but need {state.creditInfo.required} to generate a book.
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => window.open('/pricing', '_blank')}
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              Recharge Credits
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (state.loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Book Generation Studio</h1>
            <p className="text-muted-foreground">
              Create, manage, and track your AI-powered book projects with enhanced features
            </p>
          </div>
          <div className="flex items-center gap-3">
            {state.creditInfo && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">{state.creditInfo.available}</span> credits available
              </div>
            )}
            <Button 
              onClick={() => navigate('/ai-studio/long-form-book')}
              disabled={!state.creditInfo?.has_sufficient}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        <CreditWarning />

        <Tabs value={state.selectedTab} onValueChange={(value) => setState(prev => ({ ...prev, selectedTab: value }))} className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Book className="h-4 w-4" />
              All Projects
            </TabsTrigger>
            <TabsTrigger value="manager" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Manager
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {state.loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <EnhancedProjectDashboard />
            )}
          </TabsContent>
          
          <TabsContent value="templates" className="space-y-6">
            {state.loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <ProjectTemplateManager 
                onTemplateSelect={handleTemplateSelect}
                onQuickStart={handleQuickStart}
              />
            )}
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            {state.loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>All Projects</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EnhancedProjectDashboard />
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="manager" className="space-y-6">
            {state.loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <ProjectManager />
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default BookProjects;
