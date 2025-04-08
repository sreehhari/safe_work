-- CreateTable
CREATE TABLE "results" (
    "id" TEXT NOT NULL,
    "helmets" INTEGER NOT NULL DEFAULT 0,
    "vests" INTEGER NOT NULL DEFAULT 0,
    "siteId" TEXT NOT NULL,
    "sitePointId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "results_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "results" ADD CONSTRAINT "results_sitePointId_fkey" FOREIGN KEY ("sitePointId") REFERENCES "sitepoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
