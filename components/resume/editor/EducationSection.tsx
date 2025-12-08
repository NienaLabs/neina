import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, CircleArrowRight } from 'lucide-react';
import { ResumeExtraction, Fixes } from './types';
import { FixesDisplay } from './FixesDisplay';
import { RemovableInput } from './RemovableInput';

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
  handleCustomFieldChange: (
    section: keyof ResumeExtraction,
    index: number,
    fieldIndex: number,
    key: string,
    value: string
  ) => void;
  addCustomField: (section: keyof ResumeExtraction, index: number) => void;
  removeCustomField: (section: keyof ResumeExtraction, index: number, fieldIndex: number) => void;
  fixes: Fixes;
}

/**
 * Component for editing the education section of a resume.
 * @param education - The education data.
 * @param handleArrayAdd - Function to add a new education entry.
 * @param handleArrayDelete - Function to delete an education entry.
 * @param handleNestedFieldChange - Function to handle changes to nested fields.
 * @param handleCustomFieldChange - Function to handle changes to custom fields.
 * @param addCustomField - Function to add a new custom field.
 * @param removeCustomField - Function to remove a custom field.
 * @param fixes - The fixes object for displaying hints.
 * @returns A section component for education.
 */
export const EducationSection = ({
  education,
  handleArrayAdd,
  handleArrayDelete,
  handleNestedFieldChange,
  handleCustomFieldChange,
  addCustomField,
  removeCustomField,
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
              customFields: [],
            })
          }
        >
          <Plus className="w-4 h-4 mr-2" /> Add Education
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        {education.map((edu, index) => (
          <div key={index} className="p-4 border rounded-lg relative bg-gray-50">
            <div className="flex justify-end mb-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleArrayDelete('education', index)}
              >
                <Trash2 className="size-4 mr-2" /> Delete Entry
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <RemovableInput
                placeholder="Institution"
                value={edu.institution}
                onChange={(e) =>
                  handleNestedFieldChange('education', index, 'institution', e.target.value)
                }
                onRemove={() => handleNestedFieldChange('education', index, 'institution', '')}
              />
              <RemovableInput
                placeholder="Degree"
                value={edu.degree}
                onChange={(e) =>
                  handleNestedFieldChange('education', index, 'degree', e.target.value)
                }
                onRemove={() => handleNestedFieldChange('education', index, 'degree', '')}
              />
              <RemovableInput
                placeholder="Field of Study"
                value={edu.fieldOfStudy}
                onChange={(e) =>
                  handleNestedFieldChange('education', index, 'fieldOfStudy', e.target.value)
                }
                onRemove={() => handleNestedFieldChange('education', index, 'fieldOfStudy', '')}
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
              <RemovableInput
                placeholder="Grade"
                value={edu.grade}
                onChange={(e) =>
                  handleNestedFieldChange('education', index, 'grade', e.target.value)
                }
                onRemove={() => handleNestedFieldChange('education', index, 'grade', '')}
              />
              <RemovableInput
                placeholder="Location"
                value={edu.location}
                onChange={(e) =>
                  handleNestedFieldChange('education', index, 'location', e.target.value)
                }
                onRemove={() => handleNestedFieldChange('education', index, 'location', '')}
              />
              <div className="col-span-2">
                <Textarea
                  placeholder="Description"
                  value={edu.description}
                  onChange={(e) =>
                    handleNestedFieldChange('education', index, 'description', e.target.value)
                  }
                  className="w-full"
                />
              </div>
              
              {/* Custom Fields */}
              {edu.customFields?.map((field, fieldIndex) => (
                <div key={fieldIndex} className="col-span-2 grid grid-cols-2 gap-3 bg-white p-2 rounded border">
                  <Input
                    placeholder="Field Name"
                    value={field.key}
                    onChange={(e) =>
                      handleCustomFieldChange('education', index, fieldIndex, 'key', e.target.value)
                    }
                  />
                  <RemovableInput
                    placeholder="Field Value"
                    value={field.value}
                    onChange={(e) =>
                      handleCustomFieldChange('education', index, fieldIndex, 'value', e.target.value)
                    }
                    onRemove={() => removeCustomField('education', index, fieldIndex)}
                  />
                </div>
              ))}
              
              <div className="col-span-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addCustomField('education', index)}
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
