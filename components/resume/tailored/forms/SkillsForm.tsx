'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface SkillsData {
    technicalSkills: string[];
    languages: string[];
    certificationsTraining: string[];
    awards: string[];
}

interface SkillsFormProps {
  data: SkillsData;
  onChange: (data: SkillsData) => void;
}

export const SkillsForm = ({ data, onChange }: SkillsFormProps) => {
    
    // Helper to handle simple comma or newline separated lists converted to array
    const handleListChange = (field: keyof SkillsData, value: string) => {
        // preserve newlines for textarea view, but store as array
        // Logic: Try to split by common delimiters
        const array = value.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        onChange({ ...data, [field]: array });
    };

    const getDisplayValue = (arr: string[]) => {
        return (arr || []).join(', ');
    };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center mb-2 border-b border-gray-200 pb-2">
         <h4 className="font-bold text-gray-700">Skills & Additional</h4>
       </div>

       <div className="space-y-4">
           <div className="space-y-2">
                <Label>Technical Skills</Label>
                <Textarea 
                    value={getDisplayValue(data.technicalSkills)}
                    onChange={(e) => handleListChange('technicalSkills', e.target.value)}
                    placeholder="React, TypeScript, Node.js, Python..."
                    className="min-h-[80px]"
                />
                <p className="text-xs text-gray-400">Separate skills with commas.</p>
           </div>

           <div className="space-y-2">
                <Label>Languages</Label>
                <Input 
                    value={getDisplayValue(data.languages)}
                    onChange={(e) => handleListChange('languages', e.target.value)}
                    placeholder="English (Native), Spanish (Intermediate)..."
                />
           </div>

            <div className="space-y-2">
                <Label>Certifications</Label>
                <Textarea 
                    value={getDisplayValue(data.certificationsTraining)}
                    onChange={(e) => handleListChange('certificationsTraining', e.target.value)}
                    placeholder="AWS Certified Solutions Architect, Google Cloud Professional..."
                     className="min-h-[80px]"
                />
                <p className="text-xs text-gray-400">Separate certifications with commas.</p>
           </div>
           
           <div className="space-y-2">
                <Label>Awards</Label>
                 <Textarea 
                    value={getDisplayValue(data.awards)}
                    onChange={(e) => handleListChange('awards', e.target.value)}
                    placeholder="Employee of the Month (2023)..."
                     className="min-h-[80px]"
                />
                <p className="text-xs text-gray-400">Separate awards with commas.</p>
           </div>
       </div>
    </div>
  );
};
