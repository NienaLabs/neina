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
       <div className="flex justify-between items-center mb-2">
         <Label htmlFor="summary" className="font-bold text-gray-700">Professional Summary</Label>
       </div>
       <Textarea
          id="summary"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Briefly describe your professional background and key achievements..."
          className="min-h-[150px] bg-white border-2 border-gray-300 focus:border-blue-500 rounded-none shadow-sm resize-y font-normal"
       />
       <p className="text-xs text-gray-400 text-right">{value.length} characters</p>
    </div>
  );
};
