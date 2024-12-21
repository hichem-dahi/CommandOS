drop trigger if exists "update_product_qte_trigger" on "public"."stock_movements";

drop function if exists "public"."adjust_product_qte"();

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.adjust_product_qte(stock_movement_ids uuid[])
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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
$function$
;


