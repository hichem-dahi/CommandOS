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
        EXECUTE format(
            'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT ''0001-01-01 00:00:00+00'';',
            tbl.table_name
        );
        
        -- Add `_deleted` column with default FALSE and NOT NULL constraint
        EXECUTE format(
            'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS _deleted BOOLEAN NOT NULL DEFAULT FALSE;',
            tbl.table_name
        );
    END LOOP;
END $$;
