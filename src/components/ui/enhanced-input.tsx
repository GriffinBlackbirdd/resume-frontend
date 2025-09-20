import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  success?: boolean;
  helperText?: string;
  required?: boolean;
}

export const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ label, icon, error, success, helperText, required, className, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      props.onChange?.(e);
    };

    return (
      <div className="relative">
        <div className="relative">
          {/* Icon */}
          {icon && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
              <div className={cn(
                "transition-colors duration-200",
                isFocused
                  ? "text-[#FDBA2F]"
                  : error
                  ? "text-red-500"
                  : success
                  ? "text-emerald-500"
                  : "text-mine-shaft/40 dark:text-[#E0E0E0]/40"
              )}>
                {icon}
              </div>
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            {...props}
            onChange={handleChange}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            className={cn(
              "w-full px-4 py-3 bg-vista-white dark:bg-[#1C1C1C] border-2 rounded-2xl transition-all duration-300 font-sf text-mine-shaft dark:text-[#E0E0E0] placeholder-mine-shaft/40 dark:placeholder-[#E0E0E0]/40 focus:outline-none",
              icon ? "pl-12" : "pl-4",
              error
                ? "border-red-300 focus:border-red-500"
                : success
                ? "border-emerald-300 focus:border-emerald-500"
                : "border-gray-300 dark:border-gray-600 focus:border-[#FDBA2F]",
              className
            )}
          />

          {/* Status Icon */}
          <AnimatePresence>
            {(error || success) && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center justify-center"
              >
                {error ? (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Helper Text / Error Message */}
        <AnimatePresence>
          {(error || helperText) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 px-4"
            >
              <p className={cn(
                "text-sm font-sf",
                error ? "text-red-500" : "text-mine-shaft/60 dark:text-[#E0E0E0]/60"
              )}>
                {error || helperText}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

EnhancedInput.displayName = "EnhancedInput";

interface EnhancedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  required?: boolean;
}

export const EnhancedTextarea = React.forwardRef<HTMLTextAreaElement, EnhancedTextareaProps>(
  ({ label, error, success, helperText, required, className, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      props.onChange?.(e);
    };

    return (
      <div className="relative">
        <div className="relative">
          {/* Textarea */}
          <textarea
            ref={ref}
            {...props}
            onChange={handleChange}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            className={cn(
              "w-full px-4 py-3 bg-vista-white dark:bg-[#1C1C1C] border-2 rounded-2xl transition-all duration-300 font-sf text-mine-shaft dark:text-[#E0E0E0] placeholder-mine-shaft/40 dark:placeholder-[#E0E0E0]/40 focus:outline-none resize-vertical min-h-[120px]",
              error
                ? "border-red-300 focus:border-red-500"
                : success
                ? "border-emerald-300 focus:border-emerald-500"
                : "border-gray-300 dark:border-gray-600 focus:border-[#FDBA2F]",
              className
            )}
          />

          {/* Status Icon */}
          <AnimatePresence>
            {(error || success) && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute right-4 top-4 flex items-center justify-center"
              >
                {error ? (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Helper Text / Error Message */}
        <AnimatePresence>
          {(error || helperText) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 px-4"
            >
              <p className={cn(
                "text-sm font-sf",
                error ? "text-red-500" : "text-mine-shaft/60 dark:text-[#E0E0E0]/60"
              )}>
                {error || helperText}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

EnhancedTextarea.displayName = "EnhancedTextarea";