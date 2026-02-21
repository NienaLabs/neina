'use client';

import React from 'react';
import { PersonalInfo } from '@/lib/types/resume';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PersonalInfoFormProps {
  data: Partial<PersonalInfo>; // Allow partial data
  onChange: (data: PersonalInfo) => void;
}

export const PersonalInfoForm = ({ data = {}, onChange }: PersonalInfoFormProps) => {
  const handleChange = (field: keyof PersonalInfo, value: string) => {
    onChange({ 
        name: '', title: '', email: '', phone: '', location: '', website: '', linkedin: '', github: '', 
        ...data, 
        [field]: value 
    } as PersonalInfo);
  };

  return (
    <div className="space-y-6">
        <h3 className="text-xl font-semibold border-b pb-3">
            Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                    id="fullName" 
                    value={data.name || ''} 
                    onChange={(e) => handleChange('name', e.target.value)} 
                    placeholder="John Doe"
                    className="bg-white shadow-sm"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input 
                    id="jobTitle" 
                    value={data.title || ''} 
                    onChange={(e) => handleChange('title', e.target.value)} 
                    placeholder="Software Engineer"
                    className="bg-white shadow-sm"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                    id="email" 
                    type="email"
                    value={data.email || ''} 
                    onChange={(e) => handleChange('email', e.target.value)} 
                    placeholder="john@example.com"
                    className="bg-white shadow-sm"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input 
                    id="phone" 
                    value={data.phone || ''} 
                    onChange={(e) => handleChange('phone', e.target.value)} 
                    placeholder="+1 (555) 123-4567"
                    className="bg-white shadow-sm"
                />
            </div>
            <div className="space-y-2 md:col-span-2">
                <Label htmlFor="location">Location</Label>
                <Input 
                    id="location" 
                    value={data.location || ''} 
                    onChange={(e) => handleChange('location', e.target.value)} 
                    placeholder="New York, NY"
                    className="bg-white shadow-sm"
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input 
                    id="linkedin" 
                    value={data.linkedin || ''} 
                    onChange={(e) => handleChange('linkedin', e.target.value)} 
                    placeholder="linkedin.com/in/johndoe"
                    className="bg-white shadow-sm"
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="website">Website / Portfolio</Label>
                <Input 
                    id="website" 
                    value={data.website || ''} 
                    onChange={(e) => handleChange('website', e.target.value)} 
                    placeholder="johndoe.com"
                    className="bg-white shadow-sm"
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="github">GitHub</Label>
                <Input 
                    id="github" 
                    value={data.github || ''} 
                    onChange={(e) => handleChange('github', e.target.value)} 
                    placeholder="github.com/johndoe"
                    className="bg-white shadow-sm"
                />
            </div>
        </div>
    </div>
  );
};
