import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, CircleArrowRight } from 'lucide-react';
import { ResumeExtraction, Fixes } from './types';
import { FixesDisplay } from './FixesDisplay';
import { RemovableInput } from './RemovableInput';

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
  handleCustomFieldChange: (
    section: keyof ResumeExtraction,
    index: number,
    fieldIndex: number,
    key: string,
    value: string
  ) => void;
  addCustomField: (section: keyof ResumeExtraction, index: number) => void;
  removeCustomField: (section: keyof ResumeExtraction, index: number, fieldIndex: number) => void;
  renderStringArray: (
    section: keyof ResumeExtraction,
    index: number,
    key: string,
    values: string[] | undefined
  ) => JSX.Element;
  fixes: Fixes;
  onUpdate: (data: ResumeExtraction['experience']) => void;
}

/**
 * Component for editing the experience section of a resume.
 * @param experience - The experience data.
 * @param handleArrayAdd - Function to add a new experience entry.
 * @param handleArrayDelete - Function to delete an experience entry.
 * @param handleNestedFieldChange - Function to handle changes to nested fields.
 * @param handleCustomFieldChange - Function to handle changes to custom fields.
 * @param addCustomField - Function to add a new custom field.
 * @param removeCustomField - Function to remove a custom field.
 * @param renderStringArray - Utility function to render string arrays.
 * @param fixes - The fixes object for displaying hints.
 * @returns A section component for experience.
 */
export const ExperienceSection = ({
  experience,
  handleArrayAdd,
  handleArrayDelete,
  handleNestedFieldChange,
  handleCustomFieldChange,
  addCustomField,
  removeCustomField,
  renderStringArray,
  fixes,
  onUpdate,
}: ExperienceSectionProps) => {
  return (
    <section>
      <div className="text-xl font-semibold flex items-center justify-between">
        <div className="flex flex-row gap-2 items-center">
          <h2 className="text-xl font-semibold mb-3">Experience</h2>
          <div className="p-1 mb-3 flex items-center justify-center">
            <FixesDisplay 
              fixes={fixes} 
              section="experience" 
              onApplyFix={(fix) => onUpdate(fix.autoFix)}
            />
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
              customFields: [],
            })
          }
        >
          <Plus className="w-4 h-4 mr-2" /> Add Experience
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        {/* Safeguard: ensure experience is an array */}
        {Array.isArray(experience) && experience.map((exp, index) => (
          <div key={index} className="p-4 border rounded-lg relative bg-gray-50">
            <div className="flex justify-end mb-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleArrayDelete('experience', index)}
              >
                <Trash2 className="size-4 mr-2" /> Delete Entry
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <RemovableInput
                placeholder="Position"
                value={exp.position}
                onChange={(e) =>
                  handleNestedFieldChange('experience', index, 'position', e.target.value)
                }
                onRemove={() => handleNestedFieldChange('experience', index, 'position', '')}
              />
              <RemovableInput
                placeholder="Company"
                value={exp.company}
                onChange={(e) =>
                  handleNestedFieldChange('experience', index, 'company', e.target.value)
                }
                onRemove={() => handleNestedFieldChange('experience', index, 'company', '')}
              />
              <RemovableInput
                placeholder="Location"
                value={exp.location}
                onChange={(e) =>
                  handleNestedFieldChange('experience', index, 'location', e.target.value)
                }
                onRemove={() => handleNestedFieldChange('experience', index, 'location', '')}
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
              
              {/* Custom Fields */}
              {Array.isArray(exp.customFields) && exp.customFields.map((field, fieldIndex) => (
                <div key={fieldIndex} className="col-span-2 grid grid-cols-2 gap-3 bg-white p-2 rounded border">
                  <Input
                    placeholder="Field Name"
                    value={field.key}
                    onChange={(e) =>
                      handleCustomFieldChange('experience', index, fieldIndex, 'key', e.target.value)
                    }
                  />
                  <RemovableInput
                    placeholder="Field Value"
                    value={field.value}
                    onChange={(e) =>
                      handleCustomFieldChange('experience', index, fieldIndex, 'value', e.target.value)
                    }
                    onRemove={() => removeCustomField('experience', index, fieldIndex)}
                  />
                </div>
              ))}
              
              <div className="col-span-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addCustomField('experience', index)}
                >
                  <Plus className="size-4 mr-2" /> Add Custom Field
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
