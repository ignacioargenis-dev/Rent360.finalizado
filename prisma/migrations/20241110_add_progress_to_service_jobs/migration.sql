-- Add progress field to service_jobs table
-- Migration: 20241110_add_progress_to_service_jobs

-- Add progress column to service_jobs table with default value 0
ALTER TABLE "service_jobs" ADD COLUMN "progress" INTEGER DEFAULT 0;

-- Add check constraint to ensure progress is between 0 and 100
ALTER TABLE "service_jobs" ADD CONSTRAINT "service_jobs_progress_check" CHECK ("progress" >= 0 AND "progress" <= 100);

-- Add comment to document the new field
COMMENT ON COLUMN "service_jobs"."progress" IS 'Progreso del trabajo en porcentaje (0-100). 0 = No iniciado, 100 = Completado';
