// Imports must be at the top, so I will replace the whole file content to be safe and clean.
import React from 'react';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import ResumePDF from './ResumePDF';
import { ResumeExtraction } from '../editor/types';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface PDFPreviewClientProps {
  data: ResumeExtraction;
  fullName?: string;
}

const PDFPreviewClient: React.FC<PDFPreviewClientProps> = ({ data, fullName }) => {
  const fileName = fullName ? `${fullName.replace(/\s+/g, '_')}_Resume.pdf` : 'Resume.pdf';

  return (
    <div className="w-full h-screen flex flex-col gap-4 p-4 bg-muted/10">
      <div className="flex justify-end">
        <PDFDownloadLink
          document={<ResumePDF data={data} fullName={fullName} />}
          fileName={fileName}
        >
          {({ blob, url, loading, error }) => (
            <Button disabled={loading}>
              <Download className="mr-2 h-4 w-4" />
              {loading ? 'Preparing Document...' : 'Download PDF'}
            </Button>
          )}
        </PDFDownloadLink>
      </div>
      <div className="flex-1 border rounded-lg overflow-hidden shadow-sm bg-background">
        <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>
          <ResumePDF data={data} fullName={fullName} />
        </PDFViewer>
      </div>
    </div>
  );
};

export default PDFPreviewClient;
