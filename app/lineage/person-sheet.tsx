'use client';

import * as React from 'react';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export type PersonDetail = {
  id: string;
  slug: string;
  name: string;
  birthYear?: number | null;
  deathYear?: number | null;
  father?: { id: string; name: string; slug: string } | null;
  mother?: { id: string; name: string; slug: string } | null;
  biographyMd?: string | null;
};

// Simple module-level cache (survives re-renders, resets on HMR/full reload)
const personCache = new Map<string, PersonDetail>();

// Prefetch helper you can use from anywhere (e.g., node hover)
export async function prefetchPerson(slug: string) {
  if (!slug || personCache.has(slug)) return;
  const res = await fetch(`/api/person?slug=${encodeURIComponent(slug)}`);
  if (!res.ok) return;
  const data = (await res.json()) as PersonDetail;
  personCache.set(slug, data);
}

type PersonSheetProps = {
  open: boolean;
  slug: string | null;
  onOpenChange: (open: boolean) => void;

  // When user clicks "Father" / "Mother"
  onRequestSlugChange?: (slug: string) => void;

  // Optional: override default "Open full page" behavior
  onOpenFullPage?: (slug: string) => void;

  // Optional: control side/size
  side?: 'right' | 'left' | 'bottom' | 'top';
  className?: string;
};

export function PersonSheet({
  open,
  slug,
  onOpenChange,
  onRequestSlugChange,
  onOpenFullPage,
  side = 'right',
  className,
}: PersonSheetProps) {
  const [loading, setLoading] = React.useState(false);
  const [person, setPerson] = React.useState<PersonDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Load person (with cache + abort on change)
  React.useEffect(() => {
    let aborted = false;
    const ctrl = new AbortController();

    async function load() {
      setError(null);

      if (!open || !slug) {
        setPerson(null);
        return;
      }

      // Serve from cache immediately if present
      const cached = personCache.get(slug);
      if (cached) {
        setPerson(cached);
        return;
      }

      setLoading(true);
      setPerson(null);

      try {
        const res = await fetch(`/api/person?slug=${encodeURIComponent(slug)}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }
        const data = (await res.json()) as PersonDetail;
        if (aborted) return;
        personCache.set(slug, data);
        setPerson(data);
      } catch (e: any) {
        if (aborted || e?.name === 'AbortError') return;
        setError('Could not load data.');
        setPerson(null);
      } finally {
        if (!aborted) setLoading(false);
      }
    }

    load();
    return () => {
      aborted = true;
      ctrl.abort();
    };
  }, [open, slug]);

  const title = loading ? 'Loading…' : person?.name ?? (error ? 'Error' : 'Person');
  const sub =
    person
      ? [person.birthYear ? `b. ${person.birthYear}` : null, person.deathYear ? `d. ${person.deathYear}` : null]
          .filter(Boolean)
          .join(' • ') || '—'
      : '—';

  const handleOpenFullPage = () => {
    if (!slug) return;
    if (onOpenFullPage) onOpenFullPage(slug);
    else window.open(`/person/${slug}`, '_blank');
  };

  const goTo = (nextSlug?: string | null) => {
    if (!nextSlug || !onRequestSlugChange) return;
    onRequestSlugChange(nextSlug);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} className={className ?? 'w-[420px] sm:w-[520px] overflow-y-auto'}>
        <SheetHeader className="space-y-1">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{sub}</SheetDescription>
        </SheetHeader>

        <div className="px-6 pb-4 text-sm space-y-4">
          {/* Loading state */}
          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-4 w-40" />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
              <Skeleton className="h-24 w-full" />
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-destructive">
              {error}
              <div className="mt-2">
                <Button size="sm" onClick={() => personCache.delete(slug ?? '') || onOpenChange(true)}>
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* Content */}
          {!loading && !error && person && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-muted-foreground">Father</div>
                  <div className="font-medium">
                    {person.father ? (
                      <button
                        className="underline underline-offset-2"
                        onClick={() => goTo(person.father!.slug)}
                      >
                        {person.father.name}
                      </button>
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Mother</div>
                  <div className="font-medium">
                    {person.mother ? (
                      <button
                        className="underline underline-offset-2"
                        onClick={() => goTo(person.mother!.slug)}
                      >
                        {person.mother.name}
                      </button>
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
              </div>

              {person.biographyMd && (
                <div className="pt-2">
                  <div className="text-muted-foreground mb-1">Notes</div>
                  <div className="whitespace-pre-wrap">{person.biographyMd}</div>
                </div>
              )}

              <ReportForm slug={slug!} person={person} />
            </>
          )}
        </div>

        <SheetFooter>
          <Button onClick={handleOpenFullPage} disabled={!slug}>
            Open full page
          </Button>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}


function ReportForm({
  slug,
  person,
}: {
  slug: string;
  person: PersonDetail | null;
}) {
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // smart defaults
  const defaultField =
    !person ? '' :
    !person.father ? 'fatherId' :
    !person.mother ? 'motherId' :
    ''; // if both exist, leave it empty

  const [intent, setIntent] = React.useState<'REPORT' | 'SUGGEST'>(
    defaultField ? 'SUGGEST' : 'REPORT'
  );
  const [field, setField] = React.useState<string>(defaultField);
  const [currentValue, setCurrentValue] = React.useState<string>(() => {
    if (!person) return '';
    if (defaultField === 'fatherId') return '(missing)';
    if (defaultField === 'motherId') return '(missing)';
    return '';
  });
  const [suggestedValue, setSuggestedValue] = React.useState<string>('');
  const [sourceText, setSourceText] = React.useState<string>('');
  const [message, setMessage] = React.useState<string>('');
  const [email, setEmail] = React.useState<string>('');

  // If user chooses a field we know, try to auto-fill current value
  React.useEffect(() => {
    if (!person) return;
    if (field === 'name') setCurrentValue(person.name || '');
    else if (field === 'fatherId') setCurrentValue(person.father?.name || '(missing)');
    else if (field === 'motherId') setCurrentValue(person.mother?.name || '(missing)');
    else if (field === 'birthYear') setCurrentValue(person.birthYear?.toString() || '');
    else if (field === 'deathYear') setCurrentValue(person.deathYear?.toString() || '');
    else setCurrentValue(''); // unknown field
  }, [field, person]);

  const submit = async () => {
    setSubmitting(true);
    setDone(false);
    setError(null);
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personSlug: slug,
          intent,
          field: field || null,
          currentValue: currentValue || null,
          suggestedValue: suggestedValue || null,
          sourceText: sourceText || null,
          message,
          reporterEmail: email || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Unknown error');
      setDone(true);
      // reset form minimal
      setSuggestedValue('');
      setSourceText('');
      setMessage('');
    } catch (e: any) {
      setError(e?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (!slug) return null;

  return (
    <div className="mt-6 rounded-md border p-3">
      <div className="flex-col">
        <h3 className="font-medium pb-2">Report / Suggest</h3>
        <div className="flex gap-2">
          <button
            type="button"
            className={`text-xs px-2 py-1 rounded border ${intent === 'REPORT' ? 'bg-muted' : ''}`}
            onClick={() => setIntent('REPORT')}
          >
            Report an error
          </button>
          <button
            type="button"
            className={`text-xs px-2 py-1 rounded border ${intent === 'SUGGEST' ? 'bg-muted' : ''}`}
            onClick={() => setIntent('SUGGEST')}
          >
            Suggest addition
          </button>
        </div>
      </div>

      <div className="grid gap-2 mt-3">
        <label className="text-xs text-muted-foreground">Field</label>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={field}
          onChange={(e) => setField(e.target.value)}
        >
          <option value="">(general)</option>
          <option value="name">Name</option>
          <option value="fatherId">Father</option>
          <option value="motherId">Mother</option>
          <option value="birthYear">Birth Year</option>
          <option value="deathYear">Death Year</option>
          <option value="gender">Gender</option>
          <option value="type">Type</option>
          <option value="biographyMd">Notes / Biography</option>
          <option value="other">Other</option>
        </select>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Current value</label>
            <input
              className="border rounded px-2 py-1 w-full text-sm"
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              placeholder="(optional)"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Suggested value</label>
            <input
              className="border rounded px-2 py-1 w-full text-sm"
              value={suggestedValue}
              onChange={(e) => setSuggestedValue(e.target.value)}
              placeholder={
                field === 'fatherId' ? 'e.g., Father name or slug' :
                field === 'motherId' ? 'e.g., Mother name or slug' :
                'Your suggested correction'
              }
            />
            {/* Helper for common “add new” case when a parent is missing */}
            {(field === 'fatherId' && (!person?.father)) && (
              <p className="text-xs text-muted-foreground mt-1">
                You can enter a <strong>new</strong> person name here. Moderators will create/link it.
              </p>
            )}
            {(field === 'motherId' && (!person?.mother)) && (
              <p className="text-xs text-muted-foreground mt-1">
                You can enter a <strong>new</strong> person name here. Moderators will create/link it.
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Source / citation (optional)</label>
          <textarea
            className="border rounded px-2 py-1 w-full text-sm"
            rows={3}
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Quote or reference (book/page/link)…"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Explanation</label>
          <textarea
            className="border rounded px-2 py-1 w-full text-sm"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Explain what should change and why"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Email (optional)</label>
          <input
            className="border rounded px-2 py-1 w-full text-sm"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
          />
        </div>

        {error && (
          <div className="text-destructive text-sm">{error}</div>
        )}
        {done && (
          <div className="text-green-600 text-sm">Thanks! Your report was submitted.</div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            className="px-3 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50 text-sm"
            onClick={submit}
            disabled={submitting || !message}
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
