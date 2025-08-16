import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type Node = {
  id: string;
  data: { label: string; slug: string };
  position: { x: number; y: number };
};

type Edge = {
  id: string;
  source: string;
  target: string;
  type?: string;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rootSlug = searchParams.get('rootSlug') || undefined;

  // Base filter: canonical & approved
  const baseWhere = {
    isCanonical: true,
    status: 'APPROVED' as const,
  };

  // If a root is specified, include everyone for now (simpler).
  // You can narrow to ancestors/descendants later if needed.
  const people = await prisma.person.findMany({
    where: baseWhere,
    select: {
      id: true,
      slug: true,
      name: true,
      gender: true,
      fatherId: true,
      motherId: true,
      type: true
    },
  });

  // Optional: If rootSlug provided, filter to connected component around root
  // Quick pass: if provided, keep only persons reachable by parent/child links (simple flood fill)
  let filtered = people;
  if (rootSlug) {
    const map = new Map(people.map(p => [p.id, p]));
    const bySlug = people.find(p => p.slug === rootSlug);
    if (bySlug) {
      const adj = new Map<string, Set<string>>();
      const add = (a: string, b: string) => {
        if (!adj.has(a)) adj.set(a, new Set());
        adj.get(a)!.add(b);
      };
      for (const p of people) {
        if (p.fatherId) { add(p.fatherId, p.id); add(p.id, p.fatherId); }
        if (p.motherId) { add(p.motherId, p.id); add(p.id, p.motherId); }
      }
      const seen = new Set<string>();
      const stack = [bySlug.id];
      while (stack.length) {
        const cur = stack.pop()!;
        if (seen.has(cur)) continue;
        seen.add(cur);
        const neigh = adj.get(cur);
        if (neigh) for (const n of neigh) if (!seen.has(n)) stack.push(n);
      }
      filtered = people.filter(p => seen.has(p.id));
    }
  }

  // Build nodes
  const nodes: Node[] = filtered.map(p => ({
    id: p.id,
    data: {
      label: p.name,
      slug: p.slug,
      gender: p.gender, 
      type: p.type
    },
    position: { x: 0, y: 0 },
  }));


  // Build edges (parent -> child)
  const edges: Edge[] = [];
  for (const p of filtered) {
    if (p.fatherId && filtered.find(f => f.id === p.fatherId)) {
      edges.push({ id: `e-${p.fatherId}-${p.id}`, source: p.fatherId, target: p.id, type: 'smoothstep' });
    }
    if (p.motherId && filtered.find(m => m.id === p.motherId)) {
      edges.push({ id: `e-${p.motherId}-${p.id}`, source: p.motherId, target: p.id, type: 'smoothstep' });
    }
  }

  console.log('nodes: ', nodes)

  return NextResponse.json({ nodes, edges });
}
