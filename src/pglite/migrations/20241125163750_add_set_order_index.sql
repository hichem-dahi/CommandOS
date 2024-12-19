drop trigger if exists "trigger_increment_doc_index" on "public"."orders";

drop function if exists "public"."increment_doc_index"();

set check_function_bodies = off;


CREATE OR REPLACE FUNCTION public.set_order_index()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  max_index INTEGER;
BEGIN
   -- Ensure the trigger is only executed for inserts, not conflict resolution updates
    IF NOT EXISTS (SELECT 1 FROM orders WHERE id = NEW.id) THEN
      -- Get the highest index for the organization (org_id)
      SELECT COALESCE(MAX(index), 0) INTO max_index
      FROM orders
      WHERE org_id = NEW.org_id;

      -- Set the NEW index value to be the max index + 1
      NEW.index := max_index + 1;
    END IF;
   RETURN NEW;
END;$function$
;

CREATE TRIGGER before_insert_order BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_order_index();



