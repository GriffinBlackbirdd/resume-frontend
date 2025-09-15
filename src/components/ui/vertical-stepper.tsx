"use client";

import React, { useState, Children, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CheckCircle, Circle, ChevronRight } from 'lucide-react';

export default function VerticalStepper({
  children,
  initialStep = 1,
  onStepChange = () => {},
  onFinalStepCompleted = () => {},
  className = '',
  contentClassName = '',
  footerClassName = '',
  backButtonProps = {},
  nextButtonProps = {},
  backButtonText = 'Back',
  nextButtonText = 'Continue',
  validateStep = () => true,
  steps = [],
  ...rest
}: {
  children: React.ReactNode;
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onFinalStepCompleted?: () => void;
  className?: string;
  contentClassName?: string;
  footerClassName?: string;
  backButtonProps?: any;
  nextButtonProps?: any;
  backButtonText?: string;
  nextButtonText?: string;
  validateStep?: (step: number) => boolean;
  steps?: Array<{
    title: string;
    description?: string;
    icon?: React.ReactNode;
  }>;
}) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [direction, setDirection] = useState(0);
  const stepsArray = Children.toArray(children);
  const totalSteps = stepsArray.length;
  const isCompleted = currentStep > totalSteps;
  const isLastStep = currentStep === totalSteps;

  const updateStep = (newStep: number) => {
    setCurrentStep(newStep);
    if (newStep > totalSteps) {
      onFinalStepCompleted();
    } else {
      onStepChange(newStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      updateStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (!isLastStep && validateStep(currentStep)) {
      setDirection(1);
      updateStep(currentStep + 1);
    }
  };

  const handleComplete = () => {
    setDirection(1);
    updateStep(totalSteps + 1);
  };

  const handleStepClick = (step: number) => {
    if (step <= currentStep || validateStep(step - 1)) {
      setDirection(step > currentStep ? 1 : -1);
      updateStep(step);
    }
  };

  return (
    <motion.div
      className={cn("min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-800", className)}
      {...rest}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          className="overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex flex-col lg:flex-row min-h-[600px]">
            {/* Vertical Stepper Sidebar */}
            <div className="w-full lg:w-80 bg-gray-50 dark:bg-gray-900/50 p-6 lg:p-8">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Revamp Your Resume</h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Complete all steps to optimize your resume
                </p>
              </div>

              <div className="space-y-3 lg:space-y-4">
                {stepsArray.map((_, index) => {
                  const stepNumber = index + 1;
                  const status = currentStep === stepNumber ? 'active' : currentStep < stepNumber ? 'inactive' : 'complete';
                  const stepInfo = steps[index] || { title: `Step ${stepNumber}` };

                  return (
                    <motion.div
                      key={stepNumber}
                      initial={false}
                      animate={status}
                      className="relative"
                    >
                      <button
                        onClick={() => handleStepClick(stepNumber)}
                        disabled={status === 'inactive' && !validateStep(stepNumber - 1)}
                        className={cn(
                          "group relative w-full rounded-lg p-3 lg:p-4 text-left transition-all duration-200",
                          status === 'active'
                            ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 dark:border-blue-400"
                            : status === 'complete'
                            ? "bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-400"
                            : "bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
                          status === 'inactive' && !validateStep(stepNumber - 1) && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-start space-x-3">
                          <motion.div
                            variants={{
                              inactive: { scale: 1 },
                              active: { scale: 1.1 },
                              complete: { scale: 1 }
                            }}
                            transition={{ duration: 0.2 }}
                          >
                            {status === 'complete' ? (
                              <CheckCircle className="h-6 w-6 text-green-500 dark:text-green-400" />
                            ) : status === 'active' ? (
                              <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                                <span className="text-xs font-bold text-white">{stepNumber}</span>
                              </div>
                            ) : (
                              <Circle className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                            )}
                          </motion.div>

                          <div className="flex-1 min-w-0">
                            <motion.h3
                              variants={{
                                inactive: { color: '#9ca3af' },
                                active: { color: '#1f2937' },
                                complete: { color: '#059669' }
                              }}
                              className={cn(
                                "text-sm font-semibold transition-colors",
                                status === 'active'
                                  ? "text-gray-900 dark:text-white"
                                  : status === 'complete'
                                  ? "text-green-700 dark:text-green-400"
                                  : "text-gray-500 dark:text-gray-400"
                              )}
                            >
                              {stepInfo.title}
                            </motion.h3>
                            {stepInfo.description && (
                              <p className={cn(
                                "mt-1 text-xs transition-colors",
                                status === 'active'
                                  ? "text-gray-700 dark:text-gray-300"
                                  : "text-gray-500 dark:text-gray-400"
                              )}>
                                {stepInfo.description}
                              </p>
                            )}
                          </div>

                          {status === 'active' && (
                            <motion.div
                              animate={{ x: [0, 4, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            >
                              <ChevronRight className="h-5 w-5 text-blue-500" />
                            </motion.div>
                          )}
                        </div>
                      </button>

                      {/* Connector Line */}
                      {index < stepsArray.length - 1 && (
                        <div className="absolute left-8 top-12 h-6 w-0.5 bg-gray-200 dark:bg-gray-700">
                          <motion.div
                            className="h-full bg-green-500"
                            initial={{ height: 0 }}
                            animate={{ height: status === 'complete' ? '100%' : '0%' }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Progress Indicator */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {Math.round(((currentStep - 1) / totalSteps) * 100)}%
                  </span>
                </div>
                <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep - 1) / totalSteps) * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-4 lg:p-8">
              <StepContentWrapper
                isCompleted={isCompleted}
                currentStep={currentStep}
                direction={direction}
                className={cn("min-h-[500px]", contentClassName)}
              >
                {stepsArray[currentStep - 1]}
              </StepContentWrapper>

              {!isCompleted && (
                <div className={cn("mt-8 pt-6 border-t border-gray-200 dark:border-gray-700", footerClassName)}>
                  <div className={cn("flex", currentStep !== 1 ? 'justify-between' : 'justify-end')}>
                    {currentStep !== 1 && (
                      <button
                        onClick={handleBack}
                        className={cn(
                          "inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                          "text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700",
                          "hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        )}
                        {...backButtonProps}
                      >
                        {backButtonText}
                      </button>
                    )}
                    <button
                      onClick={isLastStep ? handleComplete : handleNext}
                      disabled={!validateStep(currentStep)}
                      className={cn(
                        "inline-flex items-center px-6 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                        validateStep(currentStep)
                          ? "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-lg hover:shadow-xl"
                          : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      )}
                      {...nextButtonProps}
                    >
                      {isLastStep ? 'Complete' : nextButtonText}
                      {!isLastStep && (
                        <ChevronRight className="ml-2 h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function StepContentWrapper({ isCompleted, currentStep, direction, children, className }: {
  isCompleted: boolean;
  currentStep: number;
  direction: number;
  children: React.ReactNode;
  className?: string;
}) {
  const [parentHeight, setParentHeight] = useState(0);

  return (
    <motion.div
      className={className}
      style={{ position: 'relative', overflow: 'hidden' }}
      animate={{ height: isCompleted ? 0 : parentHeight }}
      transition={{ type: 'spring', duration: 0.4 }}
    >
      <AnimatePresence initial={false} mode="wait" custom={direction}>
        {!isCompleted && (
          <SlideTransition key={currentStep} direction={direction} onHeightReady={(h: number) => setParentHeight(h)}>
            {children}
          </SlideTransition>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SlideTransition({ children, direction, onHeightReady }: {
  children: React.ReactNode;
  direction: number;
  onHeightReady: (height: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (containerRef.current) onHeightReady(containerRef.current.offsetHeight);
  }, [children, onHeightReady]);

  return (
    <motion.div
      ref={containerRef}
      custom={direction}
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      style={{ position: 'absolute', left: 0, right: 0, top: 0 }}
    >
      {children}
    </motion.div>
  );
}

const stepVariants = {
  enter: (dir: number) => ({
    x: dir >= 0 ? '20%' : '-20%',
    opacity: 0,
    scale: 0.95
  }),
  center: {
    x: '0%',
    opacity: 1,
    scale: 1
  },
  exit: (dir: number) => ({
    x: dir >= 0 ? '-20%' : '20%',
    opacity: 0,
    scale: 0.95
  })
};

export function VerticalStep({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6">{children}</div>;
}