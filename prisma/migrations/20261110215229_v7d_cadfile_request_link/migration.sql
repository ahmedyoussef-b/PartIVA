-- Migration: v7d_cadfile_request_link
-- Created at: 2026-11-10 21:52:29

-- Add requestId column to cad_files table
ALTER TABLE "cad_files" ADD COLUMN "requestId" TEXT;

-- Make projectId nullable in cad_files table
ALTER TABLE "cad_files" ALTER COLUMN "projectId" DROP NOT NULL;

-- Add foreign key constraint for requestId
ALTER TABLE "cad_files" ADD CONSTRAINT "cad_files_requestId_fkey" 
    FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE CASCADE;

-- Add index on requestId
CREATE INDEX "cad_files_requestId_idx" ON "cad_files"("requestId");

-- Add CAD_IGES to FileType enum
ALTER TYPE "FileType" ADD VALUE 'CAD_IGES';