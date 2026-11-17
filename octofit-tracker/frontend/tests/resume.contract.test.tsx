import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App.js';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('resume customizer', () => {
  it('submits both inputs and displays the customized resume and review terms', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      tailoredResume: 'Relevant highlights\nBuilt Python APIs\n\nOriginal resume\nBuilt Python APIs',
      matchedKeywords: ['python'],
      missingKeywords: ['kubernetes'],
    }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/resume']}><App /></MemoryRouter>);
    await user.type(screen.getByLabelText('Resume'), 'Built Python APIs');
    await user.type(screen.getByLabelText('Job description'), 'Python and Kubernetes');
    await user.click(screen.getByRole('button', { name: /customize resume/i }));
    await screen.findByRole('heading', { name: 'Customized resume' });
    expect(fetchMock).toHaveBeenCalledWith('/api/resume/customize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume: 'Built Python APIs', jobDescription: 'Python and Kubernetes' }),
    });
    expect(screen.getByText(/Relevant highlights/)).toHaveTextContent('Built Python APIs');
    expect(screen.getByText('python')).toBeInTheDocument();
    expect(screen.getByText('kubernetes')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Resume'), ' updated');
    expect(screen.queryByRole('heading', { name: 'Customized resume' })).not.toBeInTheDocument();
  });

  it('announces loading and request errors', async () => {
    let resolveRequest!: (response: Response) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((resolve) => { resolveRequest = resolve; })));
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/resume']}><App /></MemoryRouter>);
    await user.type(screen.getByLabelText('Resume'), 'Resume');
    await user.type(screen.getByLabelText('Job description'), 'Job');
    await user.click(screen.getByRole('button', { name: /customize resume/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/customizing/i);
    resolveRequest(new Response('', { status: 500 }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/unable/i));
  });
});
