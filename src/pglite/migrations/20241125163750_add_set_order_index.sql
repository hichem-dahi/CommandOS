drop trigger if exists "trigger_increment_doc_index" on "public"."orders";

drop function if exists "public"."increment_doc_index"();

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.set_order_index()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare
  max_index integer;
begin
   IF NEW.index IS NULL THEN
        -- Get the highest index for the organization (org_id)
        SELECT COALESCE(MAX(index), 0) INTO max_index
        FROM orders
        WHERE org_id = NEW.org_id;

        -- Set the NEW index value to be the max index + 1
        NEW.index := max_index + 1;
      END IF;
  return NEW;
end;
$function$
;

CREATE TRIGGER before_insert_order BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_order_index();



