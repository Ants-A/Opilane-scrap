import { Database } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export interface Subject { id: number; name: string }
export interface FeedbackInput { subjectId: number; name: string; className: string; rating: number; comment: string }
export interface Feedback extends FeedbackInput { id: number; subject: string; createdAt: string }
interface Summary extends Subject { responses: number; average: number | null }

export function createDatabase(filename = process.env.DATABASE_PATH || resolve(import.meta.dir, '../data/feedback.sqlite')) {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const db = new Database(filename, { create: true, strict: true });
  db.exec(`PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS subjects (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE);
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subjectId INTEGER NOT NULL REFERENCES subjects(id),
      name TEXT NOT NULL CHECK(length(trim(name)) > 0),
      className TEXT NOT NULL CHECK(length(trim(className)) > 0),
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment TEXT NOT NULL DEFAULT '' CHECK(length(comment) <= 1000),
      createdAt TEXT NOT NULL
    );`);
  const seed = db.query('INSERT OR IGNORE INTO subjects (id, name) VALUES (?, ?)');
  const names = ['Bioloogia', 'Keemia', 'Matemaatika', 'Eesti keel', 'Geograafia', 'Andmebaasid'];
  db.transaction(() => names.forEach((name, index) => seed.run(index + 1, name)))();
  const feedbackSql = `SELECT f.*, s.name AS subject FROM feedback f JOIN subjects s ON s.id = f.subjectId`;
  return {
    getSubjects: () => db.query<Subject, []>('SELECT id, name FROM subjects ORDER BY id').all(),
    getFeedback: () => db.query<Feedback, []>(`${feedbackSql} ORDER BY f.id DESC`).all(),
    getSummary: () => db.query<Summary, []>(`SELECT s.id, s.name, COUNT(f.id) AS responses, AVG(f.rating) AS average
      FROM subjects s LEFT JOIN feedback f ON f.subjectId = s.id GROUP BY s.id ORDER BY s.id`).all(),
    addFeedback(input: FeedbackInput) {
      const result = db.query(`INSERT INTO feedback (subjectId, name, className, rating, comment, createdAt) VALUES (?, ?, ?, ?, ?, ?)`)
        .run(input.subjectId, input.name, input.className, input.rating, input.comment, new Date().toISOString());
      return db.query<Feedback, [number]>(`${feedbackSql} WHERE f.id = ?`).get(Number(result.lastInsertRowid))!;
    },
    close: () => db.close(),
  };
}
