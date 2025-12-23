import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { ResumeExtraction, Fixes } from './types';
import { FixesDisplay } from './FixesDisplay';
import { JSX } from 'react';
import { RemovableInput } from './RemovableInput';

interface ProjectsSectionProps {
  projects: NonNullable<ResumeExtraction['projects']>;
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
  onUpdate: (data: ResumeExtraction['projects']) => void;
}

/**
 * Component for editing the projects section of a resume.
 * @param projects - The projects data.
 * @param handleArrayAdd - Function to add a new project entry.
 * @param handleArrayDelete - Function to delete a project entry.
 * @param handleNestedFieldChange - Function to handle changes to nested fields.
 * @param handleCustomFieldChange - Function to handle changes to custom fields.
 * @param addCustomField - Function to add a new custom field.
 * @param removeCustomField - Function to remove a custom field.
 * @param renderStringArray - Utility function to render string arrays.
 * @param fixes - The fixes object for displaying hints.
 * @returns A section component for projects.
 */
export const ProjectsSection = ({
  projects,
  handleArrayAdd,
  handleArrayDelete,
  handleNestedFieldChange,
  handleCustomFieldChange,
  addCustomField,
  removeCustomField,
  renderStringArray,
  fixes,
  onUpdate,
}: ProjectsSectionProps) => {
  return (
    <section>
      <div className="text-xl font-semibold flex items-center justify-between">
        <div className="flex flex-row gap-2 items-center">
          <h2 className="text-xl font-semibold mb-3">Projects</h2>
          <div className="p-1 mb-3 flex items-center justify-center">
            <FixesDisplay 
              fixes={fixes} 
              section="projects" 
              onApplyFix={(fix) => onUpdate(fix.autoFix)}
            />
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            handleArrayAdd('projects', {
              name: '',
              description: '',
              technologies: [''],
              role: '',
              link: '',
              customFields: [],
            })
          }
        >
          <Plus className="w-4 h-4 mr-2" /> Add Project
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        {/* Safeguard: ensure projects is an array */}
        {Array.isArray(projects) && projects.map((proj, index) => (
          <div key={index} className="p-4 border rounded-lg relative bg-gray-50">
            <div className="flex justify-end mb-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleArrayDelete('projects', index)}
              >
                <Trash2 className="size-4 mr-2" /> Delete Entry
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <RemovableInput
                placeholder="Project Name"
                value={proj.name}
                onChange={(e) => handleNestedFieldChange('projects', index, 'name', e.target.value)}
                onRemove={() => handleNestedFieldChange('projects', index, 'name', '')}
              />
              <RemovableInput
                placeholder="Role"
                value={proj.role}
                onChange={(e) => handleNestedFieldChange('projects', index, 'role', e.target.value)}
                onRemove={() => handleNestedFieldChange('projects', index, 'role', '')}
              />
              <div className="col-span-2">
                <Textarea
                  className="w-full"
                  placeholder="Description"
                  value={proj.description}
                  onChange={(e) =>
                    handleNestedFieldChange('projects', index, 'description', e.target.value)
                  }
                />
              </div>
              <div className="col-span-2">
                <p className="font-medium">Technologies</p>
                {renderStringArray('projects', index, 'technologies', proj.technologies)}
              </div>
              <div className="col-span-2">
                <RemovableInput
                  placeholder="Project Link"
                  value={proj.link}
                  onChange={(e) => handleNestedFieldChange('projects', index, 'link', e.target.value)}
                  onRemove={() => handleNestedFieldChange('projects', index, 'link', '')}
                />
              </div>
              
              {/* Custom Fields */}
              {Array.isArray(proj.customFields) && proj.customFields.map((field, fieldIndex) => (
                <div key={fieldIndex} className="col-span-2 grid grid-cols-2 gap-3 bg-white p-2 rounded border">
                  <Input
                    placeholder="Field Name"
                    value={field.key}
                    onChange={(e) =>
                      handleCustomFieldChange('projects', index, fieldIndex, 'key', e.target.value)
                    }
                  />
                  <RemovableInput
                    placeholder="Field Value"
                    value={field.value}
                    onChange={(e) =>
                      handleCustomFieldChange('projects', index, fieldIndex, 'value', e.target.value)
                    }
                    onRemove={() => removeCustomField('projects', index, fieldIndex)}
                  />
                </div>
              ))}
              
              <div className="col-span-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addCustomField('projects', index)}
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
