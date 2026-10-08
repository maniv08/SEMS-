import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders correctly with default props', () => {
    render(<Button>Click Me</Button>);
    const btn = screen.getByRole('button', { name: /click me/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveClass('bg-brand text-white'); // default is primary
  });

  it('renders danger variant correctly', () => {
    render(<Button variant="danger">Delete</Button>);
    const btn = screen.getByRole('button', { name: /delete/i });
    expect(btn).toHaveClass('bg-critical text-white');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
