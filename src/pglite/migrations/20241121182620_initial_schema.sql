alter table "public"."order_lines" add column "unit_cost_price" bigint;

alter table "public"."order_lines" alter column "order_id" set not null;

alter table "public"."order_lines" alter column "product_id" set not null;

alter table "public"."order_lines" alter column "qte" set not null;

alter table "public"."order_lines" alter column "unit_price" set not null;

alter table "public"."orders" drop column "docindex";

alter table "public"."orders" add column "doc_index" integer;

alter table "public"."payments" alter column "order_id" set not null;

alter table "public"."products" add column "bar_code" numeric;

alter table "public"."products" add column "cost_price" bigint;

alter table "public"."products" alter column "organization_id" set not null;

alter table "public"."products" alter column "price" set not null;

alter table "public"."products" alter column "qte" set not null;

alter table "public"."stock_movements" alter column "product_id" set not null;

ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_client_id_fkey" FOREIGN KEY (client_id) REFERENCES "public"."organizations"(id) NOT VALID;

alter table "public"."orders" validate constraint "orders_client_id_fkey";

set check_function_bodies = off;



CREATE OR REPLACE FUNCTION public.increment_doc_index()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  new_index integer;
BEGIN
  -- Only proceed if the order status is being updated from 'Pending' (0) to 'Confirmed' (1)
  IF NEW.status = 1 AND OLD.status = 0 THEN
    -- Fetch the current maximum index for the specified document type
    SELECT COALESCE(MAX(doc_index), 0) + 1
    INTO new_index
    FROM orders
    WHERE document_type = NEW.document_type;

    -- Set the new doc_index for the current order
    NEW.doc_index = new_index;
  END IF;

  RETURN NEW;
END;
$function$
;



CREATE TRIGGER trigger_increment_doc_index BEFORE UPDATE ON public.orders FOR EACH ROW WHEN (((new.status = 1) AND (old.status = 0))) EXECUTE FUNCTION public.increment_doc_index();



