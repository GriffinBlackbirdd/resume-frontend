"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const UserMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-white"
      >
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">
            {user.full_name ? user.full_name[0].toUpperCase() : user.email[0].toUpperCase()}
          </div>
          <span className="text-sm font-medium">
            {user.full_name || user.email.split('@')[0]}
          </span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-0' : 'rotate-180'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 bottom-full mb-2 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg z-20">
            <div className="p-3 border-b border-zinc-800">
              <p className="text-sm font-medium text-white">{user.full_name || 'User'}</p>
              <p className="text-xs text-zinc-400">{user.email}</p>
            </div>
            
            <div className="py-1">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                Profile Settings
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                My Resumes
              </button>
              <hr className="my-1 border-zinc-800" />
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-zinc-800 hover:text-red-300 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};