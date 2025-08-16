import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });

  const p = await prisma.person.findUnique({
    where: { slug },
    select: {
      id: true, slug: true, name: true, birthYear: true, deathYear: true,
      father: { select: { id: true, name: true, slug: true } },
      mother: { select: { id: true, name: true, slug: true } },
      biographyMd: true,
    },
  });
  if (!p) return NextResponse.json({ error: 'not found' }, { status: 404 });

  return NextResponse.json(p);
}
