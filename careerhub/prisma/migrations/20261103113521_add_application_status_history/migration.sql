-- CreateTable
CREATE TABLE "application_status_event" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_status_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "application_status_event_applicationId_createdAt_idx" ON "application_status_event"("applicationId", "createdAt");

-- AddForeignKey
ALTER TABLE "application_status_event" ADD CONSTRAINT "application_status_event_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "job_application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
