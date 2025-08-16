import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import SourcesManager from './sources-manager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function listSources() {
  return prisma.source.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 100,
    select: { id: true, title: true, author: true, url: true, citation: true, notes: true, updatedAt: true },
  });
}

/** ======= Server Actions (Sources) ======= */
export async function upsertSource(formData: FormData) {
  'use server';
  const id = (formData.get('id') as string) || null;
  const title = String(formData.get('title') || '');
  const author = ((formData.get('author') as string) || '').trim() || null;
  const url = ((formData.get('url') as string) || '').trim() || null;
  const citation = ((formData.get('citation') as string) || '').trim() || null;
  const notes = ((formData.get('notes') as string) || '').trim() || null;

  const data = { title, author, url, citation, notes };
  if (!id) await prisma.source.create({ data });
  else await prisma.source.update({ where: { id }, data });

  revalidatePath('/admin/sources');
}

export async function deleteSource(formData: FormData) {
  'use server';
  const id = String(formData.get('id') || '');
  await prisma.source.delete({ where: { id } });
  revalidatePath('/admin/sources');
}

export default async function Page() {
  const sources = await listSources();
  return (
    <>
      <h2 className="text-2xl font-semibold mb-4">Sources</h2>
      <SourcesManager sources={sources} upsertAction={upsertSource} deleteAction={deleteSource} />
    </>
  );
}
