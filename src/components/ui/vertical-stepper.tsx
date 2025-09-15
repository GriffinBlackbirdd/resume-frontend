"use client";

import React, { useState, Children, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CheckCircle, Circle, ChevronRight } from 'lucide-react';
import { BrandButton } from './brand-button';

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
      className={cn("min-h-screen bg-vista-white texture-paper", className)}
      {...rest}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          className="overflow-hidden rounded-2xl bg-vista-white shadow-xl border border-gray-200"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex flex-col lg:flex-row min-h-[600px]">
            {/* Vertical Stepper Sidebar */}
            <div className="w-full lg:w-80 bg-vista-white border-r border-gray-200 p-6 lg:p-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bebas tracking-tight text-mine-shaft">Revamp Your Resume</h1>
                <p className="mt-2 text-sm text-mine-shaft/60 font-editorial">
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
                          "group relative w-full rounded-2xl p-3 lg:p-4 text-left transition-all duration-200",
                          status === 'active'
                            ? "bg-sunglow/10 border-2 border-sunglow shadow-sm"
                            : status === 'complete'
                            ? "bg-emerald-50 border-2 border-emerald-300 shadow-sm"
                            : "bg-vista-white border-2 border-gray-200 hover:border-sunglow/30 hover:bg-sunglow/5",
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
                              <CheckCircle className="h-6 w-6 text-emerald-500" />
                            ) : status === 'active' ? (
                              <div className="h-6 w-6 rounded-full bg-sunglow flex items-center justify-center shadow-sm">
                                <span className="text-xs font-sf font-bold text-mine-shaft">{stepNumber}</span>
                              </div>
                            ) : (
                              <Circle className="h-6 w-6 text-mine-shaft/30" />
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
                                "text-sm font-sf font-semibold transition-colors",
                                status === 'active'
                                  ? "text-mine-shaft"
                                  : status === 'complete'
                                  ? "text-emerald-600"
                                  : "text-mine-shaft/50"
                              )}
                            >
                              {stepInfo.title}
                            </motion.h3>
                            {stepInfo.description && (
                              <p className={cn(
                                "mt-1 text-xs font-editorial transition-colors",
                                status === 'active'
                                  ? "text-mine-shaft/70"
                                  : "text-mine-shaft/50"
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
                              <ChevronRight className="h-5 w-5 text-sunglow" />
                            </motion.div>
                          )}
                        </div>
                      </button>

                      {/* Connector Line */}
                      {index < stepsArray.length - 1 && (
                        <div className="absolute left-8 top-12 h-6 w-0.5 bg-gray-200">
                          <motion.div
                            className="h-full bg-emerald-400"
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
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-mine-shaft/60 font-editorial">Progress</span>
                  <span className="font-sf font-semibold text-mine-shaft">
                    {Math.round(((currentStep - 1) / totalSteps) * 100)}%
                  </span>
                </div>
                <div className="mt-2 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-brand-gradient rounded-full"
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
                <div className={cn("mt-8 pt-6 border-t border-gray-200", footerClassName)}>
                  <div className={cn("flex", currentStep !== 1 ? 'justify-between' : 'justify-end')}>
                    {currentStep !== 1 && (
                      <BrandButton
                        variant="outline"
                        onClick={handleBack}
                        {...backButtonProps}
                      >
                        {backButtonText}
                      </BrandButton>
                    )}
                    <BrandButton
                      variant="primary"
                      onClick={isLastStep ? handleComplete : handleNext}
                      disabled={!validateStep(currentStep)}
                      {...nextButtonProps}
                    >
                      {isLastStep ? 'Start Analysis' : nextButtonText}
                      {!isLastStep && (
                        <ChevronRight className="ml-2 h-4 w-4" />
                      )}
                    </BrandButton>
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