"use client";
import React from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalTrigger,
} from "./ui/animated-modal";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export function NewResumeModal() {
  const router = useRouter();

  const images = [
    "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=3000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1573790387438-4da905039392?q=80&w=3425&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1555400038-63f5ba517a47?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1554931670-4ebfabf6e7a9?q=80&w=3387&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1546484475-7f7bd55792da?q=80&w=2581&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  ];

  const handleRevampExisting = () => {
    router.push('/revamp');
  };

  const handleStartFromScratch = () => {
    router.push('/editor');
  };

  return (
    <Modal>
      <ModalTrigger className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
        + New Resume
      </ModalTrigger>
      <ModalBody>
        <ModalContent>
          <h4 className="text-lg md:text-2xl text-neutral-600 dark:text-neutral-100 font-bold text-center mb-8">
            Create a New Resume ✨
          </h4>
          
          {/* Animated Images */}
          <div className="flex justify-center items-center mb-8">
            {images.map((image, idx) => (
              <motion.div
                key={"images" + idx}
                style={{
                  rotate: Math.random() * 20 - 10,
                }}
                whileHover={{
                  scale: 1.1,
                  rotate: 0,
                  zIndex: 100,
                }}
                whileTap={{
                  scale: 1.1,
                  rotate: 0,
                  zIndex: 100,
                }}
                className="rounded-xl -mr-4 mt-4 p-1 bg-white dark:bg-neutral-800 dark:border-neutral-700 border border-neutral-100 shrink-0 overflow-hidden"
              >
                <img
                  src={image}
                  alt="resume images"
                  width="500"
                  height="500"
                  className="rounded-lg h-16 w-16 md:h-24 md:w-24 object-cover shrink-0"
                />
              </motion.div>
            ))}
          </div>

          <div className="text-center mb-8">
            <p className="text-neutral-500 dark:text-neutral-400 text-sm md:text-base">
              Choose how you'd like to get started with your new resume
            </p>
          </div>
          
          {/* Buttons with equal sizes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <button
              onClick={handleRevampExisting}
              className="flex flex-col items-center justify-center space-y-4 p-8 h-40 border-2 border-blue-200 dark:border-blue-800 rounded-xl hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 group"
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-base font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Revamp Existing</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Upload and improve your current resume</p>
              </div>
            </button>

            <button
              onClick={handleStartFromScratch}
              className="flex flex-col items-center justify-center space-y-4 p-8 h-40 border-2 border-green-200 dark:border-green-800 rounded-xl hover:border-green-400 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 group"
            >
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-base font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Start from Scratch</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-500">Build a completely new resume</p>
              </div>
            </button>
          </div>
        </ModalContent>
        <ModalFooter className="gap-4 justify-center">
          <p className="text-xs text-neutral-400 dark:text-neutral-600 text-center">
            Choose an option above to get started with your resume
          </p>
        </ModalFooter>
      </ModalBody>
    </Modal>
  );
}