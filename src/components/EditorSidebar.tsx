"use client";

import { useState } from 'react';
import { ChevronLeft, ChevronRight, FileText, Palette, Settings, Download, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeTab: 'yaml' | 'form';
  onTabChange: (tab: 'yaml' | 'form') => void;
  onThemeClick: () => void;
  onSaveProject: () => void;
  onDownloadPDF: () => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({
  activeTab,
  onTabChange,
  onThemeClick,
  onSaveProject,
  onDownloadPDF,
  isCollapsed,
  onToggle
}: SidebarProps) {
  return (
    <div className={cn(
      "bg-gray-900 border-r border-gray-800 transition-all duration-300 flex flex-col",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        {!isCollapsed && <h2 className="text-lg font-semibold text-white">Editor</h2>}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="p-2 space-y-1">
        <button
          onClick={() => onTabChange('yaml')}
          className={cn(
            "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
            activeTab === 'yaml'
              ? "bg-blue-600 text-white shadow-lg"
              : "text-gray-400 hover:bg-gray-800 hover:text-white"
          )}
        >
          <FileText className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>YAML Editor</span>}
        </button>

        <button
          onClick={() => onTabChange('form')}
          className={cn(
            "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
            activeTab === 'form'
              ? "bg-blue-600 text-white shadow-lg"
              : "text-gray-400 hover:bg-gray-800 hover:text-white"
          )}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>Form Builder</span>}
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-800 my-2"></div>

      {/* Actions */}
      <div className="p-2 space-y-1">
        <button
          onClick={onThemeClick}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
        >
          <Palette className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>Themes</span>}
        </button>

        <button
          onClick={onSaveProject}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
        >
          <Save className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>Save Project</span>}
        </button>

        <button
          onClick={onDownloadPDF}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
        >
          <Download className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>Download PDF</span>}
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-800 text-xs text-gray-500">
          <p>Resume Builder v1.0</p>
        </div>
      )}
    </div>
  );
}