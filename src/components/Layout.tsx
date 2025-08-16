import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import ProjectSidebar from '@/components/ProjectSidebar';
import { Button } from '@/components/ui/button';
import { PanelLeft, PanelLeftClose } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  sidebarCollapsible?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  showSidebar = true,
  sidebarCollapsible = true 
}) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
    location.pathname.startsWith('/project/') ||
    location.pathname.startsWith('/book-') ||
    location.pathname.startsWith('/audio') ||
    location.pathname.startsWith('/video') ||
    location.pathname.startsWith('/text')
  );

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="flex flex-1 relative">
        {/* Sidebar Toggle Button (Mobile) */}
        {shouldShowSidebar && sidebarCollapsible && (
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
              ${!sidebarOpen && 'lg:w-0 lg:overflow-hidden'}
            `}>
              <ProjectSidebar 
                isOpen={sidebarOpen}
                onToggle={toggleSidebar}
                className="h-full border-r"
              />
            </div>
          </>
        )}

        {/* Main Content */}
        <div className={`flex-1 flex flex-col transition-all duration-200 ${
          shouldShowSidebar && sidebarOpen ? 'lg:ml-0' : ''
        }`}>
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Layout;

// Specific layout variants for different page types
export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Layout showSidebar={true} sidebarCollapsible={true}>
    {children}
  </Layout>
);

export const ProjectLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Layout showSidebar={true} sidebarCollapsible={true}>
    {children}
  </Layout>
);

export const SimpleLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Layout showSidebar={false}>
    {children}
  </Layout>
);
