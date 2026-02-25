-- ==========================================
-- EVENT CORE SAFE UPGRADE (NON-BREAKING)
-- ==========================================

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS start_datetime TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS end_datetime TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS capacity INTEGER CHECK (capacity > 0),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ADD COLUMN IF NOT EXISTS event_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS event_subtype VARCHAR(100),
ADD COLUMN IF NOT EXISTS scope VARCHAR(50),
ADD COLUMN IF NOT EXISTS poster_url TEXT;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_org_id ON public.events(org_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_datetime ON public.events(start_datetime);

-- Auto update updated_at
CREATE OR REPLACE FUNCTION public.update_events_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_events_time ON public.events;

CREATE TRIGGER trg_update_events_time
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_events_timestamp();

-- 1. Extend Events table for Org Admin features
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS event_scope VARCHAR(50) DEFAULT 'CENTRAL', 
ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS terms_conditions TEXT,
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ, 
ADD COLUMN IF NOT EXISTS event_manager_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL;

-- 2. Update status constraint/default
-- Existing: 'pending' (default), 'approved', 'rejected'
-- New: 'draft', 'cancelled', 'archived'
ALTER TABLE public.events ALTER COLUMN status SET DEFAULT 'draft';

-- 3. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_events_deleted_at ON public.events(deleted_at);
CREATE INDEX IF NOT EXISTS idx_events_manager ON public.events(event_manager_id);