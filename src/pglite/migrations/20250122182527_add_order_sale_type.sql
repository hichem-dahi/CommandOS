create type "public"."sale_type" as enum ('order', 'sale');

alter table "public"."orders" add column "type" sale_type not null default 'order'::sale_type;

CREATE OR REPLACE FUNCTION "public"."set_order_index"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  max_index INTEGER;
BEGIN
  -- Ensure the trigger is only executed for inserts, not conflict resolution updates
  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE id = NEW.id) THEN
    -- Only set the index if NEW.index is NULL
    IF NEW.index IS NULL THEN
      -- Get the highest index for the organization (org_id)
      SELECT COALESCE(MAX(index), 0) INTO max_index
      FROM public.orders
      WHERE type = NEW.type AND org_id = NEW.org_id;

      -- Set the NEW index value to be the max index + 1
      NEW.index := max_index + 1;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;



