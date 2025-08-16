// prisma/seed.ts
import { PrismaClient, Role, ModerationStatus } from '../app/generated/prisma/index.js';

const prisma = new PrismaClient();

async function upsertPerson({
  slug,
  name,
  status = ModerationStatus.APPROVED,
  kunya = null as string | null,
  laqab = null as string | null,
  fatherSlug,
  motherSlug,
  variantGroup = null as string | null,
  narration = null as string | null,
  isCanonical = true,
  biographyMd = null as string | null,
  createdById,
}: {
  slug: string;
  name: string;
  status?: ModerationStatus;
  kunya?: string | null;
  laqab?: string | null;
  fatherSlug?: string;
  motherSlug?: string;
  variantGroup?: string | null;
  narration?: string | null;
  isCanonical?: boolean;
  biographyMd?: string | null;
  createdById: string;
}) {
  let fatherId: string | null = null;
  let motherId: string | null = null;

  if (fatherSlug) {
    const f = await prisma.person.findUnique({ where: { slug: fatherSlug } });
    if (f) fatherId = f.id;
  }
  if (motherSlug) {
    const m = await prisma.person.findUnique({ where: { slug: motherSlug } });
    if (m) motherId = m.id;
  }

  return prisma.person.upsert({
    where: { slug },
    create: {
      slug,
      name,
      kunya,
      laqab,
      fatherId,
      motherId,
      variantGroup,
      narration,
      isCanonical,
      status,
      biographyMd,
      createdById,
    },
    update: {
      name,
      kunya,
      laqab,
      fatherId,
      motherId,
      variantGroup,
      narration,
      isCanonical,
      status,
      biographyMd,
      updatedById: createdById,
    },
  });
}

async function main() {
  console.log('🌱 Seeding database...');

  // 1) Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { email: 'admin@example.com', name: 'Admin User', passwordHash: 'hashed-password-admin', role: Role.ADMIN },
  });

  const mod = await prisma.user.upsert({
    where: { email: 'moderator@example.com' },
    update: {},
    create: { email: 'moderator@example.com', name: 'Moderator User', passwordHash: 'hashed-password-mod', role: Role.MODERATOR },
  });

  const user1 = await prisma.user.upsert({
    where: { email: 'user1@example.com' },
    update: {},
    create: { email: 'user1@example.com', name: 'Regular User 1', passwordHash: 'hashed-password-user1', role: Role.USER },
  });

  console.log(`👤 Users ready: ${[admin.email, mod.email, user1.email].join(', ')}`);

  // 2) Sources
  const ibnHisham = await prisma.source.upsert({
    where: { id: 'src-ibn-hisham' }, // use natural IDs only if you add @id yourself; otherwise upsert via unique combo below
    update: {},
    create: {
      // If you didn't change @id, remove id and upsert by unique tuple (title)
      title: 'Sirat Ibn Hisham',
      author: 'Ibn Hisham',
      citation: 'Vol. 1, p. 1–20',
      notes: 'Classical biography of Prophet Muhammad ﷺ.',
    },
  }).catch(async () => {
    // fallback upsert by unique(title) — if you didn't add one, we simulate by find/create:
    const existing = await prisma.source.findFirst({ where: { title: 'Sirat Ibn Hisham' } });
    return existing ?? prisma.source.create({
      data: { title: 'Sirat Ibn Hisham', author: 'Ibn Hisham', citation: 'Vol. 1, p. 1–20', notes: 'Classical biography of Prophet Muhammad ﷺ.' },
    });
  });

  const ibnKathir = (await prisma.source.findFirst({ where: { title: 'Al-Bidaya wa’l-Nihaya' } })) ??
    (await prisma.source.create({
      data: { title: 'Al-Bidaya wa’l-Nihaya', author: 'Ibn Kathir', citation: 'Vol. 2', notes: 'Historical account including prophetic lineage.' },
    }));

  const tabari = (await prisma.source.findFirst({ where: { title: 'Tarikh al-Tabari' } })) ??
    (await prisma.source.create({ data: { title: 'Tarikh al-Tabari', author: 'Al-Tabari', citation: 'Vol. 1' } }));

  console.log(`📚 Sources ready`);

  // 3) People (create ancestors first, then children via fatherId/motherId)
  // Ancestors (approved)
  await upsertPerson({
    slug: 'qusayy',
    name: 'Quṣayy ibn Kilāb',
    status: ModerationStatus.APPROVED,
    createdById: admin.id,
  });

  await upsertPerson({
    slug: 'abd-manaf',
    name: 'ʿAbd Manāf ibn Quṣayy',
    status: ModerationStatus.APPROVED,
    fatherSlug: 'qusayy',
    createdById: admin.id,
  });

  await upsertPerson({
    slug: 'hashim',
    name: 'Hāshim ibn ʿAbd Manāf',
    status: ModerationStatus.APPROVED,
    fatherSlug: 'abd-manaf',
    createdById: admin.id,
  });

  await upsertPerson({
    slug: 'abdul-muttalib',
    name: 'ʿAbd al-Muṭṭalib ibn Hāshim',
    status: ModerationStatus.APPROVED,
    fatherSlug: 'hashim',
    createdById: admin.id,
  });

  const abdullah = await upsertPerson({
    slug: 'abdullah-bin-abdul-muttalib',
    name: 'ʿAbdullāh ibn ʿAbd al-Muṭṭalib',
    status: ModerationStatus.APPROVED,
    fatherSlug: 'abdul-muttalib',
    createdById: admin.id,
  });

  const amina = await upsertPerson({
    slug: 'amina-bint-wahb',
    name: 'Āminah bint Wahb',
    status: ModerationStatus.APPROVED,
    createdById: admin.id,
  });

  const muhammad = await upsertPerson({
    slug: 'prophet-muhammad',
    name: 'Prophet Muhammad ﷺ',
    kunya: 'Abu al-Qasim',
    fatherSlug: 'abdullah-bin-abdul-muttalib',
    motherSlug: 'amina-bint-wahb',
    variantGroup: 'prophet-muhammad',
    isCanonical: true,
    status: ModerationStatus.APPROVED,
    biographyMd: 'The final Prophet of Islam, born in Mecca in 570 CE.',
    createdById: admin.id,
  });

  // Variant narration (non-canonical)
  await upsertPerson({
    slug: 'prophet-muhammad-ibn-ishaq-version',
    name: 'Prophet Muhammad ﷺ (Ibn Ishaq narration)',
    fatherSlug: 'abdullah-bin-abdul-muttalib',
    motherSlug: 'amina-bint-wahb',
    variantGroup: 'prophet-muhammad',
    narration: 'Ibn Ishaq',
    isCanonical: false,
    status: ModerationStatus.PENDING_REVIEW,
    biographyMd: 'Variant lineage details per Ibn Ishaq.',
    createdById: mod.id,
  });

  console.log('👥 People & lineage ready');

  // 4) Person–Source links (idempotent-ish)
  // Avoid duplicate composite key by checking before create
  async function linkOnce(personSlug: string, sourceTitle: string, note?: string, pageRef?: string) {
    const person = await prisma.person.findUnique({ where: { slug: personSlug } });
    const source = await prisma.source.findFirst({ where: { title: sourceTitle } });
    if (!person || !source) return;
    const already = await prisma.personSource.findUnique({
      where: { personId_sourceId: { personId: person.id, sourceId: source.id } },
    }).catch(() => null);
    if (!already) {
      await prisma.personSource.create({ data: { personId: person.id, sourceId: source.id, note, pageRef } });
    }
  }

  await linkOnce('prophet-muhammad', 'Sirat Ibn Hisham', 'Biography', '1-20');
  await linkOnce('prophet-muhammad', 'Al-Bidaya wa’l-Nihaya', 'Historical reference', 'Vol. 2');
  await linkOnce('abdullah-bin-abdul-muttalib', 'Tarikh al-Tabari', 'Lineage details', 'p. 55');

  console.log('🔗 Person–Source links ready');

  // 5) Submissions (example)
  await prisma.submission.upsert({
    where: { id: 'seed-submission-1' },
    update: {},
    create: {
      id: 'seed-submission-1',
      name: 'ʿĀdnan ibn Udd',
      fatherName: 'Udd ibn Muqawwim',
      notes: 'Part of Prophet’s ancestry',
      status: ModerationStatus.PENDING_REVIEW,
      submittedByEmail: 'researcher@example.com',
    },
  });

  // 6) Reports (example)
  await prisma.report.upsert({
    where: { id: 'seed-report-1' },
    update: {},
    create: {
      id: 'seed-report-1',
      personId: muhammad.id,
      field: 'birthYear',
      currentValue: null,
      suggestedValue: '570',
      message: 'Year of the Elephant',
      status: ModerationStatus.PENDING_REVIEW,
      reporterEmail: 'historybuff@example.com',
    },
  });

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
