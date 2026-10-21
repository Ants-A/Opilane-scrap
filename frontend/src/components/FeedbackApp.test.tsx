import { cleanup, fireEvent, render, waitFor } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import FeedbackApp from './FeedbackApp';

const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockImplementation(async (url: string) => {
    const values: Record<string, unknown> = {
      '/api/student': { name: 'John Student', className: 'TA-24A-2' },
      '/api/subjects': [{ id: 1, name: 'Bioloogia' }],
      '/api/feedback': [],
      '/api/summary': [{ id: 1, name: 'Bioloogia', responses: 0, average: null }],
    };
    return new Response(JSON.stringify(values[url]), { status: 200 });
  });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); fetchMock.mockReset(); });

describe('feedback form', () => {
  test('uses required read-only profile fields and an optional comment', async () => {
    const screen = render(() => <FeedbackApp />);
    await waitFor(() => expect(screen.getByRole('textbox', { name: /Nimi/ })).toHaveValue('John Student'));
    expect(screen.getByRole('textbox', { name: /Nimi/ })).toHaveAttribute('readonly');
    expect(screen.getByRole('textbox', { name: /Klass/ })).toHaveAttribute('readonly');
    expect(screen.getByRole('textbox', { name: /Kommentaar/ })).not.toBeRequired();
    expect(screen.container.querySelectorAll('form .required-marker')).toHaveLength(4);
  });
  test('explains missing subject and rating without posting feedback', async () => {
    const screen = render(() => <FeedbackApp />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Saada' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Saada' }));
    expect(await screen.findByText('Palun vali õppeaine.')).toBeVisible();
    expect(screen.getByText('Palun vali hinnang 1–5.')).toBeVisible();
    expect(fetchMock.mock.calls.some(([, options]) => options?.method === 'POST')).toBe(false);
  });
  test('shows a load error and recovers on retry', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network unavailable'));
    const screen = render(() => <FeedbackApp />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Andmete laadimine ebaõnnestus.');
    fireEvent.click(screen.getByRole('button', { name: 'Proovi uuesti' }));
    await waitFor(() => expect(screen.getByRole('textbox', { name: /Nimi/ })).toHaveValue('John Student'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
