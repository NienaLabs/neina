import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { ResumeExtraction, Fixes } from './types';
import { FixesDisplay } from './FixesDisplay';
import { RemovableInput } from './RemovableInput';

interface CertificationsSectionProps {
  certifications: NonNullable<ResumeExtraction['certifications']>;
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
  onUpdate: (data: ResumeExtraction['certifications']) => void;
}

/**
 * Component for editing the certifications section of a resume.
 * @param certifications - The certifications data.
 * @param handleArrayAdd - Function to add a new certification entry.
 * @param handleArrayDelete - Function to delete a certification entry.
 * @param handleNestedFieldChange - Function to handle changes to nested fields.
 * @param handleCustomFieldChange - Function to handle changes to custom fields.
 * @param addCustomField - Function to add a new custom field.
 * @param removeCustomField - Function to remove a custom field.
 * @param fixes - The fixes object for displaying hints.
 * @returns A section component for certifications.
 */
export const CertificationsSection = ({
  certifications,
  handleArrayAdd,
  handleArrayDelete,
  handleNestedFieldChange,
  handleCustomFieldChange,
  addCustomField,
  removeCustomField,
  fixes,
  onUpdate,
}: CertificationsSectionProps) => {
  return (
    <section>
      <div className="text-xl font-semibold flex items-center justify-between">
        <div className="flex flex-row gap-2 items-center">
          <h2 className="text-xl font-semibold mb-3">Certifications</h2>
          <div className="p-1 mb-3 flex items-center justify-center">
            <FixesDisplay
              fixes={fixes}
              section="certifications"
              onApplyFix={(fix) => onUpdate(fix.autoFix)}
            />
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            handleArrayAdd('certifications', {
              name: '',
              issuer: '',
              year: '',
              description: '',
              customFields: [],
            })
          }
        >
          <Plus className="w-4 h-4 mr-2" /> Add Certification
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        {/* Safeguard: ensure certifications is an array */}
        {Array.isArray(certifications) && certifications.map((cert, index) => (
          <div key={index} className="p-4 border rounded-lg relative bg-gray-50">
            <div className="flex justify-end mb-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleArrayDelete('certifications', index)}
              >
                <Trash2 className="size-4 mr-2" /> Delete Entry
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <RemovableInput
                placeholder="Certification Name"
                value={cert.name}
                onChange={(e) =>
                  handleNestedFieldChange('certifications', index, 'name', e.target.value)
                }
                onRemove={() => handleNestedFieldChange('certifications', index, 'name', '')}
              />
              <RemovableInput
                placeholder="Issuer"
                value={cert.issuer}
                onChange={(e) =>
                  handleNestedFieldChange('certifications', index, 'issuer', e.target.value)
                }
                onRemove={() => handleNestedFieldChange('certifications', index, 'issuer', '')}
              />
              <RemovableInput
                placeholder="Year"
                value={cert.year}
                onChange={(e) =>
                  handleNestedFieldChange('certifications', index, 'year', e.target.value)
                }
                onRemove={() => handleNestedFieldChange('certifications', index, 'year', '')}
              />
              <div className="col-span-2">
                <Textarea
                  placeholder="Description"
                  className="w-full"
                  value={cert.description}
                  onChange={(e) =>
                    handleNestedFieldChange('certifications', index, 'description', e.target.value)
                  }
                />
              </div>
              
              {/* Custom Fields */}
              {Array.isArray(cert.customFields) && cert.customFields.map((field, fieldIndex) => (
                <div key={fieldIndex} className="col-span-2 grid grid-cols-2 gap-3 bg-white p-2 rounded border">
                  <Input
                    placeholder="Field Name"
                    value={field.key}
                    onChange={(e) =>
                      handleCustomFieldChange('certifications', index, fieldIndex, 'key', e.target.value)
                    }
                  />
                  <RemovableInput
                    placeholder="Field Value"
                    value={field.value}
                    onChange={(e) =>
                      handleCustomFieldChange('certifications', index, fieldIndex, 'value', e.target.value)
                    }
                    onRemove={() => removeCustomField('certifications', index, fieldIndex)}
                  />
                </div>
              ))}
              
              <div className="col-span-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addCustomField('certifications', index)}
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
