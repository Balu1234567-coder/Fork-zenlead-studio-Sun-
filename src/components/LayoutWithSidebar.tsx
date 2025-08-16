import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import ProjectSidebar from '@/components/ProjectSidebar';
import { Button } from '@/components/ui/button';
import { PanelLeft, PanelLeftClose } from 'lucide-react';

interface LayoutWithSidebarProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

const LayoutWithSidebar: React.FC<LayoutWithSidebarProps> = ({ 
  children, 
  showSidebar = true 
}) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Auto-hide sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) { // lg breakpoint
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize(); // Check initial size
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  // Determine if we should show the sidebar based on the route
  const shouldShowSidebar = showSidebar && (
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/app') ||
    location.pathname.startsWith('/ai/') ||
    location.pathname.startsWith('/book-') ||
    location.pathname.startsWith('/audio') ||
    location.pathname.startsWith('/video') ||
    location.pathname.startsWith('/text')
  );

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    if (!sidebarCollapsed) {
      setSidebarOpen(true); // Ensure sidebar is open when expanding
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="flex flex-1 relative">
        {/* Sidebar Toggle Button (Mobile) */}
        {shouldShowSidebar && (
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSidebar}
            className={`fixed top-20 z-50 lg:hidden transition-all duration-200 ${
              sidebarOpen ? 'left-72' : 'left-4'
            }`}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* Desktop Sidebar Collapse Toggle */}
        {shouldShowSidebar && (
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSidebarCollapse}
            className={`fixed top-20 z-40 hidden lg:flex transition-all duration-200 ${
              sidebarCollapsed ? 'left-16' : 'left-72'
            }`}
          >
            {sidebarCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* Sidebar */}
        {shouldShowSidebar && (
          <>
            {/* Mobile overlay */}
            {sidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}
            
            {/* Sidebar */}
            <div className={`
              fixed top-16 left-0 bottom-0 z-50 lg:relative lg:top-0 
              transform transition-transform duration-200 ease-in-out lg:transform-none
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
              <ProjectSidebar 
                isCollapsed={sidebarCollapsed && sidebarOpen}
                onToggle={toggleSidebarCollapse}
              />
            </div>
          </>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default LayoutWithSidebar;
