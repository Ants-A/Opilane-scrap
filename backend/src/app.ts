import express from 'express';
import { createDatabase, type FeedbackInput } from './dbController';

export function createApp(database = createDatabase()) {
  const app = express();
  app.use(express.json({ limit: '16kb' }));
  // The starter has no login. Use a server-owned demo profile, never client-supplied identity.
  const student = {
    name: process.env.STUDENT_NAME ?? 'John Student',
    className: process.env.STUDENT_CLASS ?? 'TA-24A-2',
  };
  app.get('/api/student', (_req, res) => res.json(student));
  app.get(['/api/subjects', '/subjects'], (_req, res) => res.json(database.getSubjects()));
  app.get('/api/feedback', (_req, res) => res.json(database.getFeedback()));
  app.get('/api/summary', (_req, res) => res.json(database.getSummary()));
  app.post('/api/feedback', (req, res) => {
    const body = req.body;
    if (!student.name.trim() || !student.className.trim()) {
      res.status(422).json({ error: 'Õpilase nimi või klass on puudu.' }); return;
    }
    if (!body || !Number.isInteger(body.subjectId) || !database.getSubjects().some(s => s.id === body.subjectId)) {
      res.status(422).json({ error: 'Palun vali kehtiv õppeaine.' }); return;
    }
    if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) {
      res.status(422).json({ error: 'Hinnang peab olema täisarv vahemikus 1–5.' }); return;
    }
    if (body.comment !== undefined && (typeof body.comment !== 'string' || body.comment.length > 1000)) {
      res.status(422).json({ error: 'Kommentaar võib sisaldada kuni 1000 tähemärki.' }); return;
    }
    const input: FeedbackInput = { ...student, subjectId: body.subjectId, rating: body.rating, comment: (body.comment ?? '').trim() };
    res.status(201).json(database.addFeedback(input));
  });
  app.use((_req, res) => { res.status(404).json({ error: 'Päringut ei leitud.' }); });
  app.use((error: { type?: string }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error.type === 'entity.parse.failed' || error.type === 'entity.too.large') {
      res.status(400).json({ error: 'Päringu andmed on vigased või liiga mahukad.' }); return;
    }
    console.error(error);
    res.status(500).json({ error: 'Salvestamine ebaõnnestus. Palun proovi uuesti.' });
  });
  return app;
}
