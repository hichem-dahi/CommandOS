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
    IF NOT EXISTS (SELECT 1 FROM public.orders WHERE id = NEW.id) THEN
      -- Get the highest index for the organization (org_id)
      SELECT COALESCE(MAX(index), 0) INTO max_index
      FROM  public.orders
      WHERE org_id = NEW.org_id;

      -- Set the NEW index value to be the max index + 1
      NEW.index := max_index + 1;
    END IF;
   RETURN NEW;
END;$function$
;

CREATE TRIGGER before_insert_order BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_order_index();

CREATE OR REPLACE FUNCTION public.adjust_product_qte(
  stock_movement_ids UUID[] -- Array of stock movement UUIDs
)
RETURNS VOID AS $$
DECLARE
  movement_record RECORD; -- A variable to hold each stock movement record
BEGIN
  -- Loop through the array of stock movement UUIDs
  FOR movement_record IN
    -- Fetch product_id and qte_change from stock_movements based on the provided UUIDs
    SELECT product_id, qte_change
    FROM stock_movements
    WHERE id = ANY(stock_movement_ids)
  LOOP
    -- Update the product quantity based on the qte_change
    UPDATE products
    SET qte = GREATEST(COALESCE(qte, 0) + movement_record.qte_change, 0)
    WHERE id = movement_record.product_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;


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
    FROM public.orders
    WHERE id = NEW.id AND status = 1
  )
  INTO exists_in_db;

  -- Only proceed if the order status is being updated to 'Confirmed' (1), and it doesn't already exist in the database with status = 1
  IF NEW.status = 1 AND NOT exists_in_db THEN
    -- Fetch the current maximum index for the specified document type and organization
    SELECT COALESCE(MAX(doc_index), 0) + 1
    INTO new_index
    FROM public.orders
    WHERE document_type = NEW.document_type
      AND org_id = NEW.org_id;

    -- Set the new doc_index for the current order
    NEW.doc_index = new_index;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE TRIGGER trigger_increment_doc_index BEFORE INSERT OR UPDATE ON public.orders FOR EACH ROW WHEN ((new.status = 1)) EXECUTE FUNCTION public.increment_doc_index();




