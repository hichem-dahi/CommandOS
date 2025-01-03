alter table "public"."products_qty" drop constraint "products_qty_product_id_fkey";

alter table "public"."products_qty" drop constraint "productQty_pkey";

drop index if exists "public"."productQty_pkey";

alter table "public"."order_lines" add column "org_id" uuid not null;

alter table "public"."payments" add column "org_id" uuid not null;

alter table "public"."products_qty" drop column "product_id";

alter table "public"."products_qty" add column "id" uuid not null;

CREATE UNIQUE INDEX products_qty_pkey ON public.products_qty USING btree (id);

alter table "public"."products_qty" add constraint "products_qty_pkey" PRIMARY KEY using index "products_qty_pkey";

alter table "public"."order_lines" add constraint "order_lines_org_id_fkey" FOREIGN KEY (org_id) REFERENCES organizations(id) not valid;

alter table "public"."order_lines" validate constraint "order_lines_org_id_fkey";

alter table "public"."payments" add constraint "payments_org_id_fkey" FOREIGN KEY (org_id) REFERENCES organizations(id) not valid;

alter table "public"."payments" validate constraint "payments_org_id_fkey";

alter table "public"."products_qty" add constraint "products_qty_product_id_fkey" FOREIGN KEY (id) REFERENCES products(id) ON DELETE CASCADE not valid;

alter table "public"."products_qty" validate constraint "products_qty_product_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.adjust_product_qte(stock_movement_ids uuid[])
 RETURNS void
 LANGUAGE plpgsql
AS $function$DECLARE
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
    UPDATE products_qty
    SET qty = GREATEST(COALESCE(qty, 0) + movement_record.qte_change, 0)
    WHERE id = movement_record.product_id;
  END LOOP;
END;$function$
;

CREATE OR REPLACE FUNCTION public.create_products_qty()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$BEGIN
  -- Insert a new row into products_qty using the init_qty value
  INSERT INTO public.products_qty (id, qty, org_id, updated_at)
  VALUES (NEW.id, NEW.init_qty, NEW.org_id, NOW());

  RETURN NEW;
END;$function$
;


