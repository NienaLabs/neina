import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ResumeExtraction, Fixes } from './types';
import { FixesDisplay } from './FixesDisplay';

interface AddressSectionProps {
  address: NonNullable<ResumeExtraction['address']>;
  handleAddressChange: (key: keyof NonNullable<ResumeExtraction['address']>, value: string) => void;
  handleOtherLinksChange: (index: number, value: string) => void;
  addNewOtherLink: () => void;
  fixes: Fixes;
}

/**
 * Component for editing the address section of a resume.
 * @param address - The address data.
 * @param handleAddressChange - Function to handle changes to address fields.
 * @param handleOtherLinksChange - Function to handle changes to other links.
 * @param addNewOtherLink - Function to add a new other link.
 * @param fixes - The fixes object for displaying hints.
 * @returns A section component for the address.
 */
export const AddressSection = ({
  address,
  handleAddressChange,
  handleOtherLinksChange,
  addNewOtherLink,
  fixes,
}: AddressSectionProps) => {
  return (
    <section>
      <div className="flex flex-row gap-2 items-center">
        <h2 className="text-xl font-semibold mb-3">Address</h2>
        <div className="p-1 mb-3 flex items-center justify-center">
          <FixesDisplay fixes={fixes} section="address" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Object.keys(address).map((key) => {
          if (key === 'otherLinks') {
            return (
              <div key={key} className="col-span-3">
                <p className="font-medium mb-1">Other Links</p>
                <div className="flex flex-col gap-2">
                  {address.otherLinks?.map((link, i) => (
                    <Input
                      key={i}
                      value={link}
                      onChange={(e) => handleOtherLinksChange(i, e.target.value)}
                      placeholder={`Link ${i + 1}`}
                    />
                  ))}
                  <Button onClick={addNewOtherLink} variant="outline" size="sm" className="w-fit">
                    <Plus className="w-4 h-4 mr-2" /> Add Link
                  </Button>
                </div>
              </div>
            );
          }

          return (
            <div key={key}>
              <p className="font-medium mb-1 capitalize">{key}</p>
              <Input
                value={address[key as keyof ResumeExtraction['address']] ?? ''}
                onChange={(e) =>
                  handleAddressChange(key as keyof ResumeExtraction['address'], e.target.value)
                }
                placeholder={key}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};
