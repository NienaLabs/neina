import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { ResumeExtraction, Fixes } from './types';
import { FixesDisplay } from './FixesDisplay';

interface CustomSectionsProps {
  customSections: NonNullable<ResumeExtraction['customSections']>;
  handleArrayAdd: (section: keyof ResumeExtraction, newItem: unknown) => void;
  handleArrayDelete: (section: keyof ResumeExtraction, index: number) => void;
  handleNestedFieldChange: (
    section: keyof ResumeExtraction,
    index: number,
    key: string,
    value: unknown
  ) => void;
  setEditorState: React.Dispatch<React.SetStateAction<ResumeExtraction | null>>;
  fixes: Fixes;
  onUpdate: (data: ResumeExtraction['customSections']) => void;
}

/**
 * Component for editing custom sections of a resume.
 * @param customSections - The custom sections data.
 * @param handleArrayAdd - Function to add a new custom section.
 * @param handleArrayDelete - Function to delete a custom section.
 * @param handleNestedFieldChange - Function to handle changes to nested fields.
 * @param setEditorState - React state setter for the entire editor state.
 * @param fixes - The fixes object for displaying hints.
 * @returns A section component for custom sections.
 */
export const CustomSections = ({
  customSections,
  handleArrayAdd,
  handleArrayDelete,
  handleNestedFieldChange,
  setEditorState,
  fixes,
  onUpdate,
}: CustomSectionsProps) => {
  return (
    <section>
      <div className="text-xl font-semibold mb-3 flex items-center justify-between">
        <div className="flex flex-row gap-2 items-center">
          <h2 className="text-xl font-semibold mb-3">Other Sections</h2>
          <div className="p-1 mb-3 flex items-center justify-center">
            <FixesDisplay 
              fixes={fixes} 
              section="otherSections" 
              onApplyFix={(fix) => onUpdate(fix.autoFix)}
            />
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            handleArrayAdd('customSections', { sectionName: 'New Section', entries: [] })
          }
        >
          <Plus className="w-4 h-4 mr-2" /> Add Custom Section
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        {customSections.map((section, secIndex) => (
          <div key={secIndex} className="p-4 border rounded-lg bg-gray-50">
            <div className="flex justify-between items-center mb-2">
              <Input
                className="font-bold text-lg"
                value={section.sectionName}
                onChange={(e) =>
                  handleNestedFieldChange('customSections', secIndex, 'sectionName', e.target.value)
                }
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleArrayDelete('customSections', secIndex)}
              >
                <Trash2 className="size-4 text-red-500" />
              </Button>
            </div>

            {section.entries.map((entry, entryIndex) => (
              <div key={entryIndex} className="border rounded p-3 mb-3 bg-white relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1"
                  onClick={() => {
                    const updated = [...section.entries];
                    updated.splice(entryIndex, 1);
                    const updatedSections = [...customSections];
                    updatedSections[secIndex] = {
                      ...section,
                      entries: updated,
                    };
                    setEditorState((prev) => ({ ...prev!, customSections: updatedSections }));
                  }}
                >
                  <Trash2 className="size-4 text-red-500" />
                </Button>

                {Object.keys(entry).map((key) => (
                  <div key={key} className="mt-2">
                    <p className="text-sm font-medium capitalize">{key}</p>
                    <Input
                      value={entry[key as keyof typeof entry] || ''}
                      placeholder={key}
                      onChange={(e) => {
                        const updatedEntries = [...section.entries];
                        updatedEntries[entryIndex] = {
                          ...updatedEntries[entryIndex],
                          [key]: e.target.value,
                        };
                        handleNestedFieldChange('customSections', secIndex, 'entries', updatedEntries);
                      }}
                    />
                  </div>
                ))}
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newEntry =
                  section.entries.length > 0
                    ? Object.fromEntries(
                        Object.keys(section.entries[0]).map((key) => [key, ''])
                      )
                    : { title: '', description: '' }; // Default shape for the very first entry

                const updated = [...section.entries, newEntry];
                handleNestedFieldChange('customSections', secIndex, 'entries', updated);
              }}
            >
              <Plus className="w-4 h-4 mr-2" /> Add Entry
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
};
