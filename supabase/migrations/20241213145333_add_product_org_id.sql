alter table "public"."stock_movements" add column "org_id" uuid not null;

alter table "public"."stock_movements" add constraint "stock_movements_org_id_fkey" FOREIGN KEY (org_id) REFERENCES organizations(id) not valid;

alter table "public"."stock_movements" validate constraint "stock_movements_org_id_fkey";


