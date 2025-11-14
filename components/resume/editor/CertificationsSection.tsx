import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { ResumeExtraction, Fixes } from './types';
import { FixesDisplay } from './FixesDisplay';

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
  fixes: Fixes;
}

/**
 * Component for editing the certifications section of a resume.
 * @param certifications - The certifications data.
 * @param handleArrayAdd - Function to add a new certification entry.
 * @param handleArrayDelete - Function to delete a certification entry.
 * @param handleNestedFieldChange - Function to handle changes to nested fields.
 * @param fixes - The fixes object for displaying hints.
 * @returns A section component for certifications.
 */
export const CertificationsSection = ({
  certifications,
  handleArrayAdd,
  handleArrayDelete,
  handleNestedFieldChange,
  fixes,
}: CertificationsSectionProps) => {
  return (
    <section>
      <div className="text-xl font-semibold flex items-center justify-between">
        <div className="flex flex-row gap-2 items-center">
          <h2 className="text-xl font-semibold mb-3">Certifications</h2>
          <div className="p-1 mb-3 flex items-center justify-center">
            <FixesDisplay fixes={fixes} section="certifications" />
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
            })
          }
        >
          <Plus className="w-4 h-4 mr-2" /> Add Certification
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        {certifications.map((cert, index) => (
          <div key={index} className="p-4 border rounded-lg relative bg-gray-50">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={() => handleArrayDelete('certifications', index)}
            >
              <Trash2 className="size-4 text-red-500" />
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Certification Name"
                value={cert.name}
                onChange={(e) =>
                  handleNestedFieldChange('certifications', index, 'name', e.target.value)
                }
              />
              <Input
                placeholder="Issuer"
                value={cert.issuer}
                onChange={(e) =>
                  handleNestedFieldChange('certifications', index, 'issuer', e.target.value)
                }
              />
              <Input
                placeholder="Year"
                value={cert.year}
                onChange={(e) =>
                  handleNestedFieldChange('certifications', index, 'year', e.target.value)
                }
              />
              <Textarea
                placeholder="Description"
                className="col-span-2"
                value={cert.description}
                onChange={(e) =>
                  handleNestedFieldChange('certifications', index, 'description', e.target.value)
                }
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
