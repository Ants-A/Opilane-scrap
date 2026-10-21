import { createMemo, createSignal, For, onMount, Show } from 'solid-js';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { TextField, TextFieldInput, TextFieldLabel, TextFieldTextArea } from './ui/text-field';
import { RadioGroup, RadioGroupItem, RadioGroupItemLabel } from './ui/radio-group';
import { Select, SelectContent, SelectItem, SelectLabel, SelectTrigger, SelectValue } from './ui/select';
import { request, type Feedback, type Student, type Subject, type Summary } from '../lib/api';

const ratings = ['Väga halb', 'Halb', 'Keskmine', 'Hea', 'Väga hea'];
type View = 'form' | 'feedback' | 'comparison';
const views: { id: View; label: string; title: string }[] = [
  { id: 'form', label: 'Anna hinnang', title: 'Hinnanguleht' },
  { id: 'feedback', label: 'Tagasiside', title: 'Tagasisideleht' },
  { id: 'comparison', label: 'Võrdlus', title: 'Võrdlemisleht' },
];
function RequiredMarker() {
  return <span class="required-marker"><span aria-hidden="true">*</span><span class="sr-only"> (kohustuslik)</span></span>;
}

export default function FeedbackApp() {
  const [view, setView] = createSignal<View>('form', { name: 'view' });
  const [student, setStudent] = createSignal<Student>({ name: '', className: '' }, { name: 'student' });
  const [subjects, setSubjects] = createSignal<Subject[]>([], { name: 'subjects' });
  const [subject, setSubject] = createSignal<Subject | null>(null, { name: 'subject' });
  const [rating, setRating] = createSignal('', { name: 'rating' });
  const [comment, setComment] = createSignal('', { name: 'comment' });
  const [feedback, setFeedback] = createSignal<Feedback[]>([], { name: 'feedback' });
  const [summary, setSummary] = createSignal<Summary[]>([], { name: 'summary' });
  const [filter, setFilter] = createSignal<Subject | null>(null, { name: 'filter' });
  const [loading, setLoading] = createSignal(true, { name: 'loading' });
  const [saving, setSaving] = createSignal(false, { name: 'saving' });
  const [saved, setSaved] = createSignal(false, { name: 'saved' });
  const [attempted, setAttempted] = createSignal(false, { name: 'attempted' });
  const [error, setError] = createSignal('', { name: 'error' });
  const [retryLoad, setRetryLoad] = createSignal(false, { name: 'retryLoad' });
  let form: HTMLFormElement | undefined;
  let heading: HTMLHeadingElement | undefined;
  const filtered = createMemo(() => feedback().filter(item => !filter() || item.subjectId === filter()!.id));
  const filteredSummary = createMemo(() => summary().find(item => item.id === filter()?.id));

  async function load() {
    setLoading(true);
    setError('');
    setRetryLoad(false);
    try {
      const [identity, options, entries, averages] = await Promise.all([
        request<Student>('/student'), request<Subject[]>('/subjects'),
        request<Feedback[]>('/feedback'), request<Summary[]>('/summary'),
      ]);
      setStudent(identity); setSubjects(options); setFeedback(entries); setSummary(averages);
    } catch {
      setRetryLoad(true);
      setError('Andmete laadimine ebaõnnestus. Kontrolli ühendust ja proovi uuesti.');
    } finally { setLoading(false); }
  }
  onMount(() => { void load(); });

  function navigate(next: View) {
    setView(next);
    queueMicrotask(() => heading?.focus());
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (saving() || loading()) return;
    setAttempted(true); setError(''); setRetryLoad(false);
    if (!student().name.trim() || !student().className.trim()) {
      setError('Õpilase nimi või klass on puudu. Palun kontrolli õpilase profiili.'); return;
    }
    if (!subject() || !rating() || comment().length > 1000) {
      queueMicrotask(() => form?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    setSaving(true);
    try {
      const entry = await request<Feedback>('/feedback', {
        method: 'POST', body: JSON.stringify({ subjectId: subject()!.id, rating: Number(rating()), comment: comment() }),
      });
      setFeedback(items => [entry, ...items]);
      setSummary(items => items.map(item => item.id !== entry.subjectId ? item : {
        ...item, responses: item.responses + 1,
        average: ((item.average ?? 0) * item.responses + entry.rating) / (item.responses + 1),
      }));
      setSaved(true);
      queueMicrotask(() => document.getElementById('success-title')?.focus());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Saatmine ebaõnnestus. Proovi uuesti.');
    } finally { setSaving(false); }
  }

  function newFeedback() {
    setSubject(null); setRating(''); setComment(''); setAttempted(false); setSaved(false); setError('');
  }

  return <div class="app-shell">
    <header class="site-header">
      <h1 ref={element => { heading = element; }} tabIndex={-1}>{views.find(item => item.id === view())?.title}</h1>
      <nav aria-label="Põhinavigatsioon">
        <For each={views}>{item => <Button variant="ghost" class="nav-button" aria-current={view() === item.id ? 'page' : undefined} onClick={() => navigate(item.id)}>{item.label}</Button>}</For>
      </nav>
    </header>

    <main class="main-stage">
      <Card class="screen-card">
        <Show when={loading()}><p class="status-text" role="status">Laadin andmeid…</p></Show>
        <Show when={error()}><div class="error-box" role="alert"><p>{error()}</p><Show when={retryLoad()}><Button variant="ghost" class="retry-button" onClick={() => void load()}>Proovi uuesti</Button></Show></div></Show>

        <Show when={view() === 'form'}>
          <Show when={!saved()} fallback={<div class="success-screen">
            <div class="success-message" role="status"><h2 id="success-title" tabIndex={-1}>Aitäh tagasiside eest!</h2><p>Tagasiside on salvestatud.</p></div>
            <Button variant="outline" class="quiet-button" onClick={newFeedback}>Anna uus hinnang</Button>
          </div>}>
            <form ref={element => { form = element; }} onSubmit={submit} noValidate aria-label="Õppeaine tagasiside" aria-busy={saving()}>
              <fieldset disabled={loading() || saving()} class="form-fields">
                <div class="identity-fields">
                  <TextField class="identity-row" value={student().name} readOnly required>
                    <TextFieldLabel>Nimi <RequiredMarker /></TextFieldLabel>
                    <TextFieldInput class="pill-input" placeholder="Õpilase nimi" title="Nimi tuleb õpilase profiilist" />
                  </TextField>
                  <TextField class="identity-row" value={student().className} readOnly required>
                    <TextFieldLabel>Klass <RequiredMarker /></TextFieldLabel>
                    <TextFieldInput class="pill-input" placeholder="Õpilase klass" title="Klass tuleb õpilase profiilist" />
                  </TextField>
                </div>

                <div class="subject-field">
                  <Select<Subject> options={subjects()} optionValue="id" optionTextValue="name" value={subject()} onChange={setSubject} required disabled={loading() || saving()} validationState={attempted() && !subject() ? 'invalid' : 'valid'} placeholder="Vali aine" itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue.name}</SelectItem>}>
                    <SelectLabel class="field-label">Õppeaine <RequiredMarker /></SelectLabel>
                    <SelectTrigger class="pill-input subject-trigger" aria-describedby={attempted() && !subject() ? 'subject-error' : undefined}><SelectValue<Subject>>{state => state.selectedOption().name}</SelectValue></SelectTrigger>
                    <SelectContent class="subject-menu" />
                  </Select>
                  <Show when={attempted() && !subject()}><p class="field-error" id="subject-error">Palun vali õppeaine.</p></Show>
                </div>

                <div class="rating-field">
                  <div class="field-label" id="rating-label">Hinnang <RequiredMarker /></div>
                  <RadioGroup name="rating" class="rating-group" value={rating()} onChange={setRating} required disabled={loading() || saving()} aria-labelledby="rating-label" aria-describedby={attempted() && !rating() ? 'rating-error' : undefined} validationState={attempted() && !rating() ? 'invalid' : 'valid'}>
                    <For each={ratings}>{(label, index) => <RadioGroupItem value={String(index() + 1)} class="rating-option"><RadioGroupItemLabel>{label}</RadioGroupItemLabel></RadioGroupItem>}</For>
                  </RadioGroup>
                  <Show when={attempted() && !rating()}><p class="field-error" id="rating-error">Palun vali hinnang 1–5.</p></Show>
                </div>

                <TextField class="comment-field" value={comment()} onChange={setComment} validationState={comment().length > 1000 ? 'invalid' : 'valid'}>
                  <TextFieldLabel class="field-label">Kommentaar <span class="optional">(valikuline)</span></TextFieldLabel>
                  <TextFieldTextArea placeholder="Kommentaar" class="comment-input" maxLength={1000} aria-describedby="comment-count" />
                  <span class="character-count" id="comment-count">{comment().length} / 1000</span>
                </TextField>
                <div class="submit-row"><Button type="submit" variant="outline" class="submit-button" disabled={loading() || saving() || !student().name || !student().className}>{saving() ? 'Saadan…' : 'Saada'}</Button></div>
              </fieldset>
            </form>
          </Show>
        </Show>

        <Show when={view() === 'feedback'}>
          <div class="overview-header">
            <Select<Subject> options={subjects()} optionValue="id" optionTextValue="name" value={filter()} onChange={setFilter} placeholder="Kõik õppeained" itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue.name}</SelectItem>}>
              <SelectTrigger aria-label="Filtreeri õppeaine järgi" class="pill-input subject-trigger"><SelectValue<Subject>>{state => state.selectedOption().name}</SelectValue></SelectTrigger>
              <SelectContent class="subject-menu" />
            </Select>
            <Show when={filter()}><Button variant="ghost" class="clear-filter" onClick={() => setFilter(null)}>Näita kõiki</Button></Show>
            <p class="overview-count">{filtered().length} vastust <Show when={filteredSummary()?.average != null}>· Keskmine {filteredSummary()!.average!.toFixed(1)}</Show></p>
          </div>
          <Show when={!loading() && !filtered().length}><p class="empty-state">Tagasisidet veel ei ole.<br />Esitatud hinnangud ilmuvad siia.</p></Show>
          <div class="feedback-list"><For each={filtered()}>{item => <article class="feedback-entry">
            <div class="feedback-subject">{item.subject}<span class="rating-badge">{item.rating} / 5</span></div>
            <div class="rating-group read-only-rating" aria-label={`Hinnang: ${ratings[item.rating - 1]}, ${item.rating} / 5`}><For each={ratings}>{(label, index) => <div class="rating-option"><span>{label}</span><span class="rating-circle" classList={{ selected: item.rating === index() + 1 }} /></div>}</For></div>
            <div class="saved-comment">{item.comment || 'Kommentaari ei lisatud.'}</div>
            <footer class="feedback-meta"><span>{item.name} · {item.className}</span><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString('et-EE')}</time></footer>
          </article>}</For></div>
        </Show>

        <Show when={view() === 'comparison'}>
          <table class="comparison-table"><caption class="sr-only">Õppeainete hinnangute võrdlus</caption><thead><tr><th scope="col">Õppeaine</th><th scope="col">Vastuseid</th><th scope="col">Keskmine</th></tr></thead>
            <tbody><For each={summary()}>{item => <tr><td>{item.name}</td><td>{item.responses}</td><td>{item.average == null ? '—' : item.average.toFixed(1)}</td></tr>}</For></tbody>
          </table>
          <Show when={!loading() && summary().every(item => item.responses === 0)}><p class="empty-state">Keskmised ilmuvad pärast esimest hinnangut.</p></Show>
        </Show>
      </Card>
    </main>
  </div>;
}
