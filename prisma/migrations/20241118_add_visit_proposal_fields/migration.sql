-- AlterTable: Add new columns for visit proposal system
ALTER TABLE "maintenance_visit_schedules" 
ADD COLUMN IF NOT EXISTS "proposedBy" TEXT,
ADD COLUMN IF NOT EXISTS "acceptedBy" TEXT,
ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMP(3);

-- AlterTable: Change default status to PROPOSED (only if column exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'maintenance_visit_schedules' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE "maintenance_visit_schedules" 
        ALTER COLUMN "status" SET DEFAULT 'PROPOSED';
    END IF;
END $$;

-- AddForeignKey: Add foreign key for acceptedBy (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'maintenance_visit_schedules_acceptedBy_fkey'
        AND table_name = 'maintenance_visit_schedules'
    ) THEN
        ALTER TABLE "maintenance_visit_schedules" 
        ADD CONSTRAINT "maintenance_visit_schedules_acceptedBy_fkey" 
        FOREIGN KEY ("acceptedBy") 
        REFERENCES "users"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- CreateIndex: Add index for acceptedBy (only if it doesn't exist)
CREATE INDEX IF NOT EXISTS "maintenance_visit_schedules_acceptedBy_idx" 
ON "maintenance_visit_schedules"("acceptedBy");

