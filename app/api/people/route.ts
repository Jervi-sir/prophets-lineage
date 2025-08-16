import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";


export async function GET() {
  try {
    const people = await prisma.person.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        type: true,
      },
    });
    return NextResponse.json(people);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch people" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const people = await request.json();
    await prisma.person.createMany({
      data: people.map((person: any) => ({
        id: person.id,
        slug: person.slug,
        name: person.name,
        type: person.type,
        kunya: person.kunya,
        laqab: person.laqab,
        birthYear: person.birthYear,
        deathYear: person.deathYear,
        gender: person.gender,
        fatherId: person.fatherId,
        motherId: person.motherId,
        variantGroup: person.variantGroup,
        narration: person.narration,
        isCanonical: person.isCanonical,
        biographyMd: person.biographyMd,
        status: person.status,
      })),
    });
    return NextResponse.json({ message: "People created successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create people" },
      { status: 500 }
    );
  }
}