import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ModerationStatus, PersonType } from '@/app/generated/prisma';
import PeopleManager from './people-manager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function listPeople() {
  return prisma.person.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 100,
    select: {
      id: true, name: true, slug: true, narration: true, isCanonical: true, type: true,
      status: true, fatherId: true, motherId: true, updatedAt: true,
    },
  });
}

/** ======= Server Actions (People) ======= */
export async function upsertPerson(formData: FormData) {
  'use server';
  const id = (formData.get('id') as string) || null;
  const name = String(formData.get('name') || '');
  const slug = String(formData.get('slug') || '');
  const narration = ((formData.get('narration') as string) || '').trim() || null;
  const isCanonical = formData.get('isCanonical') === 'on';
  const status = ((formData.get('status') as string) as ModerationStatus) || 'PENDING_REVIEW';
  const fatherId = ((formData.get('fatherId') as string) || '').trim() || null;
  const motherId = ((formData.get('motherId') as string) || '').trim() || null;
  const type = (formData.get('type') as PersonType) || 'PERSON';

  const data = { name, slug, narration, isCanonical, status, fatherId, motherId, type };
  if (!id) await prisma.person.create({ data });
  else await prisma.person.update({ where: { id }, data });

  revalidatePath('/admin/people');
}

export async function deletePerson(formData: FormData) {
  'use server';
  const id = String(formData.get('id') || '');
  await prisma.person.delete({ where: { id } });
  revalidatePath('/admin/people');
}

export default async function Page() {
  const people = await listPeople();
  return (
    <>
      <h2 className="text-2xl font-semibold mb-4">People</h2>
      <PeopleManager people={people} upsertAction={upsertPerson} deleteAction={deletePerson} />
    </>
  );
}
