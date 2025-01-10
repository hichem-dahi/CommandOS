drop trigger if exists "before_insert_order" on "public"."orders";

drop trigger if exists "trigger_increment_doc_index" on "public"."orders";

drop function if exists "public"."increment_doc_index"();


