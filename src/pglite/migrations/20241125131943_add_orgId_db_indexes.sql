alter table "public"."orders" drop constraint "orders_organization_id_fkey";

alter table "public"."products" drop constraint "product_organization_id_fkey";

alter table "public"."push_subscriptions" drop constraint "push_subscriptions_organization_id_fkey";

alter table "public"."individuals" add column "org_id" uuid not null;

alter table "public"."orders" drop column "organization_id";

alter table "public"."orders" add column "org_id" uuid not null;

alter table "public"."organizations" add column "org_id" uuid;

alter table "public"."organizations" alter column "art" set data type bigint using "art"::bigint;

alter table "public"."organizations" alter column "nif" set data type bigint using "nif"::bigint;

alter table "public"."organizations" alter column "nis" set data type bigint using "nis"::bigint;

alter table "public"."products" drop column "organization_id";

alter table "public"."products" add column "org_id" uuid not null;

alter table "public"."push_subscriptions" drop column "organization_id";

alter table "public"."push_subscriptions" add column "org_id" uuid;

CREATE INDEX individuals_org_id_idx ON public.individuals USING btree (org_id);

CREATE INDEX orders_org_id_idx ON public.orders USING btree (org_id);

CREATE INDEX organizations_org_id_idx ON public.organizations USING btree (org_id);

CREATE INDEX products_org_id_idx ON public.products USING btree (org_id);

alter table "public"."individuals" add constraint "individuals_org_id_fkey" FOREIGN KEY (org_id) REFERENCES public.organizations(id) not valid;

alter table "public"."individuals" validate constraint "individuals_org_id_fkey";

alter table "public"."orders" add constraint "orders_org_id_fkey" FOREIGN KEY (org_id) REFERENCES public.organizations(id) not valid;

alter table "public"."orders" validate constraint "orders_org_id_fkey";

alter table "public"."organizations" add constraint "organizations_org_id_fkey" FOREIGN KEY (org_id) REFERENCES public.organizations(id) not valid;

alter table "public"."organizations" validate constraint "organizations_org_id_fkey";

alter table "public"."products" add constraint "products_org_id_fkey" FOREIGN KEY (org_id) REFERENCES public.organizations(id) not valid;

alter table "public"."products" validate constraint "products_org_id_fkey";

alter table "public"."push_subscriptions" add constraint "push_subscriptions_org_id_fkey" FOREIGN KEY (org_id) REFERENCES public.organizations(id) not valid;

alter table "public"."push_subscriptions" validate constraint "push_subscriptions_org_id_fkey";



