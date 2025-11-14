import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, CircleArrowRight } from 'lucide-react';
import { ResumeExtraction, Fixes } from './types';
import { FixesDisplay } from './FixesDisplay';

interface EducationSectionProps {
  education: NonNullable<ResumeExtraction['education']>;
  handleArrayAdd: (section: keyof ResumeExtraction, newItem: unknown) => void;
  handleArrayDelete: (section: keyof ResumeExtraction, index: number) => void;
  handleNestedFieldChange: (
    section: keyof ResumeExtraction,
    index: number,
    key: string,
    value: unknown
  ) => void;
  fixes: Fixes;
}

/**
 * Component for editing the education section of a resume.
 * @param education - The education data.
 * @param handleArrayAdd - Function to add a new education entry.
 * @param handleArrayDelete - Function to delete an education entry.
 * @param handleNestedFieldChange - Function to handle changes to nested fields.
 * @param fixes - The fixes object for displaying hints.
 * @returns A section component for education.
 */
export const EducationSection = ({
  education,
  handleArrayAdd,
  handleArrayDelete,
  handleNestedFieldChange,
  fixes,
}: EducationSectionProps) => {
  return (
    <section>
      <div className="text-xl font-semibold flex items-center justify-between">
        <div className="flex flex-row gap-2 items-center">
          <h2 className="text-xl font-semibold mb-3">Education</h2>
          <div className="p-1 mb-3 flex items-center justify-center">
            <FixesDisplay fixes={fixes} section="education" />
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            handleArrayAdd('education', {
              institution: '',
              degree: '',
              fieldOfStudy: '',
              startDate: '',
              endDate: '',
              grade: '',
              location: '',
              description: '',
            })
          }
        >
          <Plus className="w-4 h-4 mr-2" /> Add Education
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        {education.map((edu, index) => (
          <div key={index} className="p-4 border rounded-lg relative bg-gray-50">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={() => handleArrayDelete('education', index)}
            >
              <Trash2 className="size-4 text-red-500" />
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Institution"
                value={edu.institution}
                onChange={(e) =>
                  handleNestedFieldChange('education', index, 'institution', e.target.value)
                }
              />
              <Input
                placeholder="Degree"
                value={edu.degree}
                onChange={(e) =>
                  handleNestedFieldChange('education', index, 'degree', e.target.value)
                }
              />
              <Input
                placeholder="Field of Study"
                value={edu.fieldOfStudy}
                onChange={(e) =>
                  handleNestedFieldChange('education', index, 'fieldOfStudy', e.target.value)
                }
              />
              <div className="flex items-center gap-2">
                <Input
                  type="month"
                  value={edu.startDate}
                  onChange={(e) =>
                    handleNestedFieldChange('education', index, 'startDate', e.target.value)
                  }
                />
                <CircleArrowRight className="size-4" />
                <Input
                  type="month"
                  value={edu.endDate}
                  onChange={(e) =>
                    handleNestedFieldChange('education', index, 'endDate', e.target.value)
                  }
                />
              </div>
              <Input
                placeholder="Grade"
                value={edu.grade}
                onChange={(e) =>
                  handleNestedFieldChange('education', index, 'grade', e.target.value)
                }
              />
              <Input
                placeholder="Location"
                value={edu.location}
                onChange={(e) =>
                  handleNestedFieldChange('education', index, 'location', e.target.value)
                }
              />
              <Textarea
                placeholder="Description"
                value={edu.description}
                onChange={(e) =>
                  handleNestedFieldChange('education', index, 'description', e.target.value)
                }
                className="col-span-2"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
