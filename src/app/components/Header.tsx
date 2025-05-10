'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function Header() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  
  // Initialize theme based on localStorage or system preference
  useEffect(() => {
    // Get saved theme or check system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set dark mode if saved as 'dark' or not saved but system prefers dark
    const shouldUseDarkMode = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDarkMode(shouldUseDarkMode);
    
    // Apply theme class to html element
    if (shouldUseDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Set current date in Bloomberg style
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    };
    setCurrentDate(date.toLocaleDateString('en-US', options));
  }, []);
  
  // Toggle theme function
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    
    // Apply theme to document
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <header>
      {/* Top header bar */}
      <div className="bg-black text-white text-xs py-1">
        <div className="container mx-auto px-4 flex justify-end items-center">
          <button 
            onClick={toggleDarkMode} 
            className="theme-toggle-btn"
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? (
              <Image src="/light.png" alt="Light Mode" width={24} height={24} className="w-6 h-6" />
            ) : (
              <Image src="/dark.png" alt="Dark Mode" width={24} height={24} className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>
      
      {/* Main header */}
      <div className="bg-black text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center">
            {/* Title section */}
            <div className="flex flex-col items-center">
              <div className="flex flex-col items-center">
                <h1 className="flex flex-col text-2xl font-bold tracking-tight leading-tight">
                  <span>INDIA-</span>
                  <span>P*KassTAN</span>
                  <span>News MONITOR</span>
                
                </h1>
              </div>
            </div>
            
            {/* Subtitle section */}
            <div className="mt-2 text-xs text-gray-400">
              <p className="uppercase tracking-wider">LATEST UPDATES ON THE ONGOING SITUATION</p>
              <p className="uppercase tracking-wider">Click on Refresh to Load tweets</p>

              <p className="text-xs text-gray-500 mt-1">{currentDate}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 