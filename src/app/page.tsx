'use client';

import { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import GoogleNewsSection from './components/GoogleNewsSection';
import TwitterSection from './components/TwitterSection';

type ViewMode = 'both' | 'google' | 'twitter';

export default function Home() {
  const [activeView, setActiveView] = useState<ViewMode>('both');
  
  // Check viewport size on mount and resize
  useEffect(() => {
    const checkIfMobile = () => {
      // setIsMobile(window.innerWidth < 768); // No longer needed
    };
    
    // Initial check
    checkIfMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  return (
    <main className="h-screen flex flex-col overflow-hidden">
      <Header />
      
      {/* Navigation bar for switching views */}
      <div className="bloomberg-nav flex justify-center">
        <button 
          className={activeView === 'both' ? 'active' : ''} 
          onClick={() => setActiveView('both')}
        >
          Latest
        </button>
        <button 
          className={activeView === 'google' ? 'active' : ''} 
          onClick={() => setActiveView('google')}
        >
          Google News
        </button>
        <button 
          className={activeView === 'twitter' ? 'active' : ''} 
          onClick={() => setActiveView('twitter')}
        >
          Twitter Updates
        </button>
      </div>
      
      {/* Content area */}
      <div className="content-area flex-grow overflow-hidden">
        <div className="fade-in h-full">
          {activeView === 'both' ? (
            <div className="side-by-side h-full">
              {/* Google News (Left Side) */}
              <div className="side-by-side-panel google-news-panel pr-6 md:pr-6 h-full flex flex-col">
                <h2 className="flex justify-center items-center text-lg font-bold mb-4 uppercase sticky top-0 z-10 py-2 text-center bg-white dark:bg-[rgb(var(--background-rgb))] border-b border-gray-200 dark:border-gray-800">
                  <span className="inline-block w-2 h-5 bg-orange-500 mr-2"></span>
                  Latest Google News
                </h2>
                <div className="overflow-y-auto flex-grow">
                  <GoogleNewsSection />
                </div>
              </div>
              
              {/* Vertical Divider */}
              <div className="hidden md:block border-l border-gray-200 dark:border-gray-700"></div>
              
              {/* Twitter Updates (Right Side) */}
              <div className="side-by-side-panel twitter-panel pl-0 md:pl-6 h-full flex flex-col">
                <h2 className="flex justify-center items-center text-lg font-bold mb-4 uppercase sticky top-0 z-10 py-2 text-center bg-white dark:bg-[rgb(var(--background-rgb))] border-b border-gray-200 dark:border-gray-800">
                  <span className="inline-block w-2 h-5 bg-orange-500 mr-2"></span>
                  Twitter Updates
                </h2>
                <div className="overflow-y-auto flex-grow">
                  <TwitterSection />
                </div>
              </div>
            </div>
          ) : activeView === 'google' ? (
            <div className="h-full flex flex-col">
              <h2 className="flex justify-center items-center text-lg font-bold mb-4 uppercase sticky top-0 z-10 py-2 text-center bg-white dark:bg-[rgb(var(--background-rgb))] border-b border-gray-200 dark:border-gray-800">
                <span className="inline-block w-2 h-5 bg-orange-500 mr-2"></span>
                Latest Google News
              </h2>
              <div className="overflow-y-auto flex-grow">
                <GoogleNewsSection />
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <h2 className="flex justify-center items-center text-lg font-bold mb-4 uppercase sticky top-0 z-10 py-2 text-center bg-white dark:bg-[rgb(var(--background-rgb))] border-b border-gray-200 dark:border-gray-800">
                <span className="inline-block w-2 h-5 bg-orange-500 mr-2"></span>
                Twitter Updates
              </h2>
              <div className="overflow-y-auto flex-grow">
                <TwitterSection />
              </div>
            </div>
          )}
        </div>
    </div>
      
      <Footer />
    </main>
  );
}
