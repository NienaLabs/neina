import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Plus,
  User,
  Mail,
  MapPin,
  Phone,
  Linkedin,
  Github,
  Globe,
  Link as LinkIcon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ResumeExtraction, Fixes } from './types';
import { FixesDisplay } from './FixesDisplay';

interface AddressSectionProps {
  address: NonNullable<ResumeExtraction['address']>;
  personalInfo: NonNullable<ResumeExtraction['personalInfo']>;
  handleAddressChange: (key: keyof NonNullable<ResumeExtraction['address']>, value: string) => void;
  handlePersonalInfoChange: (key: keyof NonNullable<ResumeExtraction['personalInfo']>, value: string) => void;
  handleOtherLinksChange: (index: number, value: string) => void;
  addNewOtherLink: () => void;
  fixes: Fixes;
  onUpdate: (data: ResumeExtraction['address']) => void;
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
  personalInfo,
  handleAddressChange,
  handlePersonalInfoChange,
  handleOtherLinksChange,
  addNewOtherLink,
  fixes,
  onUpdate,
}: AddressSectionProps) => {
  const fieldAttributes: Partial<
    Record<
      keyof NonNullable<ResumeExtraction['address']>,
      { label: string; icon: React.ReactNode }
    >
  > = {
    email: { label: 'Email', icon: <Mail className="w-4 h-4" /> },
    location: { label: 'Location', icon: <MapPin className="w-4 h-4" /> },
    telephone: { label: 'Telephone', icon: <Phone className="w-4 h-4" /> },
    linkedInProfile: { label: 'LinkedIn', icon: <Linkedin className="w-4 h-4" /> },
    githubProfile: { label: 'GitHub', icon: <Github className="w-4 h-4" /> },
    portfolio: { label: 'Portfolio', icon: <Globe className="w-4 h-4" /> },
  };

  const allFields = Object.keys(fieldAttributes) as (keyof NonNullable<
    ResumeExtraction['address']
  >)[];
  const currentFields = Object.keys(address) as (keyof NonNullable<
    ResumeExtraction['address']
  >)[];
  const missingFields = allFields.filter(
    (field) => !currentFields.includes(field) && field !== 'otherLinks'
  );

  const addField = (field: keyof NonNullable<ResumeExtraction['address']>) => {
    handleAddressChange(field, '');
  };

  return (
    <section>
      <div className="flex flex-row gap-2 items-center">
        <div className="flex items-center gap-2 mb-3">
          <User className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Personal Details</h2>
        </div>
        <div className="p-1 mb-3 flex items-center justify-center">
          <FixesDisplay
            fixes={fixes}
            section="address"
            onApplyFix={(fix) => onUpdate(fix.autoFix)}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4 p-4 border rounded-lg bg-white/50">
           <div className="col-span-1">
              <p className="font-medium mb-1 text-sm">Full Name</p>
              <Input 
                  value={personalInfo.name || ''} 
                  onChange={(e) => handlePersonalInfoChange('name', e.target.value)}
                  placeholder="Your Full Name"
                  className="bg-white"
              />
           </div>
           <div className="col-span-1">
              <p className="font-medium mb-1 text-sm">Job Title</p>
              <Input 
                  value={personalInfo.title || ''} 
                  onChange={(e) => handlePersonalInfoChange('title', e.target.value)}
                  placeholder="Professional Title"
                  className="bg-white"
              />
           </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.keys(address).map((key) => {
          if (key === 'otherLinks') {
            return (
              <div key={key} className="col-span-full">
                 <div className="flex items-center gap-2 mb-1">
                  <LinkIcon className="w-4 h-4" />
                  <p className="font-medium">Other Links</p>
                </div>
                <div className="flex flex-col gap-2">
                  {address.otherLinks?.map((link, i) => (
                    <Input
                      key={i}
                      value={link}
                      onChange={(e) => handleOtherLinksChange(i, e.target.value)}
                      placeholder={`Link ${i + 1}`}
                    />
                  ))}
                  <Button
                    onClick={addNewOtherLink}
                    variant="outline"
                    size="sm"
                    className="w-fit"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Link
                  </Button>
                </div>
              </div>
            );
          }

          const fieldKey = key as keyof NonNullable<ResumeExtraction['address']>;
          const attributes = fieldAttributes[fieldKey];

          return (
            <div key={key}>
              <div className="flex items-center gap-2 mb-1">
                {attributes?.icon}
                <p className="font-medium capitalize">
                  {attributes?.label || key}
                </p>
              </div>
              <Input
                value={address[fieldKey] ?? ''}
                onChange={(e) => handleAddressChange(fieldKey, e.target.value)}
                placeholder={attributes?.label || key}
              />
            </div>
          );
        })}
        {missingFields.length > 0 && (
          <div className="col-span-full mt-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" /> Add Field
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {missingFields.map((field) => (
                  <DropdownMenuItem key={field} onClick={() => addField(field)}>
                    {fieldAttributes[field]?.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </section>
  );
};
