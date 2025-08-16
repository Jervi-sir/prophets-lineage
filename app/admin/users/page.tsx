import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Role } from '@/app/generated/prisma';
import UsersManager from './users-manager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function listUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
}

/** ======= Server Actions (Users) ======= */
export async function upsertUser(formData: FormData) {
  'use server';
  const id = (formData.get('id') as string) || null;
  const email = String(formData.get('email') || '');
  const name = ((formData.get('name') as string) || '').trim() || null;
  const role = ((formData.get('role') as string) as Role) || Role.USER;

  if (!id) {
    const passwordHash = String(formData.get('passwordHash') || '');
    await prisma.user.create({ data: { email, name, role, passwordHash } });
  } else {
    await prisma.user.update({ where: { id }, data: { email, name, role } });
  }
  revalidatePath('/admin/users');
}

export async function deleteUser(formData: FormData) {
  'use server';
  const id = String(formData.get('id') || '');
  await prisma.user.delete({ where: { id } });
  revalidatePath('/admin/users');
}

export default async function Page() {
  const users = await listUsers();
  return (
    <>
      <h2 className="text-2xl font-semibold mb-4">Users</h2>
      <UsersManager users={users} upsertAction={upsertUser} deleteAction={deleteUser} />
    </>
  );
}
