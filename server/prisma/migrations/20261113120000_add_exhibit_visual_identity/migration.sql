-- Add optional visual identity fields; existing exhibits remain valid.
ALTER TABLE "Exhibit"
ADD COLUMN "mood" TEXT,
ADD COLUMN "styleConfig" JSONB;
