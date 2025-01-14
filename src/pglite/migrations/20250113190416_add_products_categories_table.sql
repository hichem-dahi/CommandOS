
create table "public"."products_categories" (
    "name" text not null,
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
