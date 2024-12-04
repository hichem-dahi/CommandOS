create table "public"."notifications" (
    "id" uuid not null default gen_random_uuid(),
    "org_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "body" text not null,
    "title" text not null
);


create table "public"."push_subscriptions" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid,
    "endpoint" text not null,
    "p256dh" text not null,
    "auth" text not null,
    "created_at" timestamp without time zone default now()
);


CREATE UNIQUE INDEX push_subscriptions_endpoint_key ON public.push_subscriptions USING btree (endpoint);

CREATE UNIQUE INDEX push_subscriptions_pkey ON public.push_subscriptions USING btree (id);

alter table "public"."push_subscriptions" add constraint "push_subscriptions_pkey" PRIMARY KEY using index "push_subscriptions_pkey";

alter table "public"."notifications" add constraint "notifications_org_id_fkey" FOREIGN KEY (org_id) REFERENCES public.organizations(id) not valid;

alter table "public"."notifications" validate constraint "notifications_org_id_fkey";

alter table "public"."push_subscriptions" add constraint "push_subscriptions_endpoint_key" UNIQUE using index "push_subscriptions_endpoint_key";

alter table "public"."push_subscriptions" add constraint "push_subscriptions_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) not valid;

alter table "public"."push_subscriptions" validate constraint "push_subscriptions_organization_id_fkey";