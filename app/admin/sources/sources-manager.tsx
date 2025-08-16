'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { format } from 'date-fns';

type SourceRow = {
  id: string; title: string; author: string | null; url: string | null; citation: string | null; notes: string | null; updatedAt: string;
};

export default function SourcesManager({
  sources,
  upsertAction,
  deleteAction,
}: {
  sources: SourceRow[];
  upsertAction: (fd: FormData) => Promise<void>;
  deleteAction: (fd: FormData) => Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<SourceRow | null>(null);

  const openCreate = () => { setEditing(null); setOpen(true); };
  const openEdit = (s: SourceRow) => { setEditing(s); setOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <span className="text-muted-foreground">{sources.length} sources</span>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openCreate}>New Source</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Edit Source' : 'Create Source'}</DialogTitle></DialogHeader>
            <form action={upsertAction} className="grid gap-3">
              <input type="hidden" name="id" value={editing?.id || ''} />
              <Input name="title" placeholder="Title" defaultValue={editing?.title || ''} required />
              <div className="grid grid-cols-2 gap-3">
                <Input name="author" placeholder="Author" defaultValue={editing?.author || ''} />
                <Input name="url" placeholder="URL" defaultValue={editing?.url || ''} />
              </div>
              <Input name="citation" placeholder="Citation" defaultValue={editing?.citation || ''} />
              <Textarea name="notes" placeholder="Notes" defaultValue={editing?.notes || ''} />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" onClick={() => setOpen(false)}>Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="[&>th]:px-3 [&>th]:py-2 text-left">
              <th>Title</th><th>Author</th><th>URL</th><th>Citation</th><th>Updated</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sources.map(s => (
              <tr key={s.id} className="[&>td]:px-3 [&>td]:py-2 border-t">
                <td>{s.title}</td>
                <td>{s.author || '—'}</td>
                <td className="truncate max-w-[280px]">
                  {s.url ? <a className="text-blue-600 underline" href={s.url} target="_blank">{s.url}</a> : '—'}
                </td>
                <td>{s.citation || '—'}</td>
                <td>{format(new Date(s.updatedAt), 'yyyy-MM-dd HH:mm')}</td>
                <td className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(s)}>Edit</Button>
                  <form action={deleteAction} onSubmit={(e)=>{ if(!confirm('Delete source?')) e.preventDefault(); }}>
                    <input type="hidden" name="id" value={s.id} />
                    <Button size="sm" variant="destructive" type="submit">Delete</Button>
                  </form>
                </td>
              </tr>
            ))}
            {!sources.length && (
              <tr><td className="p-3 text-muted-foreground" colSpan={6}>No sources.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
