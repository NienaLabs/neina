import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, CircleArrowRight } from 'lucide-react';
import { ResumeExtraction, Fixes } from './types';
import { FixesDisplay } from './FixesDisplay';

interface ExperienceSectionProps {
  experience: NonNullable<ResumeExtraction['experience']>;
  handleArrayAdd: (section: keyof ResumeExtraction, newItem: unknown) => void;
  handleArrayDelete: (section: keyof ResumeExtraction, index: number) => void;
  handleNestedFieldChange: (
    section: keyof ResumeExtraction,
    index: number,
    key: string,
    value: unknown
  ) => void;
  renderStringArray: (
    section: keyof ResumeExtraction,
    index: number,
    key: string,
    values: string[] | undefined
  ) => JSX.Element;
  fixes: Fixes;
}

/**
 * Component for editing the experience section of a resume.
 * @param experience - The experience data.
 * @param handleArrayAdd - Function to add a new experience entry.
 * @param handleArrayDelete - Function to delete an experience entry.
 * @param handleNestedFieldChange - Function to handle changes to nested fields.
 * @param renderStringArray - Utility function to render string arrays.
 * @param fixes - The fixes object for displaying hints.
 * @returns A section component for experience.
 */
export const ExperienceSection = ({
  experience,
  handleArrayAdd,
  handleArrayDelete,
  handleNestedFieldChange,
  renderStringArray,
  fixes,
}: ExperienceSectionProps) => {
  return (
    <section>
      <div className="text-xl font-semibold flex items-center justify-between">
        <div className="flex flex-row gap-2 items-center">
          <h2 className="text-xl font-semibold mb-3">Experience</h2>
          <div className="p-1 mb-3 flex items-center justify-center">
            <FixesDisplay fixes={fixes} section="experience" />
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            handleArrayAdd('experience', {
              position: '',
              company: '',
              location: '',
              startDate: '',
              endDate: '',
              responsibilities: [''],
              achievements: [''],
            })
          }
        >
          <Plus className="w-4 h-4 mr-2" /> Add Experience
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        {experience.map((exp, index) => (
          <div key={index} className="p-4 border rounded-lg relative bg-gray-50">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={() => handleArrayDelete('experience', index)}
            >
              <Trash2 className="size-4 text-red-500" />
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Position"
                value={exp.position}
                onChange={(e) =>
                  handleNestedFieldChange('experience', index, 'position', e.target.value)
                }
              />
              <Input
                placeholder="Company"
                value={exp.company}
                onChange={(e) =>
                  handleNestedFieldChange('experience', index, 'company', e.target.value)
                }
              />
              <Input
                placeholder="Location"
                value={exp.location}
                onChange={(e) =>
                  handleNestedFieldChange('experience', index, 'location', e.target.value)
                }
              />
              <div className="flex items-center gap-2">
                <Input
                  type="month"
                  value={exp.startDate}
                  onChange={(e) =>
                    handleNestedFieldChange('experience', index, 'startDate', e.target.value)
                  }
                />
                <CircleArrowRight className="size-4" />
                <Input
                  type="month"
                  value={exp.endDate}
                  onChange={(e) =>
                    handleNestedFieldChange('experience', index, 'endDate', e.target.value)
                  }
                />
              </div>
              <div className="col-span-2">
                <p className="font-medium">Responsibilities</p>
                {renderStringArray('experience', index, 'responsibilities', exp.responsibilities)}
              </div>
              <div className="col-span-2">
                <p className="font-medium">Achievements</p>
                {renderStringArray('experience', index, 'achievements', exp.achievements)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
