-- CreateTable
CREATE TABLE "fit_reports" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fit_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fit_reports_partId_idx" ON "fit_reports"("partId");

-- CreateIndex
CREATE INDEX "fit_reports_userId_idx" ON "fit_reports"("userId");

-- AddForeignKey
ALTER TABLE "fit_reports" ADD CONSTRAINT "fit_reports_partId_fkey" FOREIGN KEY ("partId") REFERENCES "parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fit_reports" ADD CONSTRAINT "fit_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;