import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

export default function DemoPage() {
  const isMobile = useIsMobile();
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            OPSBRAIN Demo 🚀
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-2">
            {isMobile ? '📱 Mobile View' : '🖥️ Desktop View'}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        
        {/* Grid Layout - Responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          
          {/* Card 1 */}
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">Revenue</h2>
            <p className="text-2xl md:text-3xl font-bold text-blue-600 mt-2">$45,231</p>
            <p className="text-sm text-gray-500 mt-2">+12.5% from last month</p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">👥</span>
            </div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">Clients</h2>
            <p className="text-2xl md:text-3xl font-bold text-green-600 mt-2">142</p>
            <p className="text-sm text-gray-500 mt-2">+8 new this week</p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">Projects</h2>
            <p className="text-2xl md:text-3xl font-bold text-purple-600 mt-2">28</p>
            <p className="text-sm text-gray-500 mt-2">5 in progress</p>
          </div>

        </div>

        {/* Button Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
            Interactive Demo
          </h3>
          <div className="flex flex-col md:flex-row gap-4">
            <button
              onClick={() => setCount(count + 1)}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Click Me: {count}
            </button>
            <button
              onClick={() => setCount(0)}
              className="w-full md:w-auto px-6 py-3 bg-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-400 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Feature List */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
            ✨ Mobile Features
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start">
              <span className="text-green-500 mr-3 text-lg">✓</span>
              <span className="text-gray-700">Responsive design - works on all devices</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-3 text-lg">✓</span>
              <span className="text-gray-700">Touch-friendly buttons and navigation</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-3 text-lg">✓</span>
              <span className="text-gray-700">Optimized spacing for small screens</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-3 text-lg">✓</span>
              <span className="text-gray-700">Fast loading and smooth animations</span>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );
}
