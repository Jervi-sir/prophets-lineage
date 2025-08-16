'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { ModerationStatus, PersonType } from '@/app/generated/prisma';
import { PersonCombobox } from './person-combobox';

type PersonRow = {
  id: string; name: string; slug: string; narration: string | null; type: PersonType;
  isCanonical: boolean; status: ModerationStatus; fatherId: string | null; motherId: string | null; updatedAt: string;
};

export default function PeopleManager({
  people,
  upsertAction,
  deleteAction,
}: {
  people: PersonRow[];
  upsertAction: (fd: FormData) => Promise<void>;
  deleteAction: (fd: FormData) => Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<PersonRow | null>(null);

  const openCreate = () => { setEditing(null); setOpen(true); };
  const openEdit = (p: PersonRow) => { setEditing(p); setOpen(true); };
  const baseOptions = React.useMemo(
    () => people.map(p => ({ id: p.id, name: p.name, slug: p.slug })),
    [people]
  );
  const parentOptions = React.useMemo(
    () => editing ? baseOptions.filter(o => o.id !== editing.id) : baseOptions,
    [baseOptions, editing]
  );
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <span className="text-muted-foreground">{people.length} people</span>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openCreate}>New Person</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Edit Person' : 'Create Person'}</DialogTitle></DialogHeader>

            <form action={upsertAction} className="grid gap-3">
              <input type="hidden" name="id" value={editing?.id || ''} />
              <Input name="name" placeholder="Name" defaultValue={editing?.name || ''} required />
              <Input name="slug" placeholder="Slug" defaultValue={editing?.slug || ''} required />
              <Input name="narration" placeholder="Narration" defaultValue={editing?.narration || ''} />

              <Select name="type" defaultValue={editing?.type || 'PERSON'}>
                <SelectTrigger className="w-full" ><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERSON">شخص</SelectItem>
                  <SelectItem value="MESSENGER">نبي</SelectItem>
                  <SelectItem value="PROPHET">رسول</SelectItem>
                  <SelectItem value="MESSENGER_PROPHET">نبي\رسول</SelectItem>
                </SelectContent>
              </Select>


              <div className="flex items-center gap-2">
                <Checkbox id="isCanonical" name="isCanonical" defaultChecked={editing?.isCanonical ?? true} />
                <label htmlFor="isCanonical" className="text-sm">isCanonical</label>
              </div>

              <Select name="status" defaultValue={editing?.status || 'PENDING_REVIEW'}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING_REVIEW">PENDING_REVIEW</SelectItem>
                  <SelectItem value="APPROVED">APPROVED</SelectItem>
                  <SelectItem value="REJECTED">REJECTED</SelectItem>
                </SelectContent>
              </Select>

              <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
                <PersonCombobox
                  name="fatherId"
                  label="Father"
                  options={parentOptions}
                  defaultValue={editing?.fatherId || ""}
                  placeholder="Select father…"
                />
                <PersonCombobox
                  name="motherId"
                  label="Mother"
                  options={parentOptions}
                  defaultValue={editing?.motherId || ""}
                  placeholder="Select mother…"
                />
              </div>


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
              <th>Name</th><th>Slug</th><th>Narration</th><th>Canon</th><th>Status</th><th>Parents</th><th>Updated</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {people.map(p => (
              <tr key={p.id} className="[&>td]:px-3 [&>td]:py-2 border-t">
                <td>{p.name}</td>
                <td>{p.slug}</td>
                <td>{p.narration || '—'}</td>
                <td>{p.isCanonical ? 'Yes' : 'No'}</td>
                <td>{p.status}</td>
                <td className="text-xs">
                  <div>F: {p.fatherId ? p.fatherId.slice(0, 6) + '…' : '—'}</div>
                  <div>M: {p.motherId ? p.motherId.slice(0, 6) + '…' : '—'}</div>
                </td>
                <td>{format(new Date(p.updatedAt), 'yyyy-MM-dd HH:mm')}</td>
                <td className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(p)}>Edit</Button>
                  <form action={deleteAction} onSubmit={(e) => { if (!confirm('Delete person?')) e.preventDefault(); }}>
                    <input type="hidden" name="id" value={p.id} />
                    <Button size="sm" variant="destructive" type="submit">Delete</Button>
                  </form>
                </td>
              </tr>
            ))}
            {!people.length && (
              <tr><td className="p-3 text-muted-foreground" colSpan={8}>No people.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
