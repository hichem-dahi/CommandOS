COMMENT ON SCHEMA "public" IS 'standard public schema';

CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "rc" "text",
    "nif" integer,
    "nis" integer,
    "art" integer,
    "address" "text",
    "activity" "text"
);

ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deliveries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "driver_name" "text" NOT NULL,
    "phone" "text",
    "license_plate" "text" NOT NULL,
    "destination" "text" NOT NULL
);


ALTER TABLE "public"."deliveries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."individuals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text"
);


ALTER TABLE "public"."individuals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_lines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "product_id" "uuid",
    "qte" integer,
    "unit_price" numeric,
    "total_price" numeric NOT NULL
);


ALTER TABLE "public"."order_lines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "index" integer NOT NULL,
    "docindex" integer,
    "organization_id" "uuid",
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


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "date" timestamp with time zone NOT NULL,
    "amount" numeric NOT NULL
);

ALTER TABLE "public"."payments" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "price" numeric,
    "qte" integer,
    "organization_id" "uuid"
);

ALTER TABLE "public"."products" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "email" "text",
    "phone" "text",
    "organization_id" "uuid"
);

ALTER TABLE "public"."profiles" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."stock_movements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid",
    "qte_change" integer NOT NULL,
    "date" timestamp with time zone NOT NULL,
    "order_id" "uuid"
);

ALTER TABLE "public"."stock_movements" OWNER TO "postgres";

ALTER TABLE ONLY "public"."deliveries"
    ADD CONSTRAINT "delivery_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."individuals"
    ADD CONSTRAINT "individual_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."order_lines"
    ADD CONSTRAINT "order_line_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organization_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payment_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "product_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profile_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movement_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."order_lines"
    ADD CONSTRAINT "order_line_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."order_lines"
    ADD CONSTRAINT "order_line_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");

ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "public"."deliveries"("id");

ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_individual_id_fkey" FOREIGN KEY ("individual_id") REFERENCES "public"."individuals"("id");

ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");

ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payment_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "product_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");

ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movement_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");

ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movement_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");























































































































































RESET ALL;