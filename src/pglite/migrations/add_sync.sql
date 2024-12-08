DO $$ 
DECLARE 
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    LOOP
        -- Add `_synced` column with default FALSE
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS _synced BOOLEAN DEFAULT FALSE;', tbl.table_name);

        -- Add `updated_at` column with type TEXT if it doesn't exist
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS updated_at TEXT;', tbl.table_name);
    END LOOP;
END $$;
