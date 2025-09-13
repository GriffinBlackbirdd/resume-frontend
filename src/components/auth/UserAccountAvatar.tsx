"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { User, Settings, LogOut, Briefcase } from 'lucide-react';

interface UserAccountAvatarProps {
  className?: string;
}

export const UserAccountAvatar: React.FC<UserAccountAvatarProps> = ({ className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const getInitials = (name: string, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email[0].toUpperCase();
  };

  const displayName = user.full_name || user.email.split('@')[0];
  const initials = getInitials(user.full_name || '', user.email);

  return (
    <div className={`relative ${className}`}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1 rounded-lg hover:bg-zinc-800/50 transition-colors"
      >
        {/* Avatar Circle */}
        <div className="relative">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold ring-2 ring-zinc-700 hover:ring-zinc-600 transition-all">
            {initials}
          </div>
          {/* Online indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900"></div>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-72 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 bg-gradient-to-r from-zinc-800 to-zinc-900">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold ring-2 ring-zinc-700">
                  {initials}
                </div>
                <div>
                  <div className="text-white font-semibold">{displayName}</div>
                  <div className="text-zinc-400 text-sm">{user.email}</div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                onClick={() => {
                  // Handle profile settings
                  setIsOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <User className="w-4 h-4" />
                <div className="text-left">
                  <div className="text-sm font-medium">Profile Settings</div>
                  <div className="text-xs text-zinc-500">Manage your account</div>
                </div>
              </button>

              <button
                onClick={() => {
                  // Handle resume management
                  setIsOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <Briefcase className="w-4 h-4" />
                <div className="text-left">
                  <div className="text-sm font-medium">My Resumes</div>
                  <div className="text-xs text-zinc-500">View all resumes</div>
                </div>
              </button>

              <button
                onClick={() => {
                  // Handle settings
                  setIsOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4" />
                <div className="text-left">
                  <div className="text-sm font-medium">Settings</div>
                  <div className="text-xs text-zinc-500">Preferences & privacy</div>
                </div>
              </button>

              <hr className="my-2 border-zinc-800" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-zinc-800 hover:text-red-300 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <div className="text-left">
                  <div className="text-sm font-medium">Sign Out</div>
                  <div className="text-xs text-red-500/70">End your session</div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};