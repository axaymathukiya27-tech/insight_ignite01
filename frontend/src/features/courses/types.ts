import React from "react";

export interface PowerModule {
  id: string;
  number: string;
  title: string;
  tagline: string;
  description: string;
  reflectionQuestion: string;
  iconSvg: React.ReactNode;
}

export interface CourseSummary {
  id: string;
  title: string;
  instructor: string;
  subtitle: string;
  description: string;
  format: string;
  language: string;
  targetAudience: string;
  status: "draft" | "development_preview" | "published";
  isFeatured: boolean;
  pillars: string[];
}
