import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { Construction } from "lucide-react";

import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import AudioProcessing from "./pages/AudioProcessing";
import TextProcessing from "./pages/TextProcessing";
import VideoProcessing from "./pages/VideoProcessing";
import Code from "./pages/Code";
import Pricing from "./pages/Pricing";
import Billing from "./pages/Billing";
import NotFound from "./pages/NotFound";
import Library from "./pages/Library";
import SignIn from "./pages/SignIn";
import CaseStudies from "./pages/CaseStudies";
import Documentation from "./pages/Documentation";
import Company from "./pages/Company";
import About from "./pages/About";
import Blog from "./pages/Blog";
import Careers from "./pages/Careers";
import Contact from "./pages/Contact";
import Legal from "./pages/Legal";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import GDPR from "./pages/GDPR";
import CancellationRefunds from "./pages/CancellationRefunds";
import TermsConditions from "./pages/TermsConditions";
import ShippingPolicy from "./pages/ShippingPolicy";
import ContactUs from "./pages/ContactUs";
import SignUp from "./pages/SignUp";
import Profile from "./pages/Profile";
import AuthCallback from "./pages/AuthCallback";
import BookProjects from "./pages/BookProjects";
import BookViewer from "./pages/BookViewer";
import EnhancedBookViewer from "./pages/EnhancedBookViewer";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute, { AuthenticatedRoute, UnauthenticatedRoute } from "./components/ProtectedRoute";
import AuthMessage from "./components/AuthMessage";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (!savedTheme) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
      localStorage.setItem('theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.classList.add(savedTheme);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <div className="min-h-screen bg-background">
              {/* <div className="w-full bg-amber-100 dark:bg-gray-800/50 text-foreground dark:text-muted-foreground text-center py-2 px-2 sm:px-4 flex items-center justify-center gap-2 text-xs sm:text-sm z-10">
                <Construction className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                <p className="font-medium">
                  App under construction: All functionalities are currently disabled. See you soon!
                </p>
              </div> */}
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/case-studies" element={<CaseStudies />} />
                <Route path="/documentation" element={<Documentation />} />
                <Route path="/company" element={<Company />} />
                <Route path="/about" element={<About />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/legal" element={<Legal />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/cookie-policy" element={<CookiePolicy />} />
                <Route path="/gdpr" element={<GDPR />} />

                {/* Razorpay Policy Routes */}
                <Route path="/cancellation-refunds" element={<CancellationRefunds />} />
                <Route path="/terms-conditions" element={<TermsConditions />} />
                <Route path="/shipping-policy" element={<ShippingPolicy />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/contact-us" element={<ContactUs />} />

                {/* Auth callback route */}
                <Route path="/auth/callback" element={<AuthCallback />} />

                {/* Authentication routes (redirect to dashboard if already authenticated) */}
                <Route
                  path="/signin"
                  element={
                    <UnauthenticatedRoute>
                      <AuthMessage>
                        <SignIn />
                      </AuthMessage>
                    </UnauthenticatedRoute>
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <UnauthenticatedRoute>
                      <AuthMessage>
                        <SignUp />
                      </AuthMessage>
                    </UnauthenticatedRoute>
                  }
                />

                {/* Protected routes (require authentication) */}
                <Route
                  path="/app"
                  element={
                    <AuthenticatedRoute>
                      <Dashboard />
                    </AuthenticatedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <AuthenticatedRoute>
                      <Dashboard />
                    </AuthenticatedRoute>
                  }
                />
                {/* Audio Processing Routes */}
                <Route
                  path="/audio"
                  element={
                    <AuthenticatedRoute>
                      <AudioProcessing />
                    </AuthenticatedRoute>
                  }
                />
                <Route
                  path="/audio/*"
                  element={
                    <AuthenticatedRoute>
                      <AudioProcessing />
                    </AuthenticatedRoute>
                  }
                />
                {/* Text Processing Routes */}
                <Route
                  path="/text"
                  element={
                    <AuthenticatedRoute>
                      <TextProcessing />
                    </AuthenticatedRoute>
                  }
                />
                <Route
                  path="/text/*"
                  element={
                    <AuthenticatedRoute>
                      <TextProcessing />
                    </AuthenticatedRoute>
                  }
                />
                <Route
                  path="/text-processing"
                  element={
                    <AuthenticatedRoute>
                      <TextProcessing />
                    </AuthenticatedRoute>
                  }
                />
                <Route
                  path="/video"
                  element={
                    <AuthenticatedRoute>
                      <VideoProcessing />
                    </AuthenticatedRoute>
                  }
                />
                <Route
                  path="/code"
                  element={
                    <AuthenticatedRoute>
                      <Code />
                    </AuthenticatedRoute>
                  }
                />
                <Route
                  path="/library"
                  element={
                    <AuthenticatedRoute>
                      <Library />
                    </AuthenticatedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <AuthenticatedRoute>
                      <Profile />
                    </AuthenticatedRoute>
                  }
                />
                <Route
                  path="/billing"
                  element={
                    <AuthenticatedRoute>
                      <Billing />
                    </AuthenticatedRoute>
                  }
                />

                {/* Book Projects Routes */}
                <Route
                  path="/book-projects"
                  element={
                    <AuthenticatedRoute>
                      <BookProjects />
                    </AuthenticatedRoute>
                  }
                />
                <Route
                  path="/book-generation/:urlSlug"
                  element={
                    <AuthenticatedRoute>
                      <EnhancedBookViewer />
                    </AuthenticatedRoute>
                  }
                />

                {/* Catch-all route - redirect internal routes to dashboard, others to 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
