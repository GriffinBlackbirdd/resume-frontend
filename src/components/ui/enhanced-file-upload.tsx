import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Upload, File, CheckCircle, AlertCircle, X } from 'lucide-react';

interface EnhancedFileUploadProps {
  label: string;
  accept?: string;
  maxSize?: number; // in MB
  required?: boolean;
  file?: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  helperText?: string;
  className?: string;
}

export const EnhancedFileUpload: React.FC<EnhancedFileUploadProps> = ({
  label,
  accept = ".pdf",
  maxSize = 10,
  required,
  file,
  onChange,
  error,
  helperText,
  className
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [localError, setLocalError] = useState<string>("");

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }

    const acceptedTypes = accept.split(',').map(type => type.trim());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!acceptedTypes.includes(fileExtension)) {
      return `File type must be: ${accept}`;
    }

    return null;
  };

  const handleFile = (selectedFile: File) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setLocalError("");
    onChange(selectedFile);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFile(droppedFiles[0]);
    }
  }, [maxSize, accept, onChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  const removeFile = () => {
    onChange(null);
    setLocalError("");
  };

  const displayError = error || localError;
  const hasFile = !!file;

  return (
    <div className={cn("relative", className)}>
      <div className="mb-3">
        <label className="block text-sm font-sf font-medium text-mine-shaft">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>

      <motion.div
        className={cn(
          "relative border-2 border-dashed rounded-2xl transition-all duration-300 cursor-pointer group",
          hasFile
            ? "border-emerald-300 bg-emerald-50/50"
            : isDragActive
            ? "border-sunglow bg-sunglow/10"
            : displayError
            ? "border-red-300 bg-red-50/50"
            : "border-gray-300 bg-gray-50/50 hover:border-sunglow/50 hover:bg-sunglow/5"
        )}
        whileHover={{ scale: hasFile ? 1 : 1.02 }}
        whileTap={{ scale: 0.98 }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />

        <div className="relative p-8">
          <AnimatePresence mode="wait">
            {hasFile ? (
              <motion.div
                key="file-selected"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <File className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-sf font-medium text-mine-shaft">{file.name}</p>
                    <p className="text-xs text-mine-shaft/60 font-sf">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile();
                    }}
                    className="w-8 h-8 bg-red-100 hover:bg-red-200 rounded-lg flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="file-upload"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center"
              >
                <motion.div
                  className={cn(
                    "w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-colors",
                    isDragActive
                      ? "bg-sunglow/20"
                      : displayError
                      ? "bg-red-100"
                      : "bg-gray-100 group-hover:bg-sunglow/10"
                  )}
                  animate={{
                    scale: isDragActive ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <Upload className={cn(
                    "w-8 h-8 transition-colors",
                    isDragActive
                      ? "text-sunglow"
                      : displayError
                      ? "text-red-500"
                      : "text-mine-shaft/60 group-hover:text-sunglow"
                  )} />
                </motion.div>

                <div className="space-y-2">
                  <p className={cn(
                    "text-sm font-sf font-medium transition-colors",
                    isDragActive
                      ? "text-sunglow"
                      : displayError
                      ? "text-red-600"
                      : "text-mine-shaft"
                  )}>
                    {isDragActive
                      ? "Drop your file here"
                      : `Click to upload or drag and drop`
                    }
                  </p>
                  <p className="text-xs text-mine-shaft/60 font-sf">
                    {accept.toUpperCase().replace(/\./g, '')} files up to {maxSize}MB
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Drag Overlay */}
        <AnimatePresence>
          {isDragActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-sunglow/10 border-2 border-sunglow rounded-2xl flex items-center justify-center"
            >
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="w-16 h-16 bg-sunglow/20 rounded-2xl flex items-center justify-center mx-auto mb-4"
                >
                  <Upload className="w-8 h-8 text-sunglow" />
                </motion.div>
                <p className="text-sunglow font-sf font-medium">Drop your file here</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Helper Text / Error Message */}
      <AnimatePresence>
        {(displayError || helperText) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 px-2"
          >
            <div className="flex items-center space-x-2">
              {displayError && <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
              <p className={cn(
                "text-sm font-sf",
                displayError ? "text-red-500" : "text-mine-shaft/60"
              )}>
                {displayError || helperText}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};