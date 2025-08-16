-- CreateEnum
CREATE TYPE "public"."ModerationStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'MODERATOR');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Person" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kunya" TEXT,
    "laqab" TEXT,
    "birthYear" INTEGER,
    "deathYear" INTEGER,
    "gender" TEXT,
    "fatherId" TEXT,
    "motherId" TEXT,
    "variantGroup" TEXT,
    "narration" TEXT,
    "isCanonical" BOOLEAN NOT NULL DEFAULT true,
    "biographyMd" TEXT,
    "status" "public"."ModerationStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Source" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "citation" TEXT,
    "url" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PersonSource" (
    "personId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "note" TEXT,
    "pageRef" TEXT,

    CONSTRAINT "PersonSource_pkey" PRIMARY KEY ("personId","sourceId")
);

-- CreateTable
CREATE TABLE "public"."Report" (
    "id" TEXT NOT NULL,
    "personId" TEXT,
    "field" TEXT,
    "currentValue" TEXT,
    "suggestedValue" TEXT,
    "sourceText" TEXT,
    "message" TEXT NOT NULL,
    "status" "public"."ModerationStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "reporterEmail" TEXT,
    "reporterIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Submission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fatherName" TEXT,
    "motherName" TEXT,
    "linkedFatherId" TEXT,
    "linkedMotherId" TEXT,
    "sourceText" TEXT,
    "notes" TEXT,
    "status" "public"."ModerationStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "submittedByEmail" TEXT,
    "submittedIp" TEXT,
    "approvedPersonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Person_slug_key" ON "public"."Person"("slug");

-- CreateIndex
CREATE INDEX "Person_status_idx" ON "public"."Person"("status");

-- CreateIndex
CREATE INDEX "Person_fatherId_idx" ON "public"."Person"("fatherId");

-- CreateIndex
CREATE INDEX "Person_motherId_idx" ON "public"."Person"("motherId");

-- CreateIndex
CREATE INDEX "Person_variantGroup_idx" ON "public"."Person"("variantGroup");

-- CreateIndex
CREATE INDEX "Person_isCanonical_idx" ON "public"."Person"("isCanonical");

-- CreateIndex
CREATE INDEX "PersonSource_sourceId_idx" ON "public"."PersonSource"("sourceId");

-- CreateIndex
CREATE INDEX "Report_personId_idx" ON "public"."Report"("personId");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "public"."Report"("status");

-- CreateIndex
CREATE INDEX "Submission_status_idx" ON "public"."Submission"("status");

-- CreateIndex
CREATE INDEX "Submission_approvedPersonId_idx" ON "public"."Submission"("approvedPersonId");

-- AddForeignKey
ALTER TABLE "public"."Person" ADD CONSTRAINT "Person_fatherId_fkey" FOREIGN KEY ("fatherId") REFERENCES "public"."Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Person" ADD CONSTRAINT "Person_motherId_fkey" FOREIGN KEY ("motherId") REFERENCES "public"."Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Person" ADD CONSTRAINT "Person_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Person" ADD CONSTRAINT "Person_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PersonSource" ADD CONSTRAINT "PersonSource_personId_fkey" FOREIGN KEY ("personId") REFERENCES "public"."Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PersonSource" ADD CONSTRAINT "PersonSource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "public"."Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_personId_fkey" FOREIGN KEY ("personId") REFERENCES "public"."Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Submission" ADD CONSTRAINT "Submission_approvedPersonId_fkey" FOREIGN KEY ("approvedPersonId") REFERENCES "public"."Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
