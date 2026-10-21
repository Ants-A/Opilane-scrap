import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from './app';
import { createDatabase } from './dbController';
import type { Server } from 'node:http';

const temporary = mkdtempSync(join(tmpdir(), 'feedback-test-'));
const filename = join(temporary, 'feedback.sqlite');
const database = createDatabase(filename);
let server: Server;
let origin: string;
beforeAll(async () => {
  server = createApp(database).listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address() as { port: number };
  origin = `http://127.0.0.1:${address.port}`;
});
afterAll(() => { server.close(); database.close(); rmSync(temporary, { recursive: true, force: true }); });
const post = (body: unknown) => fetch(`${origin}/api/feedback`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

describe('feedback API', () => {
  test('returns the read-only student profile and real subject list', async () => {
    const student = await (await fetch(`${origin}/api/student`)).json();
    expect(student.name).toBeTruthy(); expect(student.className).toBeTruthy();
    expect((await (await fetch(`${origin}/api/subjects`)).json()).length).toBe(6);
  });
  test.each([
    [{ rating: 3 }, 'missing subject'],
    [{ subjectId: 999, rating: 3 }, 'unknown subject'],
    [{ subjectId: 1 }, 'missing rating'],
    [{ subjectId: 1, rating: 0 }, 'rating below range'],
    [{ subjectId: 1, rating: 6 }, 'rating above range'],
    [{ subjectId: 1, rating: 2.5 }, 'fractional rating'],
    [{ subjectId: 1, rating: '3' }, 'non-numeric rating'],
    [{ subjectId: 1, rating: 3, comment: 'a'.repeat(1001) }, 'long comment'],
    [{ subjectId: 1, rating: 3, comment: 123 }, 'invalid comment'],
  ])('rejects %s (%s)', async (body) => {
    const response = await post(body);
    expect(response.status).toBe(422);
    expect((await response.json()).error).toBeTruthy();
  });
  test('saves optional comments and ignores attempts to replace the profile', async () => {
    const response = await post({ subjectId: 1, rating: 5, name: 'Forged name', className: 'Forged class' });
    expect(response.status).toBe(201);
    const entry = await response.json();
    const identity = await (await fetch(`${origin}/api/student`)).json();
    expect(entry.name).toBe(identity.name); expect(entry.className).toBe(identity.className);
    expect(entry.comment).toBe(''); expect(entry.subject).toBe('Bioloogia');
    expect(Number.isNaN(Date.parse(entry.createdAt))).toBe(false);
  });
  test('preserves feedback on reopening the database and calculates aggregates', async () => {
    await post({ subjectId: 1, rating: 3, comment: '  Selged tunnid.  ' });
    const reopened = createDatabase(filename);
    expect(reopened.getFeedback()[0]!.comment).toBe('Selged tunnid.');
    const summary = reopened.getSummary();
    expect(summary[0]!.responses).toBe(2); expect(summary[0]!.average).toBe(4);
    expect(summary[1]!.responses).toBe(0); expect(summary[1]!.average).toBeNull();
    reopened.close();
  });
  test('handles malformed JSON without a server error', async () => {
    const response = await fetch(`${origin}/api/feedback`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
    expect(response.status).toBe(400);
  });
  test.each(['STUDENT_NAME', 'STUDENT_CLASS'])('blocks a missing profile field: %s', async (field) => {
    const previous = process.env[field];
    process.env[field] = '';
    const missingProfileServer = createApp(database).listen(0, '127.0.0.1');
    if (previous === undefined) delete process.env[field]; else process.env[field] = previous;
    await new Promise<void>(resolve => missingProfileServer.once('listening', resolve));
    try {
      const address = missingProfileServer.address() as { port: number };
      const response = await fetch(`http://127.0.0.1:${address.port}/api/feedback`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subjectId: 1, rating: 4 }) });
      expect(response.status).toBe(422);
    } finally { missingProfileServer.close(); }
  });
});
