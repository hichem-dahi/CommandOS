COMMENT ON SCHEMA "public" IS 'standard public schema';


CREATE OR REPLACE FUNCTION "public"."adjust_product_qte"("stock_movement_ids" "uuid"[]) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$DECLARE
  movement_record RECORD; -- A variable to hold each stock movement record
BEGIN
  -- Loop through the array of stock movement UUIDs
  FOR movement_record IN
    -- Fetch product_id and qte_change from stock_movements based on the provided UUIDs
    SELECT product_id, qte_change
    FROM public.stock_movements
    WHERE id = ANY(stock_movement_ids)
  LOOP
    -- Update the product quantity based on the qte_change
    UPDATE public.products_qty
    SET qty = GREATEST(COALESCE(qty, 0) + movement_record.qte_change, 0)
    WHERE product_id = movement_record.product_id;
  END LOOP;
END;$$;


ALTER FUNCTION "public"."adjust_product_qte"("stock_movement_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_products_qty"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$BEGIN
  -- Insert a new row into products_qty using the init_qty value
  INSERT INTO public.products_qty (product_id, qty, org_id)
  VALUES (NEW.id, NEW.init_qty, NEW.org_id);

  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."create_products_qty"() OWNER TO "postgres";



CREATE OR REPLACE FUNCTION "public"."increment_doc_index"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  new_index INTEGER;
  exists_in_db BOOLEAN;
BEGIN
  -- Check if the ID exists in the database with status = 1
  SELECT EXISTS (
    SELECT 1
    FROM public.orders
    WHERE id = NEW.id AND status = 1
  )
  INTO exists_in_db;

  -- Only proceed if the order status is being updated to 'Confirmed' (1), 
  -- it doesn't already exist in the database with status = 1, 
  -- and NEW.doc_index is NULL
  IF NEW.status = 1 AND NOT exists_in_db AND NEW.doc_index IS NULL THEN
    -- Fetch the current maximum index for the specified document type and organization
    SELECT COALESCE(MAX(doc_index), 0) + 1
    INTO new_index
    FROM public.orders
    WHERE document_type = NEW.document_type
      AND org_id = NEW.org_id;

    -- Set the new doc_index for the current order
    NEW.doc_index := new_index;
  END IF;

  RETURN NEW;
END;
$$;



ALTER FUNCTION "public"."increment_doc_index"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_order_index"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  max_index INTEGER;
BEGIN
  -- Ensure the trigger is only executed for inserts, not conflict resolution updates
  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE id = NEW.id) THEN
    -- Only set the index if NEW.index is NULL
    IF NEW.index IS NULL THEN
      -- Get the highest index for the organization (org_id)
      SELECT COALESCE(MAX(index), 0) INTO max_index
      FROM public.orders
      WHERE org_id = NEW.org_id;

      -- Set the NEW index value to be the max index + 1
      NEW.index := max_index + 1;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;



ALTER FUNCTION "public"."set_order_index"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."deliveries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "driver_name" "text" NOT NULL,
    "phone" "text",
    "license_plate" "text" NOT NULL,
    "destination" "text" NOT NULL,
    "org_id" "uuid" NOT NULL
);


ALTER TABLE "public"."deliveries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."individuals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "org_id" "uuid" NOT NULL
);


ALTER TABLE "public"."individuals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "body" "text" NOT NULL,
    "title" "text" NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_lines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "qte" integer NOT NULL,
    "unit_price" numeric NOT NULL,
    "total_price" numeric NOT NULL,
    "unit_cost_price" bigint
);


ALTER TABLE "public"."order_lines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "index" integer NOT NULL,
    "individual_id" "uuid",
    "client_id" "uuid",
    "date" timestamp with time zone NOT NULL,
    "document_type" integer NOT NULL,
    "status" integer NOT NULL,
    "payment_method" "text",
    "paid_price" numeric NOT NULL,
    "total_price" numeric NOT NULL,
    "tva" numeric,
    "ttc" numeric,
    "delivery_id" "uuid",
    "doc_index" integer,
    "org_id" "uuid" NOT NULL,
    CONSTRAINT "orders_document_type_check" CHECK ((("document_type" >= 1) AND ("document_type" <= 4))),
    CONSTRAINT "orders_status_check" CHECK ((("status" >= 0) AND ("status" <= 2)))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


ALTER TABLE "public"."orders" ALTER COLUMN "index" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."orders_index_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "rc" "text",
    "nif" bigint,
    "nis" bigint,
    "art" bigint,
    "address" "text",
    "activity" "text",
    "org_id" "uuid",
    "user_id" "uuid"
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "date" timestamp with time zone NOT NULL,
    "amount" numeric NOT NULL
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "price" numeric NOT NULL,
    "init_qty" integer NOT NULL,
    "bar_code" numeric,
    "cost_price" bigint,
    "org_id" "uuid" NOT NULL
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products_qty" (
    "product_id" "uuid" NOT NULL,
    "qty" integer NOT NULL,
    "org_id" "uuid" NOT NULL
);


ALTER TABLE "public"."products_qty" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."push_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "endpoint" "text" NOT NULL,
    "p256dh" "text" NOT NULL,
    "auth" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "org_id" "uuid"
);


ALTER TABLE "public"."push_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stock_movements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "qte_change" integer NOT NULL,
    "date" timestamp with time zone NOT NULL,
    "order_id" "uuid",
    "org_id" "uuid" NOT NULL
);


ALTER TABLE "public"."stock_movements" OWNER TO "postgres";


ALTER TABLE ONLY "public"."deliveries"
    ADD CONSTRAINT "delivery_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."individuals"
    ADD CONSTRAINT "individual_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_lines"
    ADD CONSTRAINT "order_line_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organization_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products_qty"
    ADD CONSTRAINT "productQty_pkey" PRIMARY KEY ("product_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "product_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_endpoint_key" UNIQUE ("endpoint");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movement_pkey" PRIMARY KEY ("id");



CREATE INDEX "individuals_org_id_idx" ON "public"."individuals" USING "btree" ("org_id");



CREATE INDEX "orders_org_id_idx" ON "public"."orders" USING "btree" ("org_id");



CREATE INDEX "organizations_org_id_idx" ON "public"."organizations" USING "btree" ("org_id");



CREATE INDEX "products_org_id_idx" ON "public"."products" USING "btree" ("org_id");



CREATE OR REPLACE TRIGGER "after_product_insert" AFTER INSERT ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."create_products_qty"();


CREATE OR REPLACE TRIGGER "before_insert_order" BEFORE INSERT ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."set_order_index"();


CREATE OR REPLACE TRIGGER "trigger_increment_doc_index" BEFORE INSERT OR UPDATE ON "public"."orders" FOR EACH ROW WHEN (("new"."status" = 1)) EXECUTE FUNCTION "public"."increment_doc_index"();



ALTER TABLE ONLY "public"."deliveries"
    ADD CONSTRAINT "deliveries_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."individuals"
    ADD CONSTRAINT "individuals_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."order_lines"
    ADD CONSTRAINT "order_line_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_lines"
    ADD CONSTRAINT "order_line_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "public"."deliveries"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_individual_id_fkey" FOREIGN KEY ("individual_id") REFERENCES "public"."individuals"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payment_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."products_qty"
    ADD CONSTRAINT "products_qty_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."products_qty"
    ADD CONSTRAINT "products_qty_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movement_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movement_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id");