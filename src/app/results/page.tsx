'use client';

import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Download, Share2, RefreshCw } from 'lucide-react';

export default function ResultsPage() {
  const [markdownContent, setMarkdownContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const analysisResult = searchParams.get('analysis');
    
    if (analysisResult) {
      try {
        // If analysis is passed as URL parameter, use it directly
        setMarkdownContent(decodeURIComponent(analysisResult));
        setLoading(false);
      } catch (err) {
        setError('Failed to load analysis results');
        setLoading(false);
      }
    } else {
      // Fallback: try to fetch from review.md file if available
      fetchMarkdownFile();
    }
  }, [searchParams]);

  const fetchMarkdownFile = async () => {
    try {
      // This would need to be implemented if you want to serve the review.md file
      // For now, show error if no analysis parameter is provided
      setError('No analysis results found. Please run a new analysis.');
      setLoading(false);
    } catch (err) {
      setError('Failed to load analysis results');
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gap-analysis-results.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Gap Analysis Results',
          text: 'Check out my career gap analysis results',
          url: window.location.href
        });
      } catch (err) {
        // Fallback to copy to clipboard
        navigator.clipboard.writeText(window.location.href);
      }
    } else {
      // Fallback to copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleNewAnalysis = () => {
    router.push('/revamp');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your analysis results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Analysis Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleNewAnalysis}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start New Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gap Analysis Results</h1>
                <p className="text-gray-600">Your personalized career development roadmap</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleShare}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              <button
                onClick={handleNewAnalysis}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                New Analysis
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="prose prose-lg max-w-none">
            <ReactMarkdown
              components={{
                // Custom styling for different markdown elements
                h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-gray-900 mb-6 pb-3 border-b" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-xl font-semibold text-gray-700 mt-6 mb-3" {...props} />,
                p: ({node, ...props}) => <p className="text-gray-600 leading-relaxed mb-4" {...props} />,
                table: ({node, ...props}) => (
                  <div className="overflow-x-auto my-6">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-300 rounded-lg" {...props} />
                  </div>
                ),
                thead: ({node, ...props}) => <thead className="bg-gray-50" {...props} />,
                th: ({node, ...props}) => (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" {...props} />
                ),
                td: ({node, ...props}) => (
                  <td className="px-6 py-4 text-sm text-gray-900 border-t border-gray-200" {...props} />
                ),
                ul: ({node, ...props}) => <ul className="list-disc pl-6 space-y-2 mb-4" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal pl-6 space-y-2 mb-4" {...props} />,
                li: ({node, ...props}) => <li className="text-gray-600" {...props} />,
                blockquote: ({node, ...props}) => (
                  <blockquote className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 my-4" {...props} />
                ),
                code: ({node, inline, ...props}) => 
                  inline ? (
                    <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props} />
                  ) : (
                    <code className="block bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto" {...props} />
                  ),
                a: ({node, ...props}) => (
                  <a className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer" {...props} />
                ),
              }}
            >
              {markdownContent}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}