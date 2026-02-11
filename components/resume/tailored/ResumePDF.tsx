'use client';

import React from 'react';
import { Document } from '@react-pdf/renderer';
import { ResumeData, TemplateType } from '@/lib/types/resume';
import { ClassicSinglePDF } from './templates/pdf/ClassicSinglePDF';
import { ModernSinglePDF } from './templates/pdf/ModernSinglePDF';
import { ClassicTwoColumnPDF } from './templates/pdf/ClassicTwoColumnPDF';
import { ModernTwoColumnPDF } from './templates/pdf/ModernTwoColumnPDF';

interface ResumePDFProps {
  data: ResumeData;
  template?: TemplateType;
}

export const ResumePDF = ({ data, template = 'classic-single' }: ResumePDFProps) => {
  if (!data) return null;

  switch (template) {
    case 'modern-single':
      return (
        <Document title={`${data.personalInfo?.name || 'Resume'} - Modern`}>
          <ModernSinglePDF data={data} />
        </Document>
      );
    case 'classic-two':
      return (
        <Document title={`${data.personalInfo?.name || 'Resume'} - Classic 2-Column`}>
          <ClassicTwoColumnPDF data={data} />
        </Document>
      );
    case 'modern-two':
      return (
        <Document title={`${data.personalInfo?.name || 'Resume'} - Modern 2-Column`}>
          <ModernTwoColumnPDF data={data} />
        </Document>
      );
    case 'classic-single':
    default:
      return (
        <Document title={`${data.personalInfo?.name || 'Resume'} - Classic`}>
          <ClassicSinglePDF data={data} />
        </Document>
      );
  }
};
