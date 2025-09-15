"use client";

import React, { useState, Children, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CheckCircle, Circle, ChevronRight, AlertCircle, Clock } from 'lucide-react';
import { BrandButton } from './brand-button';

export default function ModernStepper({
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
          className="overflow-hidden rounded-3xl bg-vista-white shadow-2xl border border-gray-100"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {/* Modern Top Progress Section */}
          <div className="bg-vista-white border-b border-gray-100 px-8 py-8">
            <div className="mb-8">
              <h1 className="text-4xl font-bebas tracking-tight text-mine-shaft mb-3">Revamp Your Resume</h1>
              <p className="text-mine-shaft/60 font-editorial text-lg">
                Complete all steps to optimize your resume for your dream job
              </p>
            </div>

            {/* Horizontal Step Progress */}
            <div className="flex items-center justify-between mb-6">
              {stepsArray.map((_, index) => {
                const stepNumber = index + 1;
                const isActive = currentStep === stepNumber;
                const isCompleted = currentStep > stepNumber;
                const isAccessible = stepNumber <= currentStep || validateStep(stepNumber - 1);

                return (
                  <React.Fragment key={stepNumber}>
                    <motion.button
                      onClick={() => isAccessible ? handleStepClick(stepNumber) : null}
                      disabled={!isAccessible}
                      className={cn(
                        "relative flex items-center justify-center transition-all duration-300 group",
                        isAccessible ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                      )}
                      whileHover={isAccessible ? { scale: 1.05 } : {}}
                      whileTap={isAccessible ? { scale: 0.95 } : {}}
                    >
                      {/* Step Circle */}
                      <motion.div
                        className={cn(
                          "w-14 h-14 rounded-full flex items-center justify-center font-sf font-bold text-sm relative z-10 border-3 transition-all duration-300",
                          isCompleted
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-lg"
                            : isActive
                            ? "bg-brand-gradient text-mine-shaft border-transparent shadow-xl"
                            : "bg-vista-white text-mine-shaft/60 border-gray-200 group-hover:border-sunglow/50"
                        )}
                        initial={false}
                        animate={{
                          scale: isActive ? 1.1 : 1,
                          boxShadow: isActive
                            ? "0 10px 30px rgba(253, 186, 47, 0.4)"
                            : isCompleted
                            ? "0 6px 20px rgba(16, 185, 129, 0.3)"
                            : "0 3px 10px rgba(0, 0, 0, 0.08)"
                        }}
                        transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
                      >
                        {isCompleted ? (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                          >
                            <CheckCircle className="w-7 h-7" />
                          </motion.div>
                        ) : (
                          <motion.span
                            initial={false}
                            animate={{ scale: isActive ? 1.1 : 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            {stepNumber}
                          </motion.span>
                        )}
                      </motion.div>

                      {/* Step Label */}
                      <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-center max-w-24">
                        <motion.div
                          className={cn(
                            "text-sm font-sf font-medium whitespace-nowrap transition-colors duration-300",
                            isActive
                              ? "text-mine-shaft"
                              : isCompleted
                              ? "text-emerald-600"
                              : "text-mine-shaft/50"
                          )}
                          initial={false}
                          animate={{
                            y: isActive ? -2 : 0,
                            fontWeight: isActive ? 600 : 500
                          }}
                        >
                          {(steps[index] || { title: `Step ${stepNumber}` }).title}
                        </motion.div>
                        {isActive && (steps[index]?.description) && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xs text-mine-shaft/60 mt-1 font-editorial"
                          >
                            {steps[index].description}
                          </motion.div>
                        )}
                      </div>

                      {/* Pulse Animation for Active Step */}
                      {isActive && (
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-sunglow/30"
                          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                        />
                      )}
                    </motion.button>

                    {/* Connecting Line */}
                    {index < stepsArray.length - 1 && (
                      <div className="flex-1 h-2 mx-6 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                        <motion.div
                          className="h-full bg-brand-gradient rounded-full relative"
                          initial={{ width: "0%" }}
                          animate={{
                            width: currentStep > stepNumber ? "100%" : "0%"
                          }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        >
                          {/* Shimmer effect */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12"
                            animate={{ x: ["-100%", "200%"] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          />
                        </motion.div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Enhanced Progress Bar */}
            <div className="flex items-center justify-between text-sm mb-4">
              <span className="text-mine-shaft/60 font-sf">Overall Progress</span>
              <motion.div
                className="flex items-center space-x-2"
                key={currentStep}
              >
                <Clock className="w-4 h-4 text-mine-shaft/40" />
                <motion.span
                  className="font-sf font-semibold text-mine-shaft"
                  initial={{ scale: 1.2, color: "#FDBA2F" }}
                  animate={{ scale: 1, color: "#202020" }}
                  transition={{ duration: 0.3 }}
                >
                  {Math.round(((currentStep - 1) / totalSteps) * 100)}% Complete
                </motion.span>
              </motion.div>
            </div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
              <motion.div
                className="h-full bg-brand-gradient rounded-full relative"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep - 1) / totalSteps) * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                {/* Multi-layered shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12"
                  animate={{ x: ["-150%", "250%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                />
              </motion.div>
            </div>
          </div>

          {/* Main Content Area with Floating Cards */}
          <div className="flex-1 bg-gradient-to-br from-gray-50/50 to-gray-100/30 min-h-[600px]">
            <div className="p-8">
              <StepContentWrapper
                isCompleted={isCompleted}
                currentStep={currentStep}
                direction={direction}
                className={cn("min-h-[500px]", contentClassName)}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="bg-vista-white rounded-3xl shadow-xl border border-gray-100 p-8 relative overflow-hidden"
                >
                  {/* Enhanced background pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-sunglow/5 via-transparent to-gradient-end/5 opacity-50" />
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-sunglow/10 to-transparent rounded-full transform translate-x-16 -translate-y-16" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-gradient-end/10 to-transparent rounded-full transform -translate-x-12 translate-y-12" />

                  <div className="relative z-10">
                    {stepsArray[currentStep - 1]}
                  </div>
                </motion.div>
              </StepContentWrapper>

              {!isCompleted && (
                <motion.div
                  className={cn("mt-8 bg-vista-white rounded-2xl border border-gray-100 p-6 shadow-lg", footerClassName)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <div className={cn("flex items-center", currentStep !== 1 ? 'justify-between' : 'justify-end')}>
                    {currentStep !== 1 && (
                      <BrandButton
                        variant="outline"
                        onClick={handleBack}
                        className="flex items-center transition-all duration-300 hover:scale-105"
                        {...backButtonProps}
                      >
                        <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
                        {backButtonText}
                      </BrandButton>
                    )}
                    <div className="flex items-center space-x-4">
                      {!validateStep(currentStep) && (
                        <motion.div
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center text-sm text-red-500 font-sf"
                        >
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Please complete all required fields
                        </motion.div>
                      )}
                      <BrandButton
                        variant="primary"
                        onClick={isLastStep ? handleComplete : handleNext}
                        disabled={!validateStep(currentStep)}
                        className={cn(
                          "flex items-center transition-all duration-300 hover:scale-105",
                          !validateStep(currentStep) && "opacity-50 cursor-not-allowed hover:scale-100"
                        )}
                        {...nextButtonProps}
                      >
                        {isLastStep ? (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Start Analysis
                          </>
                        ) : (
                          <>
                            {nextButtonText}
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </BrandButton>
                    </div>
                  </div>
                </motion.div>
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
      transition={{ type: 'spring', duration: 0.5 }}
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
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      style={{ position: 'absolute', left: 0, right: 0, top: 0 }}
    >
      {children}
    </motion.div>
  );
}

const stepVariants = {
  enter: (dir: number) => ({
    x: dir >= 0 ? '30%' : '-30%',
    opacity: 0,
    scale: 0.9,
    rotateY: dir >= 0 ? 10 : -10
  }),
  center: {
    x: '0%',
    opacity: 1,
    scale: 1,
    rotateY: 0
  },
  exit: (dir: number) => ({
    x: dir >= 0 ? '-30%' : '30%',
    opacity: 0,
    scale: 0.9,
    rotateY: dir >= 0 ? -10 : 10
  })
};

export function ModernStep({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6">{children}</div>;
}