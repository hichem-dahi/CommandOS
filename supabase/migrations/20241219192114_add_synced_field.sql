alter table "public"."deliveries" add column "_synced" boolean not null default true;

alter table "public"."individuals" add column "_synced" boolean not null default true;

alter table "public"."notifications" add column "_synced" boolean not null default true;

alter table "public"."order_lines" add column "_synced" boolean not null default true;

alter table "public"."orders" add column "_synced" boolean not null default true;

alter table "public"."organizations" add column "_synced" boolean not null default true;

alter table "public"."payments" add column "_synced" boolean not null default true;

alter table "public"."products" add column "_synced" boolean not null default true;

alter table "public"."profiles" add column "_synced" boolean not null default true;

alter table "public"."push_subscriptions" add column "_synced" boolean not null default true;

alter table "public"."stock_movements" add column "_synced" boolean not null default true;


