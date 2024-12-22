alter table "public"."deliveries" add column "org_id" uuid not null;

alter table "public"."deliveries" add constraint "deliveries_org_id_fkey" FOREIGN KEY (org_id) REFERENCES organizations(id) not valid;

alter table "public"."deliveries" validate constraint "deliveries_org_id_fkey";


