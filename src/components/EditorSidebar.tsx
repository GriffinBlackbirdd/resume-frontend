"use client";

import { useState } from 'react';
import { ChevronLeft, ChevronRight, FileText, Palette, Settings, Download, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandButton } from '@/components/ui/brand-button';
import { TextButton } from '@/components/ui/text-button';

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
        <TextButton
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </TextButton>
      </div>

      {/* Navigation Tabs */}
      <div className="p-2 space-y-1">
        <BrandButton
          variant={activeTab === 'form' ? 'primary' : 'ghost'}
          onClick={() => onTabChange('form')}
          className={cn(
            "w-full flex items-center justify-start space-x-3 px-3 py-2.5 text-sm font-medium",
            activeTab === 'form'
              ? "bg-sunglow text-mine-shaft shadow-lg"
              : "text-gray-400 hover:bg-gray-800 hover:text-white"
          )}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>Form Builder</span>}
        </BrandButton>

        <BrandButton
          variant={activeTab === 'yaml' ? 'primary' : 'ghost'}
          onClick={() => onTabChange('yaml')}
          className={cn(
            "w-full flex items-center justify-start space-x-3 px-3 py-2.5 text-sm font-medium",
            activeTab === 'yaml'
              ? "bg-sunglow text-mine-shaft shadow-lg"
              : "text-gray-400 hover:bg-gray-800 hover:text-white"
          )}
        >
          <FileText className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>YAML Editor</span>}
        </BrandButton>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-800 my-2"></div>

      {/* Actions */}
      <div className="p-2 space-y-1">
        <BrandButton
          variant="ghost"
          onClick={onThemeClick}
          className="w-full flex items-center justify-start space-x-3 px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white"
        >
          <Palette className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>Themes</span>}
        </BrandButton>

        <BrandButton
          variant="ghost"
          onClick={onSaveProject}
          className="w-full flex items-center justify-start space-x-3 px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white"
        >
          <Save className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>Save Project</span>}
        </BrandButton>

        <BrandButton
          variant="ghost"
          onClick={onDownloadPDF}
          className="w-full flex items-center justify-start space-x-3 px-3 py-2.5 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white"
        >
          <Download className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>Download PDF</span>}
        </BrandButton>
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