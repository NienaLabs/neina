import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ResumeExtraction, Fixes } from './types';
import { FixesDisplay } from './FixesDisplay';
import { RemovableInput } from './RemovableInput';

interface SkillsSectionProps {
  skills: NonNullable<ResumeExtraction['skills']>;
  handleSkillArrayChange: (type: keyof NonNullable<ResumeExtraction['skills']>, index: number, value: string) => void;
  addSkill: (type: keyof NonNullable<ResumeExtraction['skills']>) => void;
  removeSkill: (type: keyof NonNullable<ResumeExtraction['skills']>, index: number) => void;
  fixes: Fixes;
}

/**
 * Component for editing the skills section of a resume.
 * @param skills - The skills data.
 * @param handleSkillArrayChange - Function to handle changes to individual skills.
 * @param addSkill - Function to add a new skill.
 * @param removeSkill - Function to remove a skill.
 * @param fixes - The fixes object for displaying hints.
 * @returns A section component for skills.
 */
export const SkillsSection = ({
  skills,
  handleSkillArrayChange,
  addSkill,
  removeSkill,
  fixes,
}: SkillsSectionProps) => {
  return (
    <section>
      <div className="flex flex-row gap-2 items-center">
        <h2 className="text-xl font-semibold mb-3">Skills</h2>
        <div className="p-1 mb-3 flex items-center justify-center">
          <FixesDisplay fixes={fixes} section="skills" />
        </div>
      </div>
      {Object.entries(skills).map(([type, skillList]) => (
        <div key={type} className="mb-4">
          <p className="font-medium capitalize">{type} Skills</p>
          <div className="flex flex-col gap-2">
            {skillList.map((skill, i) => (
              <RemovableInput
                key={i}
                value={skill}
                onChange={(e) => handleSkillArrayChange(type as keyof ResumeExtraction['skills'], i, e.target.value)}
                onRemove={() => removeSkill(type as keyof ResumeExtraction['skills'], i)}
                placeholder={`${type} skill ${i + 1}`}
              />
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => addSkill(type as keyof ResumeExtraction['skills'])}
            >
              <Plus className="size-4 mr-2" /> Add {type} skill
            </Button>
          </div>
        </div>
      ))}
    </section>
  );
};
