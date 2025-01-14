
create table "public"."products_categories" (
    "name" text not null,
    "_synced" boolean not null default true,
    "_deleted" boolean not null default false,
    "updated_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
    "org_id" uuid not null,
    "id" uuid not null default gen_random_uuid()
);


alter table "public"."products_categories" enable row level security;

alter table "public"."products" add column "category_id" uuid;

CREATE UNIQUE INDEX "productsCategories_name_key" ON public.products_categories USING btree (name);

CREATE UNIQUE INDEX products_categories_pkey ON public.products_categories USING btree (id);

alter table "public"."products_categories" add constraint "products_categories_pkey" PRIMARY KEY using index "products_categories_pkey";

alter table "public"."products" add constraint "products_category_id_fkey" FOREIGN KEY (category_id) REFERENCES products_categories(id) not valid;

alter table "public"."products" validate constraint "products_category_id_fkey";

alter table "public"."products_categories" add constraint "productsCategories_name_key" UNIQUE using index "productsCategories_name_key";

alter table "public"."products_categories" add constraint "products_categories_org_id_fkey" FOREIGN KEY (org_id) REFERENCES organizations(id) not valid;

alter table "public"."products_categories" validate constraint "products_categories_org_id_fkey";

grant delete on table "public"."products_categories" to "anon";

grant insert on table "public"."products_categories" to "anon";

grant references on table "public"."products_categories" to "anon";

grant select on table "public"."products_categories" to "anon";

grant trigger on table "public"."products_categories" to "anon";

grant truncate on table "public"."products_categories" to "anon";

grant update on table "public"."products_categories" to "anon";

grant delete on table "public"."products_categories" to "authenticated";

grant insert on table "public"."products_categories" to "authenticated";

grant references on table "public"."products_categories" to "authenticated";

grant select on table "public"."products_categories" to "authenticated";

grant trigger on table "public"."products_categories" to "authenticated";

grant truncate on table "public"."products_categories" to "authenticated";

grant update on table "public"."products_categories" to "authenticated";

grant delete on table "public"."products_categories" to "service_role";

grant insert on table "public"."products_categories" to "service_role";

grant references on table "public"."products_categories" to "service_role";

grant select on table "public"."products_categories" to "service_role";

grant trigger on table "public"."products_categories" to "service_role";

grant truncate on table "public"."products_categories" to "service_role";

grant update on table "public"."products_categories" to "service_role";



