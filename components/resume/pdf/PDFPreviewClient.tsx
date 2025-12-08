'use client'

import React from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import ResumePDF from './ResumePDF';
import { ResumeExtraction } from '../editor/types';

interface PDFPreviewClientProps {
  data: ResumeExtraction;
  fullName?: string;
}

const PDFPreviewClient: React.FC<PDFPreviewClientProps> = ({ data, fullName }) => {
  return (
    <div className="w-full h-screen flex flex-col">
      <PDFViewer style={{ width: '100%', height: '100%' }}>
        <ResumePDF data={data} fullName={fullName} />
      </PDFViewer>
    </div>
  );
};

export default PDFPreviewClient;
