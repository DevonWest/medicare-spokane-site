import { render, screen } from '@testing-library/react';
import { LeadForm } from '@/components/LeadForm';

describe('LeadForm', () => {
  it('renders the form', () => {
    render(<LeadForm />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /get free medicare help/i })).toBeInTheDocument();
  });

  it('shows email and zip fields', () => {
    render(<LeadForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/zip code/i)).toBeInTheDocument();
  });
});
