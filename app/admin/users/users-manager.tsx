'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Role } from '@/app/generated/prisma';

type UserRow = { id: string; email: string; name: string | null; role: Role; createdAt: string };

export default function UsersManager({
  users,
  upsertAction,
  deleteAction,
}: {
  users: UserRow[];
  upsertAction: (fd: FormData) => Promise<void>;
  deleteAction: (fd: FormData) => Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<UserRow | null>(null);

  const openCreate = () => { setEditing(null); setOpen(true); };
  const openEdit = (u: UserRow) => { setEditing(u); setOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <span className="text-muted-foreground">{users.length} users</span>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>New User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit User' : 'Create User'}</DialogTitle>
            </DialogHeader>

            <form action={upsertAction} className="grid gap-3">
              <input type="hidden" name="id" value={editing?.id || ''} />
              <Input name="email" placeholder="Email" defaultValue={editing?.email || ''} required />
              <Input name="name" placeholder="Name" defaultValue={editing?.name || ''} />

              <Select name="role" defaultValue={editing?.role || 'USER'}>
                <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                  <SelectItem value="MODERATOR">MODERATOR</SelectItem>
                  <SelectItem value="USER">USER</SelectItem>
                </SelectContent>
              </Select>

              {!editing && (
                <Input name="passwordHash" placeholder="Password Hash (pre-hashed)" required />
              )}

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
              <th>Email</th><th>Name</th><th>Role</th><th>Created</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="[&>td]:px-3 [&>td]:py-2 border-t">
                <td>{u.email}</td>
                <td>{u.name || '—'}</td>
                <td>{u.role}</td>
                <td>{format(new Date(u.createdAt), 'yyyy-MM-dd HH:mm')}</td>
                <td className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(u)}>Edit</Button>
                  <form action={deleteAction} onSubmit={(e) => { if (!confirm('Delete user?')) e.preventDefault(); }}>
                    <input type="hidden" name="id" value={u.id} />
                    <Button size="sm" variant="destructive" type="submit">Delete</Button>
                  </form>
                </td>
              </tr>
            ))}
            {!users.length && (
              <tr><td className="p-3 text-muted-foreground" colSpan={5}>No users.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
