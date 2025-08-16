import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // expected body:
    // {
    //   personSlug: string
    //   field?: string | null
    //   currentValue?: string | null
    //   suggestedValue?: string | null
    //   sourceText?: string | null
    //   message: string
    //   reporterEmail?: string | null
    //   intent?: 'REPORT' | 'SUGGEST'  // optional semantic marker
    // }

    const {
      personSlug,
      field = null,
      currentValue = null,
      suggestedValue = null,
      sourceText = null,
      message,
      reporterEmail = null,
      intent = null,
    } = body || {};

    if (!personSlug || !message) {
      return NextResponse.json({ error: 'personSlug and message are required' }, { status: 400 });
    }

    const person = await prisma.person.findUnique({ where: { slug: personSlug }, select: { id: true } });
    if (!person) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim() || null;

    const report = await prisma.report.create({
      data: {
        personId: person.id,
        field,
        currentValue,
        suggestedValue,
        sourceText,
        message: intent ? `[${intent}] ${message}` : message,
        reporterEmail,
        reporterIp: ip,
        status: 'PENDING_REVIEW',
      },
    });

    return NextResponse.json({ ok: true, id: report.id });
  } catch (e) {
    console.error('Report POST failed', e);
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
  }
}
