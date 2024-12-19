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

alter table "public"."deliveries" add column "_deleted" boolean not null default false;

alter table "public"."individuals" add column "_deleted" boolean not null default false;

alter table "public"."notifications" add column "_deleted" boolean default false;

alter table "public"."order_lines" add column "_deleted" boolean not null default false;

alter table "public"."orders" add column "_deleted" boolean not null default false;

alter table "public"."organizations" add column "_deleted" boolean not null default false;

alter table "public"."payments" add column "_deleted" boolean not null default false;

alter table "public"."payments" add column "updated_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text);

alter table "public"."products" add column "_deleted" boolean not null default false;

alter table "public"."profiles" add column "_deleted" boolean default false;


alter table "public"."stock_movements" add column "_deleted" boolean not null default false;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.set_order_index()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$DECLARE
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

alter table "public"."profiles" drop constraint "profiles_organization_id_fkey";

alter table "public"."organizations" add column "user_id" uuid;

alter table "public"."profiles" drop column "organization_id";

alter table "public"."organizations" add constraint "organizations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) not valid;

alter table "public"."organizations" validate constraint "organizations_user_id_fkey";


