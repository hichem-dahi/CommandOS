create extension if not exists "moddatetime" with schema "extensions";


alter table "public"."deliveries" add column "updated_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text);

alter table "public"."individuals" add column "updated_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text);

alter table "public"."notifications" add column "updated_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text);

alter table "public"."order_lines" add column "updated_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text);

alter table "public"."orders" add column "updated_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text);

alter table "public"."organizations" add column "updated_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text);

alter table "public"."products" add column "updated_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text);

alter table "public"."stock_movements" add column "updated_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.deliveries FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.individuals FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.stock_movements FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

alter table "public"."notifications" drop column "created_at";

alter table "public"."stock_movements" add column "org_id" uuid not null;

alter table "public"."stock_movements" add constraint "stock_movements_org_id_fkey" FOREIGN KEY (org_id) REFERENCES organizations(id) not valid;

alter table "public"."stock_movements" validate constraint "stock_movements_org_id_fkey";


