import { prisma } from '@/lib/prisma';

export default async function PersonPage({ params }: { params: { slug: string } }) {
  const person = await prisma.person.findUnique({
    where: { slug: params.slug },
    select: {
      name: true,
      slug: true,
      father: { select: { name: true, slug: true } },
      mother: { select: { name: true, slug: true } },
      biographyMd: true,
    },
  });

  if (!person) return <div className="p-8">Not found.</div>;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold">{person.name}</h1>
      <div className="mt-2 text-sm text-slate-600">/{person.slug}</div>
      <div className="mt-4 space-y-1 text-sm">
        <div>Father: {person.father?.name ?? '—'}</div>
        <div>Mother: {person.mother?.name ?? '—'}</div>
      </div>
      {person.biographyMd && (
        <pre className="whitespace-pre-wrap mt-6 text-sm bg-slate-50 p-4 rounded">
          {person.biographyMd}
        </pre>
      )}
    </div>
  );
}
