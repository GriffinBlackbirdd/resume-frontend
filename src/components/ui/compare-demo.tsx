"use client";
import React, { useState, useEffect } from "react";
import { Compare } from "./compare";

interface CompareDemoProps {
  className?: string;
  firstPdf?: string; // URL or base64 of first PDF
  secondPdf?: string; // URL or base64 of second PDF
  userId?: string;
  isLoading?: boolean;
}

export function CompareDemo({
  className,
  userId,
  isLoading: propIsLoading = false,
  ...props
}: CompareDemoProps) {
  const [firstImageUrl, setFirstImageUrl] = useState<string>("/johnDoeBad.jpg");
  const [secondImageUrl, setSecondImageUrl] = useState<string>("/johnDoeGood.jpg");
  const [isLoading, setIsLoading] = useState(propIsLoading);
  const [hasResumes, setHasResumes] = useState(false);

  useEffect(() => {
    if (!propIsLoading && userId) {
      loadResumeImages();
    }
  }, [userId, propIsLoading]);

  const loadResumeImages = async () => {
    setIsLoading(true);
    let hasOriginal = false;
    let hasRevamped = false;

    try {
      // Fetch original resume
      const originalResponse = await fetch(`/api/get-original-resume?userId=${userId}`);
      if (originalResponse.ok) {
        const blob = await originalResponse.blob();
        setFirstImageUrl(URL.createObjectURL(blob));
        hasOriginal = true;
      }

      // Fetch revamped resume
      const revampedResponse = await fetch(`/api/get-revamped-resume?userId=${userId}`);
      if (revampedResponse.ok) {
        const blob = await revampedResponse.blob();
        setSecondImageUrl(URL.createObjectURL(blob));
        hasRevamped = true;
      }

      setHasResumes(hasOriginal && hasRevamped);
    } catch (error) {
      console.error('Error loading resume images:', error);
      // Keep default images if there's an error
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || propIsLoading) {
    return (
      <div className={`p-4 border rounded-3xl bg-vista-white border-mine-shaft/10 ${className}`}>
        <div className="h-[250px] w-[200px] md:h-[500px] md:w-[500px] flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-sunglow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-mine-shaft/60 font-editorial">Loading resume comparison...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 border rounded-3xl bg-vista-white border-mine-shaft/10 ${className}`}>
      <Compare
        firstImage={firstImageUrl}
        secondImage={secondImageUrl}
        firstImageClassName="object-cover object-left-top"
        secondImageClassname="object-cover object-left-top"
        className="h-[250px] w-[200px] md:h-[500px] md:w-[500px]"
        slideMode="hover"
      />
      {!hasResumes && (
        <div className="mt-4 text-center">
          <p className="text-mine-shaft/60 font-editorial text-sm">
            Showing example comparison. Upload a resume to see your actual resumes here.
          </p>
        </div>
      )}
    </div>
  );
}