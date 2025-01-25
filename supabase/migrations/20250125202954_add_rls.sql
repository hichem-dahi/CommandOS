drop trigger if exists "on-order-insert" on "public"."notifications";

alter table "public"."deliveries" enable row level security;

alter table "public"."individuals" enable row level security;

alter table "public"."notifications" enable row level security;

alter table "public"."order_lines" enable row level security;

alter table "public"."orders" enable row level security;

alter table "public"."payments" enable row level security;

alter table "public"."products" enable row level security;

alter table "public"."products_categories" enable row level security;

alter table "public"."products_qty" enable row level security;

alter table "public"."push_subscriptions" enable row level security;

alter table "public"."stock_movements" enable row level security;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.apply_org_rls(table_name text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    
    EXECUTE format('
    CREATE POLICY "Users can only access %I from their organization" 
    ON %I 
    FOR ALL 
    USING (
        auth.uid() IN (
            SELECT user_id 
            FROM public.organizations 
            WHERE id = %I.org_id
        )
    )', table_name, table_name, table_name);
END;
$function$
;

create policy "Users can only access deliveries from their organization"
on "public"."deliveries"
as permissive
for all
to public
using ((auth.uid() IN ( SELECT organizations.user_id
   FROM organizations
  WHERE (organizations.id = deliveries.org_id))));


create policy "Users can only access individuals from their organization"
on "public"."individuals"
as permissive
for all
to public
using ((auth.uid() IN ( SELECT organizations.user_id
   FROM organizations
  WHERE (organizations.id = individuals.org_id))));


create policy "Users can only access notifications from their organization"
on "public"."notifications"
as permissive
for all
to public
using ((auth.uid() IN ( SELECT organizations.user_id
   FROM organizations
  WHERE (organizations.id = notifications.org_id))));


create policy "Users can only access order_lines from their organization"
on "public"."order_lines"
as permissive
for all
to public
using ((auth.uid() IN ( SELECT organizations.user_id
   FROM organizations
  WHERE (organizations.id = order_lines.org_id))));


create policy "Users can only access orders from their organization"
on "public"."orders"
as permissive
for all
to public
using ((auth.uid() IN ( SELECT organizations.user_id
   FROM organizations
  WHERE (organizations.id = orders.org_id))));


create policy "Users can only access payments from their organization"
on "public"."payments"
as permissive
for all
to public
using ((auth.uid() IN ( SELECT organizations.user_id
   FROM organizations
  WHERE (organizations.id = payments.org_id))));


create policy "Users can only access products from their organization"
on "public"."products"
as permissive
for all
to public
using ((auth.uid() IN ( SELECT organizations.user_id
   FROM organizations
  WHERE (organizations.id = products.org_id))));


create policy "Users can only access products_categories from their organizati"
on "public"."products_categories"
as permissive
for all
to public
using ((auth.uid() IN ( SELECT organizations.user_id
   FROM organizations
  WHERE (organizations.id = products_categories.org_id))));


create policy "Users can only access products_qty from their organization"
on "public"."products_qty"
as permissive
for all
to public
using ((auth.uid() IN ( SELECT organizations.user_id
   FROM organizations
  WHERE (organizations.id = products_qty.org_id))));


create policy "Users can only access push_subscriptions from their organizatio"
on "public"."push_subscriptions"
as permissive
for all
to public
using ((auth.uid() IN ( SELECT organizations.user_id
   FROM organizations
  WHERE (organizations.id = push_subscriptions.org_id))));


create policy "Users can only access stock_movements from their organization"
on "public"."stock_movements"
as permissive
for all
to public
using ((auth.uid() IN ( SELECT organizations.user_id
   FROM organizations
  WHERE (organizations.id = stock_movements.org_id))));

