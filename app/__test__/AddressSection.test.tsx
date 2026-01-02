import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AddressSection } from '../../components/resume/editor/AddressSection';

// Mock the icons
jest.mock('lucide-react', () => ({
  User: () => <div data-testid="icon-user" />,
  Mail: () => <div data-testid="icon-mail" />,
  MapPin: () => <div data-testid="icon-map-pin" />,
  Phone: () => <div data-testid="icon-phone" />,
  Linkedin: () => <div data-testid="icon-linkedin" />,
  Github: () => <div data-testid="icon-github" />,
  Globe: () => <div data-testid="icon-globe" />,
  Link: () => <div data-testid="icon-link" />,
  Plus: () => <div data-testid="icon-plus" />,
}));

// Mock DropdownMenu components to avoid Recoil/Radix issues in JSDOM
jest.mock('../../components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

describe('AddressSection', () => {
  const mockHandleAddressChange = jest.fn();
  const mockHandleOtherLinksChange = jest.fn();
  const mockAddNewOtherLink = jest.fn();
  const mockOnUpdate = jest.fn();

  const defaultProps = {
    address: {
      email: 'test@example.com',
      location: 'Test City',
    },
    handleAddressChange: mockHandleAddressChange,
    handleOtherLinksChange: mockHandleOtherLinksChange,
    addNewOtherLink: mockAddNewOtherLink,
    fixes: {},
    onUpdate: mockOnUpdate,
  };

  it('renders the Personal Details header with User icon', () => {
    render(<AddressSection {...defaultProps} />);
    expect(screen.getByText('Personal Details')).toBeInTheDocument();
    expect(screen.getByTestId('icon-user')).toBeInTheDocument();
  });

  it('renders existing fields with correct icons', () => {
    render(<AddressSection {...defaultProps} />);
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByTestId('icon-mail')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByTestId('icon-map-pin')).toBeInTheDocument();
  });

  it('shows based on missing fields', () => {
    // Missing telephone, linkedInProfile, githubProfile, portfolio
    render(<AddressSection {...defaultProps} />);
    expect(screen.getByText('Add Field')).toBeInTheDocument();
  });

  it('renders the missing fields in the dropdown (mocked as visible)', () => {
    render(<AddressSection {...defaultProps} />);
    // With our mock, content is always rendered, which is fine for verifying presence logic
    expect(screen.getByText('Telephone')).toBeInTheDocument();
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
  });

  it('calls handleAddressChange when a missing field is clicked', () => {
    render(<AddressSection {...defaultProps} />);
    
    // In our mock, DropdownMenuItem triggers onClick directly
    const githubOption = screen.getByText('GitHub');
    fireEvent.click(githubOption);

    expect(mockHandleAddressChange).toHaveBeenCalledWith('githubProfile', '');
  });

  it('does not show "Add Field" button when all fields are present', () => {
    const allFieldsAddress = {
      email: 'test@example.com',
      location: 'Test City',
      telephone: '1234567890',
      linkedInProfile: 'linkedin.com/in/test',
      githubProfile: 'github.com/test',
      portfolio: 'test.com',
    };
    render(<AddressSection {...defaultProps} address={allFieldsAddress} />);
    expect(screen.queryByText('Add Field')).not.toBeInTheDocument();
  });
});
