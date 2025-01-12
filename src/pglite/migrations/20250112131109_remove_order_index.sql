alter table "public"."orders" alter column "index" drop identity;

alter table "public"."orders" alter column "index" drop not null;

