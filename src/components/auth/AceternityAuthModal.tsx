"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { IconBrandGithub, IconBrandGoogle } from "@tabler/icons-react";
import { useAuth } from "@/contexts/AuthContext";
import { BrandButton } from "@/components/ui/brand-button";
import { CinematicButton } from "@/components/ui/cinematic-button";
import { TextButton } from "@/components/ui/text-button";

interface AceternityAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'signup';
  onSwitchMode: () => void;
}

export const AceternityAuthModal: React.FC<AceternityAuthModalProps> = ({ 
  isOpen, 
  onClose, 
  mode, 
  onSwitchMode 
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { login, signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === 'signup') {
        const fullName = `${firstName} ${lastName}`.trim();
        await signup(email, password, fullName || undefined);
      } else {
        await login(email, password);
      }
      
      // Clear form and close modal
      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
      onClose();
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-md">
        {/* Close button */}
        <TextButton
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/70 hover:text-white z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </TextButton>

        <div className="shadow-input mx-auto w-full rounded-2xl bg-white p-6 md:p-8 dark:bg-black border border-white/10">
          <h2 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
            {mode === 'signup' ? 'Create Your Account' : 'Welcome Back'}
          </h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
            {mode === 'signup' 
              ? 'Join Alpha and start building amazing resumes with AI' 
              : 'Sign in to continue your resume building journey'
            }
          </p>

          <form className="my-8" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="mb-4 flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
                <LabelInputContainer>
                  <Label htmlFor="firstname">First name</Label>
                  <Input 
                    id="firstname" 
                    placeholder="John" 
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </LabelInputContainer>
                <LabelInputContainer>
                  <Label htmlFor="lastname">Last name</Label>
                  <Input 
                    id="lastname" 
                    placeholder="Doe" 
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </LabelInputContainer>
              </div>
            )}

            <LabelInputContainer className="mb-4">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                placeholder="your.email@example.com" 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </LabelInputContainer>

            <LabelInputContainer className="mb-6">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                placeholder="••••••••" 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </LabelInputContainer>

            {error && (
              <div className="mb-4 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                {error}
              </div>
            )}

            <CinematicButton
              variant="dynamic"
              type="submit"
              disabled={loading}
              className="w-full h-10"
            >
              {loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'} →
            </CinematicButton>

            <div className="my-6 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />

            {/* Social login placeholder */}
            <div className="flex flex-col space-y-3">
              <BrandButton
                variant="secondary"
                type="button"
                disabled
                className="flex items-center justify-start space-x-2 h-10 opacity-50 cursor-not-allowed"
              >
                <IconBrandGoogle className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  Continue with Google (Coming Soon)
                </span>
              </BrandButton>
              <BrandButton
                variant="secondary"
                type="button"
                disabled
                className="flex items-center justify-start space-x-2 h-10 opacity-50 cursor-not-allowed"
              >
                <IconBrandGithub className="h-4 w-4 text-neutral-800 dark:text-neutral-300" />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  Continue with GitHub (Coming Soon)
                </span>
              </BrandButton>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                <TextButton
                  type="button"
                  onClick={onSwitchMode}
                  color="mine-shaft"
                  className="font-medium"
                >
                  {mode === 'signup' ? 'Sign in' : 'Sign up'}
                </TextButton>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};


const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};