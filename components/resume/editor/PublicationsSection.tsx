import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { ResumeExtraction, Fixes } from './types';
import { FixesDisplay } from './FixesDisplay';
import { RemovableInput } from './RemovableInput';

interface PublicationsSectionProps {
  publications: NonNullable<ResumeExtraction['publications']>;
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
  onUpdate: (data: ResumeExtraction['publications']) => void;
}

/**
 * Component for editing the publications section of a resume.
 * @param publications - The publications data.
 * @param handleArrayAdd - Function to add a new publication entry.
 * @param handleArrayDelete - Function to delete a publication entry.
 * @param handleNestedFieldChange - Function to handle changes to nested fields.
 * @param handleCustomFieldChange - Function to handle changes to custom fields.
 * @param addCustomField - Function to add a new custom field.
 * @param removeCustomField - Function to remove a custom field.
 * @param fixes - The fixes object for displaying hints.
 * @returns A section component for publications.
 */
export const PublicationsSection = ({
  publications,
  handleArrayAdd,
  handleArrayDelete,
  handleNestedFieldChange,
  handleCustomFieldChange,
  addCustomField,
  removeCustomField,
  fixes,
  onUpdate,
}: PublicationsSectionProps) => {
  return (
    <section>
      <div className="text-xl font-semibold mb-3 flex items-center justify-between">
        <div className="flex flex-row gap-2 items-center">
          <h2 className="text-xl font-semibold mb-3">Publications</h2>
          <div className="p-1 mb-3 flex items-center justify-center">
            <FixesDisplay
              fixes={fixes}
              section="publications"
              onApplyFix={(fix) => onUpdate(fix.autoFix)}
            />
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            handleArrayAdd('publications', {
              title: '',
              publisher: '',
              date: '',
              link: '',
              customFields: [],
            })
          }
        >
          <Plus className="w-4 h-4 mr-2" /> Add Publication
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        {/* Safeguard: ensure publications is an array */}
        {Array.isArray(publications) && publications.map((pub, index) => (
          <div key={index} className="p-4 border rounded-lg relative bg-gray-50">
            <div className="flex justify-end mb-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleArrayDelete('publications', index)}
              >
                <Trash2 className="size-4 mr-2" /> Delete Entry
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <RemovableInput
                placeholder="Title"
                value={pub.title}
                onChange={(e) =>
                  handleNestedFieldChange('publications', index, 'title', e.target.value)
                }
                onRemove={() => handleNestedFieldChange('publications', index, 'title', '')}
              />
              <RemovableInput
                placeholder="Publisher"
                value={pub.publisher}
                onChange={(e) =>
                  handleNestedFieldChange('publications', index, 'publisher', e.target.value)
                }
                onRemove={() => handleNestedFieldChange('publications', index, 'publisher', '')}
              />
              <RemovableInput
                placeholder="Date"
                value={pub.date}
                onChange={(e) =>
                  handleNestedFieldChange('publications', index, 'date', e.target.value)
                }
                onRemove={() => handleNestedFieldChange('publications', index, 'date', '')}
              />
              <RemovableInput
                placeholder="Link"
                value={pub.link}
                onChange={(e) =>
                  handleNestedFieldChange('publications', index, 'link', e.target.value)
                }
                onRemove={() => handleNestedFieldChange('publications', index, 'link', '')}
              />
              
              {/* Custom Fields */}
              {Array.isArray(pub.customFields) && pub.customFields.map((field, fieldIndex) => (
                <div key={fieldIndex} className="col-span-2 grid grid-cols-2 gap-3 bg-white p-2 rounded border">
                  <Input
                    placeholder="Field Name"
                    value={field.key}
                    onChange={(e) =>
                      handleCustomFieldChange('publications', index, fieldIndex, 'key', e.target.value)
                    }
                  />
                  <RemovableInput
                    placeholder="Field Value"
                    value={field.value}
                    onChange={(e) =>
                      handleCustomFieldChange('publications', index, fieldIndex, 'value', e.target.value)
                    }
                    onRemove={() => removeCustomField('publications', index, fieldIndex)}
                  />
                </div>
              ))}
              
              <div className="col-span-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addCustomField('publications', index)}
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
