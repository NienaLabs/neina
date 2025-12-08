'use client'

import React from 'react';
import dynamic from 'next/dynamic';
import { ResumeExtraction } from '../editor/types';

const PDFPreviewClient = dynamic(() => import('./PDFPreviewClient'), { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full">Loading PDF Viewer...</div>
});

interface PDFPreviewPageClientProps {
  data: ResumeExtraction;
  fullName?: string;
}

const PDFPreviewPageClient: React.FC<PDFPreviewPageClientProps> = ({ data, fullName }) => {
  return (
    <PDFPreviewClient data={data} fullName={fullName} />
  );
};

export default PDFPreviewPageClient;
