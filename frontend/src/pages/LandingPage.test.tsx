import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from './LandingPage';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: false }),
}));

describe('LandingPage', () => {
  it('renders hero copy and switches campus preview tabs', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/campus life/i);
    expect(screen.getByText('Find a group you’ll come back to.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Events' }));
    expect(screen.getByText('Make room for something new.')).toBeInTheDocument();
  });

  it('opens and steps through the campus preview modal', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /take a look around/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/1 of 3/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/2 of 3/i)).toBeInTheDocument();
  });
});
