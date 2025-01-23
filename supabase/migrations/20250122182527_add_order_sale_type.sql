create type "public"."sale_type" as enum ('order', 'sale');

alter table "public"."orders" add column "type" sale_type not null default 'order'::sale_type;

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.products_categories FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

alter table "public"."products_categories" disable row level security;
