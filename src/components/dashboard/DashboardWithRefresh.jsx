import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardWithRefresh({ children }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (startY === 0) return;
    
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY;
    
    if (distance > 0 && window.scrollY === 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, 120));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 80) {
      setIsRefreshing(true);
      // Trigger refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      window.location.reload();
    }
    
    setStartY(0);
    setPullDistance(0);
    setIsRefreshing(false);
  };

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {pullDistance > 0 && (
        <motion.div 
          className="absolute top-0 left-0 right-0 flex justify-center items-center z-50"
          style={{ height: pullDistance }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className={`p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg ${isRefreshing ? 'animate-spin' : ''}`}>
            <RefreshCw className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </div>
        </motion.div>
      )}
      
      {children}
    </div>
  );
}