'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface SummaryFormProps {
  value: string;
  onChange: (value: string) => void;
}

export const SummaryForm = ({ value, onChange }: SummaryFormProps) => {
  return (
    <div className="space-y-4">
       <div className="border-b pb-3 mb-1">
         <h4 className="text-xl font-semibold">Professional Summary</h4>
       </div>
       <Textarea
          id="summary"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Briefly describe your professional background and key achievements..."
          className="min-h-[150px] bg-white resize-y font-normal"
       />
       <p className="text-xs text-gray-400 text-right">{value.length} characters</p>
    </div>
  );
};
