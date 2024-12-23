set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.increment_doc_index()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  new_index integer;
  exists_in_db boolean;
BEGIN
  -- Check if the ID exists in the database with status = 1
  SELECT EXISTS (
    SELECT 1
    FROM orders
    WHERE id = NEW.id AND status = 1
  )
  INTO exists_in_db;

  -- Only proceed if the order status is being updated to 'Confirmed' (1), and it doesn't already exist in the database with status = 1
  IF NEW.status = 1 AND NOT exists_in_db THEN
    -- Fetch the current maximum index for the specified document type and organization
    SELECT COALESCE(MAX(doc_index), 0) + 1
    INTO new_index
    FROM orders
    WHERE document_type = NEW.document_type
      AND org_id = NEW.org_id;

    -- Set the new doc_index for the current order
    NEW.doc_index = new_index;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE TRIGGER trigger_increment_doc_index BEFORE INSERT OR UPDATE ON public.orders FOR EACH ROW WHEN ((new.status = 1)) EXECUTE FUNCTION increment_doc_index();


