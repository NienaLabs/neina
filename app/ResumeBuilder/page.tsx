"use client";

import React, { useState } from "react";
import { 
  Download, FileText, Upload, Wand2, Plus, Edit3, FileCheck, 
  Sparkles, Target, FilePlus, ChevronDown, ChevronUp, ChevronRight, X, PlusCircle, Trash2, Eye, Check 
} from "lucide-react";

type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

interface Skill {
  id: number;
  name: string;
  level: SkillLevel;
}

interface Experience {
  id: number;
  jobTitle?: string;
  company?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

interface Education {
  id: number;
  degree?: string;
  institution?: string;
  fieldOfStudy?: string;
  graduationYear?: string;
}

const ResumeBuilder: React.FC = () => {
  const [activeSections, setActiveSections] = useState({
    summary: true,
    experience: true,
    education: true,
    skills: true
  });
  
  const [experiences, setExperiences] = useState<Experience[]>([{ id: 1 }]);
  const [educations, setEducations] = useState<Education[]>([{ id: 1 }]);
  const [skills, setSkills] = useState<Skill[]>([{ id: 1, name: '', level: 'Intermediate' }]);
  const [professionalSummary, setProfessionalSummary] = useState('');

  const handleButtonClick = (action: string): void => {
    alert(`${action} feature coming soon!`);
  };

  const toggleSection = (section: keyof typeof activeSections): void => {
    setActiveSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const addExperience = (): void => {
    setExperiences([...experiences, { id: Date.now() }]);
  };

  const removeExperience = (id: number): void => {
    if (experiences.length > 1) {
      setExperiences(experiences.filter(exp => exp.id !== id));
    }
  };

  const addEducation = (): void => {
    setEducations([...educations, { id: Date.now() }]);
  };

  const removeEducation = (id: number): void => {
    if (educations.length > 1) {
      setEducations(educations.filter(edu => edu.id !== id));
    }
  };

  const addSkill = (): void => {
    setSkills([...skills, { id: Date.now(), name: '', level: 'Intermediate' }]);
  };

  const removeSkill = (id: number): void => {
    if (skills.length > 1) {
      setSkills(skills.filter(skill => skill.id !== id));
    }
  };

  const updateExperience = (id: number, field: keyof Experience, value: string): void => {
    setExperiences(experiences.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  const updateEducation = (id: number, field: keyof Education, value: string): void => {
    setEducations(educations.map(edu => 
      edu.id === id ? { ...edu, [field]: value } : edu
    ));
  };

  const updateSkill = (id: number, field: keyof Skill, value: string): void => {
    setSkills(skills.map(skill => 
      skill.id === id ? { ...skill, [field]: value as SkillLevel } : skill
    ));
  };

  const downloadResume = (): void => {
    alert('Downloading resume...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 overflow-y-auto py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between mb-10">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Resume Builder
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">
              Craft a professional resume that gets you noticed by employers
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleButtonClick("Upload Resume")}
              className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
            >
              <Upload size={18} className="text-blue-500" />
              <span className="font-medium">Upload Resume</span>
            </button>
            <button
              onClick={downloadResume}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            >
              <Download size={18} className="text-white" />
              <span className="font-medium">Export PDF</span>
            </button>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-xl">
              <h2 className="text-lg font-semibold mb-5 flex items-center gap-2 text-gray-800 dark:text-white">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                  <Sparkles size={20} className="text-indigo-600 dark:text-indigo-300" />
                </div>
                <span>Quick Actions</span>
              </h2>
              <div className="space-y-3">
                <button
                  onClick={() => handleButtonClick("AI Edit Resume")}
                  className="w-full flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-4 py-3 rounded-xl transition-all duration-200 border border-indigo-100 dark:border-indigo-800/30 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Wand2 size={18} className="flex-shrink-0" />
                  <span className="font-medium text-left flex-1">AI Edit Resume</span>
                  <ChevronRight size={16} className="opacity-60" />
                </button>
                
                <button
                  onClick={() => handleButtonClick("Tailor Resume")}
                  className="w-full flex items-center gap-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-4 py-3 rounded-xl transition-all duration-200 border border-purple-100 dark:border-purple-800/30 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Target size={18} className="flex-shrink-0" />
                  <span className="font-medium text-left flex-1">Tailor Resume</span>
                  <ChevronRight size={16} className="opacity-60" />
                </button>
                
                <button
                  onClick={() => handleButtonClick("Add Section")}
                  className="w-full flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-4 py-3 rounded-xl transition-all duration-200 border border-blue-100 dark:border-blue-800/30 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                >
                  <PlusCircle size={18} className="flex-shrink-0" />
                  <span className="font-medium text-left flex-1">Add Section</span>
                  <ChevronRight size={16} className="opacity-60" />
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-xl">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <FileText size={18} className="text-green-500" />
                <span>Resume Tips</span>
              </h3>
              <ul className="space-y-3.5">
                <li className="flex items-start gap-3 group">
                  <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                    <Check size={14} className="text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
                    Keep your resume to 1-2 pages maximum for optimal readability
                  </span>
                </li>
                <li className="flex items-start gap-3 group">
                  <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                    <Check size={14} className="text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
                    Start bullet points with strong action verbs (e.g., "Led", "Developed", "Increased")
                  </span>
                </li>
                <li className="flex items-start gap-3 group">
                  <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                    <Check size={14} className="text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
                    Quantify achievements with numbers and percentages when possible
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Resume Editor */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-xl">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-white">
                  <FileText size={20} className="text-blue-500" />
                  <span>Resume Content</span>
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                    Auto-saving...
                  </span>
                </div>
              </div>
              
              <div className="p-6 space-y-8">
                {/* Professional Summary Section */}
                <div className="space-y-4">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleSection('summary')}
                  >
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                      <div className="w-1.5 h-5 bg-blue-500 rounded-full"></div>
                      <span>Professional Summary</span>
                    </h3>
                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                      {activeSections.summary ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                  
                  {activeSections.summary && (
                    <div className="pl-5 space-y-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Write a brief overview of your professional background and key achievements.
                      </p>
                      <textarea
                        value={professionalSummary}
                        onChange={(e) => setProfessionalSummary(e.target.value)}
                        placeholder="A highly motivated professional with X years of experience in..."
                        className="w-full h-32 px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                      />
                      <div className="flex justify-end">
                        <button 
                          onClick={() => handleButtonClick("AI Generate Summary")}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors font-medium"
                        >
                          AI Generate Summary
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Work Experience Section */}
                <div className="space-y-4">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleSection('experience')}
                  >
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                      <div className="w-1.5 h-5 bg-blue-500 rounded-full"></div>
                      <span>Work Experience</span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                        {experiences.length} {experiences.length === 1 ? 'position' : 'positions'}
                      </span>
                    </h3>
                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                      {activeSections.experience ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                  
                  {activeSections.experience && (
                    <div className="space-y-6 pl-5">
                      {experiences.map((exp) => (
                        <div key={exp.id} className="relative group">
                          <div className="bg-gray-50 dark:bg-gray-700/30 p-5 rounded-xl border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:border-gray-200 dark:hover:border-gray-600">
                            {experiences.length > 1 && (
                              <button 
                                onClick={() => removeExperience(exp.id)}
                                className="absolute -top-2 -right-2 p-1 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 rounded-full hover:bg-red-200 dark:hover:bg-red-800/70 transition-colors duration-200 opacity-0 group-hover:opacity-100"
                              >
                                <X size={16} />
                              </button>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                  Job Title <span className="text-red-500">*</span>
                                </label>
                                <input 
                                  type="text" 
                                  value={exp.jobTitle || ''}
                                  onChange={(e) => updateExperience(exp.id, 'jobTitle', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                  placeholder="e.g. Senior Developer"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                  Company <span className="text-red-500">*</span>
                                </label>
                                <input 
                                  type="text" 
                                  value={exp.company || ''}
                                  onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                  placeholder="Company Name"
                                  required
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                  Start Date
                                </label>
                                <input 
                                  type="text" 
                                  value={exp.startDate || ''}
                                  onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                  placeholder="MM/YYYY"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                  End Date (or Present)
                                </label>
                                <input 
                                  type="text" 
                                  value={exp.endDate || ''}
                                  onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                  placeholder="MM/YYYY or Present"
                                />
                              </div>
                            </div>
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Description & Achievements
                              </label>
                              <textarea 
                                value={exp.description || ''}
                                onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                                className="w-full h-24 px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                                placeholder="Describe your role and achievements..."
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <button
                        type="button"
                        onClick={addExperience}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                      >
                        <Plus size={16} />
                        <span>Add Another Position</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Education Section */}
                <div className="space-y-4">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleSection('education')}
                  >
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                      <div className="w-1.5 h-5 bg-green-500 rounded-full"></div>
                      <span>Education</span>
                    </h3>
                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                      {activeSections.education ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                  
                  {activeSections.education && (
                    <div className="pl-5 space-y-6">
                      {educations.map((edu) => (
                        <div key={edu.id} className="relative group">
                          <div className="bg-gray-50 dark:bg-gray-700/30 p-5 rounded-xl border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:border-gray-200 dark:hover:border-gray-600">
                            {educations.length > 1 && (
                              <button 
                                onClick={() => removeEducation(edu.id)}
                                className="absolute -top-2 -right-2 p-1 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 rounded-full hover:bg-red-200 dark:hover:bg-red-800/70 transition-colors duration-200 opacity-0 group-hover:opacity-100"
                              >
                                <X size={16} />
                              </button>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                  Degree <span className="text-red-500">*</span>
                                </label>
                                <input 
                                  type="text" 
                                  value={edu.degree || ''}
                                  onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                  placeholder="e.g. Bachelor of Science"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                  Institution <span className="text-red-500">*</span>
                                </label>
                                <input 
                                  type="text" 
                                  value={edu.institution || ''}
                                  onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                  placeholder="University Name"
                                  required
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                  Field of Study
                                </label>
                                <input 
                                  type="text" 
                                  value={edu.fieldOfStudy || ''}
                                  onChange={(e) => updateEducation(edu.id, 'fieldOfStudy', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                  placeholder="e.g. Computer Science"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                  Graduation Year
                                </label>
                                <input 
                                  type="number" 
                                  min="1900" 
                                  max="2100"
                                  value={edu.graduationYear || ''}
                                  onChange={(e) => updateEducation(edu.id, 'graduationYear', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                  placeholder="e.g. 2020"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <button
                        type="button"
                        onClick={addEducation}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors"
                      >
                        <Plus size={16} />
                        <span>Add Another Education</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Skills Section */}
                <div className="space-y-4">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleSection('skills')}
                  >
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                      <div className="w-1.5 h-5 bg-amber-500 rounded-full"></div>
                      <span>Skills & Expertise</span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                        {skills.length} {skills.length === 1 ? 'skill' : 'skills'}
                      </span>
                    </h3>
                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                      {activeSections.skills ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                  
                  {activeSections.skills && (
                    <div className="pl-5 space-y-4">
                      <div className="space-y-4">
                        {skills.map((skill) => (
                          <div key={skill.id} className="flex items-start gap-3 group">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <input
                                  type="text"
                                  value={skill.name}
                                  onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                                  placeholder="e.g. JavaScript, Project Management"
                                  required
                                />
                                <select
                                  value={skill.level}
                                  onChange={(e) => updateSkill(skill.id, 'level', e.target.value)}
                                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-sm"
                                >
                                  <option value="Beginner">Beginner</option>
                                  <option value="Intermediate">Intermediate</option>
                                  <option value="Advanced">Advanced</option>
                                  <option value="Expert">Expert</option>
                                </select>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    skill.level === 'Beginner' ? 'bg-amber-400 w-1/4' :
                                    skill.level === 'Intermediate' ? 'bg-amber-500 w-1/2' :
                                    skill.level === 'Advanced' ? 'bg-amber-600 w-3/4' :
                                    'bg-amber-700 w-full'
                                  }`}
                                ></div>
                              </div>
                            </div>
                            {skills.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeSkill(skill.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors mt-1"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                        
                        <button
                          type="button"
                          onClick={addSkill}
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors mt-2"
                        >
                          <Plus size={16} />
                          <span>Add Another Skill</span>
                        </button>
                      </div>
                      
                      <div className="pt-2">
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <span>Skill Level Guide</span>
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-amber-400"></span> Beginner
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Intermediate
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-amber-600"></span> Advanced
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-amber-700"></span> Expert
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="pt-6 mt-8 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span>Auto-saved</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">Last saved: Just now</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => handleButtonClick("Preview Resume")}
                      className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Eye size={16} />
                      <span>Preview Resume</span>
                    </button>
                    <button
                      type="button"
                      onClick={downloadResume}
                      className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      <Download size={16} />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Need help? Check out our <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">resume writing guide</a> or
              </p>
              <button 
                onClick={() => handleButtonClick("Contact Support")}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
              >
                contact support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;
