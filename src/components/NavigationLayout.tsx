import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Folder, BookOpen } from 'lucide-react';
import ProjectSidebar from '@/components/ProjectSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';

interface NavigationLayoutProps {
  children: React.ReactNode;
  showProjectToggle?: boolean;
}

const NavigationLayout: React.FC<NavigationLayoutProps> = ({ 
  children, 
  showProjectToggle = true 
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Only show project sidebar for authenticated users
  const shouldShowSidebar = isAuthenticated && showProjectToggle && 
    (location.pathname.startsWith('/text') || 
     location.pathname.startsWith('/audio') || 
     location.pathname.startsWith('/video') ||
     location.pathname.startsWith('/code'));

  return (
    <div className="relative">
      {/* Project Sidebar Toggle Button - Fixed Position */}
      {shouldShowSidebar && (
        <Button
          variant="outline"
          size="sm"
          className="fixed top-20 left-4 z-40 shadow-lg"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? (
            <BookOpen className="h-4 w-4" />
          ) : (
            <Folder className="h-4 w-4" />
          )}
          <span className="ml-2 hidden sm:inline">
            {sidebarOpen ? 'Close' : 'Projects'}
          </span>
        </Button>
      )}

      {/* Project Sidebar */}
      {shouldShowSidebar && (
        <ProjectSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          className={sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        />
      )}

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen && shouldShowSidebar ? 'ml-80' : 'ml-0'}`}>
        {children}
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && shouldShowSidebar && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default NavigationLayout;
