import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { ResumeExtraction, Fixes } from './types';
import { FixesDisplay } from './FixesDisplay';
import { RemovableInput } from './RemovableInput';

interface AwardsSectionProps {
  awards: NonNullable<ResumeExtraction['awards']>;
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
  onUpdate: (data: ResumeExtraction['awards']) => void;
}

/**
 * Component for editing the awards section of a resume.
 * @param awards - The awards data.
 * @param handleArrayAdd - Function to add a new award entry.
 * @param handleArrayDelete - Function to delete an award entry.
 * @param handleNestedFieldChange - Function to handle changes to nested fields.
 * @param handleCustomFieldChange - Function to handle changes to custom fields.
 * @param addCustomField - Function to add a new custom field.
 * @param removeCustomField - Function to remove a custom field.
 * @param fixes - The fixes object for displaying hints.
 * @returns A section component for awards.
 */
export const AwardsSection = ({
  awards,
  handleArrayAdd,
  handleArrayDelete,
  handleNestedFieldChange,
  handleCustomFieldChange,
  addCustomField,
  removeCustomField,
  fixes,
  onUpdate,
}: AwardsSectionProps) => {
  return (
    <section>
      <div className="text-xl font-semibold mb-3 flex items-center justify-between">
        <div className="flex flex-row gap-2 items-center">
          <h2 className="text-xl font-semibold mb-3">Awards</h2>
          <div className="p-1 mb-3 flex items-center justify-center">
            <FixesDisplay
              fixes={fixes}
              section="awards"
              onApplyFix={(fix) => onUpdate(fix.autoFix)}
            />
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            handleArrayAdd('awards', {
              title: '',
              issuer: '',
              year: '',
              customFields: [],
            })
          }
        >
          <Plus className="w-4 h-4 mr-2" /> Add Award
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        {awards.map((award, index) => (
          <div key={index} className="p-4 border rounded-lg relative bg-gray-50">
            <div className="flex justify-end mb-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleArrayDelete('awards', index)}
              >
                <Trash2 className="size-4 mr-2" /> Delete Entry
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <RemovableInput
                placeholder="Title"
                value={award.title}
                onChange={(e) =>
                  handleNestedFieldChange('awards', index, 'title', e.target.value)
                }
                onRemove={() => handleNestedFieldChange('awards', index, 'title', '')}
              />
              <RemovableInput
                placeholder="Issuer"
                value={award.issuer}
                onChange={(e) =>
                  handleNestedFieldChange('awards', index, 'issuer', e.target.value)
                }
                onRemove={() => handleNestedFieldChange('awards', index, 'issuer', '')}
              />
              <RemovableInput
                placeholder="Year"
                value={award.year}
                onChange={(e) =>
                  handleNestedFieldChange('awards', index, 'year', e.target.value)
                }
                onRemove={() => handleNestedFieldChange('awards', index, 'year', '')}
              />
              
              {/* Custom Fields */}
              {award.customFields?.map((field, fieldIndex) => (
                <div key={fieldIndex} className="col-span-2 grid grid-cols-2 gap-3 bg-white p-2 rounded border">
                  <Input
                    placeholder="Field Name"
                    value={field.key}
                    onChange={(e) =>
                      handleCustomFieldChange('awards', index, fieldIndex, 'key', e.target.value)
                    }
                  />
                  <RemovableInput
                    placeholder="Field Value"
                    value={field.value}
                    onChange={(e) =>
                      handleCustomFieldChange('awards', index, fieldIndex, 'value', e.target.value)
                    }
                    onRemove={() => removeCustomField('awards', index, fieldIndex)}
                  />
                </div>
              ))}
              
              <div className="col-span-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addCustomField('awards', index)}
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
