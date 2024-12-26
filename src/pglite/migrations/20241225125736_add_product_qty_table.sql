create table "public"."products_qty" (
    "product_id" uuid not null,
    "qty" integer not null,
    "org_id" uuid not null
);


alter table "public"."products" drop column "qte";

alter table "public"."products" add column "init_qty" integer not null;

CREATE UNIQUE INDEX "productQty_pkey" ON public.products_qty USING btree (product_id);

alter table "public"."products_qty" add constraint "productQty_pkey" PRIMARY KEY using index "productQty_pkey";

alter table "public"."products_qty" add constraint "product_qty_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."products_qty" validate constraint "product_qty_product_id_fkey";

alter table "public"."products_qty" add constraint "products_qty_org_id_fkey" FOREIGN KEY (org_id) REFERENCES public.organizations(id) not valid;

alter table "public"."products_qty" validate constraint "products_qty_org_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_product_qty()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$BEGIN
  -- Insert a new row into product_qty using the init_qty value
  INSERT INTO public.products_qty (product_id, qty, org_id, updated_at)
  VALUES (NEW.id, NEW.init_qty, NEW.org_id, NOW());

  RETURN NEW;
END;$function$
;

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
    FROM public.stock_movements
    WHERE id = ANY(stock_movement_ids)
  LOOP
    -- Update the product quantity based on the qte_change
    UPDATE public.products_qty
    SET qty = GREATEST(COALESCE(qty, 0) + movement_record.qte_change, 0)
    WHERE product_id = movement_record.product_id;
  END LOOP;
END;$function$
;

CREATE TRIGGER after_product_insert AFTER INSERT ON public.products FOR EACH ROW EXECUTE FUNCTION public.create_product_qty();



