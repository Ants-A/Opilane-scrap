export interface Student { name: string; className: string }
export interface Subject { id: number; name: string }
export interface Feedback {
  id: number; subjectId: number; subject: string; name: string; className: string;
  rating: number; comment: string; createdAt: string;
}
export interface Summary extends Subject { responses: number; average: number | null }

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options, headers: { 'Content-Type': 'application/json', ...options?.headers },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Serveriga ei saadud ühendust. Palun proovi uuesti.');
  }
  return response.json();
}
