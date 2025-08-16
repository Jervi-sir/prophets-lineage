import Link from 'next/link';
import React from 'react';

export const runtime = 'nodejs';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr]">
      <aside className="border-r p-4 space-y-2">
        <h1 className="text-xl font-semibold">Admin</h1>
        <nav className="mt-3 grid gap-1">
          <Link className="px-2 py-1 rounded hover:bg-muted" href="/admin/users">Users</Link>
          <Link className="px-2 py-1 rounded hover:bg-muted" href="/admin/people">People</Link>
          <Link className="px-2 py-1 rounded hover:bg-muted" href="/admin/sources">Sources</Link>
        </nav>
      </aside>
      <main className="p-6">{children}</main>
    </div>
  );
}
