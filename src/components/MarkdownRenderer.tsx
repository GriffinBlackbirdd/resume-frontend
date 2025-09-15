"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BrandButton } from "./ui/brand-button";
import { TextButton } from "./ui/text-button";

interface MarkdownRendererProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  isLoading?: boolean;
}

export default function MarkdownRenderer({
  isOpen,
  onClose,
  title,
  content,
  isLoading = false,
}: MarkdownRendererProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-mine-shaft/90 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
      <div className="bg-vista-white rounded-xl border border-mine-shaft/20 shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-mine-shaft/10">
          <h2 className="text-2xl font-bebas tracking-tight text-mine-shaft">{title}</h2>
          <TextButton
            onClick={onClose}
            className="p-2 text-mine-shaft/50 hover:text-mine-shaft hover:bg-sunglow/10 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </TextButton>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-sunglow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-mine-shaft/60 font-editorial">Loading {title.toLowerCase()}...</p>
              </div>
            </div>
          ) : (
            <div className="prose prose-lg max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[]}
                skipHtml={false}
                components={{
                  // Custom styling for markdown elements
                  h1: ({ children }) => (
                    <h1 className="text-3xl font-bebas tracking-tight text-mine-shaft mb-6 pb-2 border-b border-mine-shaft/10">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-2xl font-bebas tracking-tight text-mine-shaft mb-4 mt-8">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl font-sf font-semibold text-mine-shaft mb-3 mt-6">
                      {children}
                    </h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-lg font-sf font-semibold text-mine-shaft mb-2 mt-4">
                      {children}
                    </h4>
                  ),
                  p: ({ children }) => (
                    <p className="text-mine-shaft/80 font-editorial mb-4 leading-relaxed">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside text-mine-shaft/80 font-editorial mb-4 space-y-2">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside text-mine-shaft/80 font-editorial mb-4 space-y-2">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-mine-shaft/80 font-editorial">
                      {children}
                    </li>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-sunglow bg-sunglow/5 p-4 my-6 italic text-mine-shaft/70 font-editorial">
                      {children}
                    </blockquote>
                  ),
                  code: ({ children, className }) => {
                    const isBlock = className?.includes('language-');
                    if (isBlock) {
                      return (
                        <pre className="bg-mine-shaft/5 rounded-lg p-4 overflow-x-auto mb-4">
                          <code className="text-db3b09 text-sm font-mono">
                            {children}
                          </code>
                        </pre>
                      );
                    }
                    return (
                      <code className="bg-mine-shaft/5 text-db3b09 px-2 py-1 rounded text-sm font-mono">
                        {children}
                      </code>
                    );
                  },
                  strong: ({ children }) => (
                    <strong className="text-mine-shaft font-sf font-semibold">
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => (
                    <em className="text-mine-shaft/70 font-editorial italic">
                      {children}
                    </em>
                  ),
                  hr: () => (
                    <hr className="border-mine-shaft/10 my-8" />
                  ),
                  a: ({ children, href }) => (
                    <a 
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sunglow hover:text-db3b09 underline transition-colors duration-200"
                    >
                      {children}
                    </a>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto mb-8">
                      <table className="min-w-full border-collapse border border-mine-shaft/10 bg-mine-shaft/5 rounded-lg">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-mine-shaft/10">
                      {children}
                    </thead>
                  ),
                  tbody: ({ children }) => (
                    <tbody>
                      {children}
                    </tbody>
                  ),
                  tr: ({ children }) => (
                    <tr className="border-b border-mine-shaft/10 hover:bg-sunglow/5 transition-colors">
                      {children}
                    </tr>
                  ),
                  th: ({ children }) => (
                    <th className="border border-mine-shaft/10 px-3 py-2 text-left text-mine-shaft font-sf font-semibold text-xs bg-mine-shaft/5">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-mine-shaft/10 px-3 py-2 text-mine-shaft/80 font-editorial text-xs align-top max-w-xs break-words overflow-hidden">
                      {children}
                    </td>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-mine-shaft/10">
          <BrandButton
            onClick={onClose}
            variant="primary"
            className="px-6 py-2"
          >
            Close
          </BrandButton>
        </div>
      </div>
    </div>
  );
}