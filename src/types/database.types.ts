export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      deliveries: {
        Row: {
          _deleted: boolean
          _synced: boolean
          destination: string
          driver_name: string
          id: string
          license_plate: string
          org_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          _deleted?: boolean
          _synced?: boolean
          destination: string
          driver_name: string
          id?: string
          license_plate: string
          org_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          _deleted?: boolean
          _synced?: boolean
          destination?: string
          driver_name?: string
          id?: string
          license_plate?: string
          org_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      individuals: {
        Row: {
          _deleted: boolean
          _synced: boolean
          id: string
          name: string
          org_id: string
          phone: string
          updated_at: string
        }
        Insert: {
          _deleted?: boolean
          _synced?: boolean
          id?: string
          name: string
          org_id: string
          phone: string
          updated_at?: string
        }
        Update: {
          _deleted?: boolean
          _synced?: boolean
          id?: string
          name?: string
          org_id?: string
          phone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "individuals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          _deleted: boolean | null
          _synced: boolean
          body: string
          id: string
          org_id: string
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          _deleted?: boolean | null
          _synced?: boolean
          body: string
          id?: string
          org_id: string
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          _deleted?: boolean | null
          _synced?: boolean
          body?: string
          id?: string
          org_id?: string
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      order_lines: {
        Row: {
          _deleted: boolean
          _synced: boolean
          id: string
          order_id: string
          org_id: string
          product_id: string
          qte: number
          total_price: number
          unit_cost_price: number | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          _deleted?: boolean
          _synced?: boolean
          id?: string
          order_id: string
          org_id: string
          product_id: string
          qte: number
          total_price: number
          unit_cost_price?: number | null
          unit_price: number
          updated_at?: string
        }
        Update: {
          _deleted?: boolean
          _synced?: boolean
          id?: string
          order_id?: string
          org_id?: string
          product_id?: string
          qte?: number
          total_price?: number
          unit_cost_price?: number | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_line_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_line_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_lines_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          _deleted: boolean
          _synced: boolean
          client_id: string | null
          date: string
          delivery_id: string | null
          doc_index: number | null
          document_type: number
          id: string
          index: number | null
          individual_id: string | null
          org_id: string
          paid_price: number
          payment_method: string | null
          reduction: number | null
          status: number
          total_price: number
          ttc: number | null
          tva: number | null
          type: Database["public"]["Enums"]["sale_type"]
          updated_at: string
        }
        Insert: {
          _deleted?: boolean
          _synced?: boolean
          client_id?: string | null
          date: string
          delivery_id?: string | null
          doc_index?: number | null
          document_type: number
          id?: string
          index?: number | null
          individual_id?: string | null
          org_id: string
          paid_price: number
          payment_method?: string | null
          reduction?: number | null
          status: number
          total_price: number
          ttc?: number | null
          tva?: number | null
          type?: Database["public"]["Enums"]["sale_type"]
          updated_at?: string
        }
        Update: {
          _deleted?: boolean
          _synced?: boolean
          client_id?: string | null
          date?: string
          delivery_id?: string | null
          doc_index?: number | null
          document_type?: number
          id?: string
          index?: number | null
          individual_id?: string | null
          org_id?: string
          paid_price?: number
          payment_method?: string | null
          reduction?: number | null
          status?: number
          total_price?: number
          ttc?: number | null
          tva?: number | null
          type?: Database["public"]["Enums"]["sale_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_individual_id_fkey"
            columns: ["individual_id"]
            isOneToOne: false
            referencedRelation: "individuals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          _deleted: boolean
          _synced: boolean
          activity: string | null
          address: string | null
          art: number | null
          id: string
          name: string
          nif: number | null
          nis: number | null
          org_id: string | null
          phone: string
          rc: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          _deleted?: boolean
          _synced?: boolean
          activity?: string | null
          address?: string | null
          art?: number | null
          id?: string
          name: string
          nif?: number | null
          nis?: number | null
          org_id?: string | null
          phone: string
          rc?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          _deleted?: boolean
          _synced?: boolean
          activity?: string | null
          address?: string | null
          art?: number | null
          id?: string
          name?: string
          nif?: number | null
          nis?: number | null
          org_id?: string | null
          phone?: string
          rc?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          _deleted: boolean
          _synced: boolean
          amount: number
          date: string
          id: string
          order_id: string
          org_id: string
          updated_at: string
        }
        Insert: {
          _deleted?: boolean
          _synced?: boolean
          amount: number
          date: string
          id?: string
          order_id: string
          org_id: string
          updated_at?: string
        }
        Update: {
          _deleted?: boolean
          _synced?: boolean
          amount?: number
          date?: string
          id?: string
          order_id?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          _deleted: boolean
          _synced: boolean
          bar_code: string | null
          category_id: string | null
          code: string
          cost_price: number | null
          id: string
          init_qty: number
          name: string
          org_id: string
          price: number
          updated_at: string
        }
        Insert: {
          _deleted?: boolean
          _synced?: boolean
          bar_code?: string | null
          category_id?: string | null
          code: string
          cost_price?: number | null
          id?: string
          init_qty: number
          name: string
          org_id: string
          price: number
          updated_at?: string
        }
        Update: {
          _deleted?: boolean
          _synced?: boolean
          bar_code?: string | null
          category_id?: string | null
          code?: string
          cost_price?: number | null
          id?: string
          init_qty?: number
          name?: string
          org_id?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "products_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      products_categories: {
        Row: {
          _deleted: boolean
          _synced: boolean
          id: string
          name: string
          org_id: string
          updated_at: string
        }
        Insert: {
          _deleted?: boolean
          _synced?: boolean
          id?: string
          name: string
          org_id: string
          updated_at?: string
        }
        Update: {
          _deleted?: boolean
          _synced?: boolean
          id?: string
          name?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_categories_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      products_qty: {
        Row: {
          _deleted: boolean
          _synced: boolean
          id: string
          org_id: string
          qty: number
          updated_at: string
        }
        Insert: {
          _deleted?: boolean
          _synced?: boolean
          id: string
          org_id: string
          qty: number
          updated_at?: string
        }
        Update: {
          _deleted?: boolean
          _synced?: boolean
          id?: string
          org_id?: string
          qty?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_qty_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_qty_product_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          _deleted: boolean | null
          _synced: boolean
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
        }
        Insert: {
          _deleted?: boolean | null
          _synced?: boolean
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
        }
        Update: {
          _deleted?: boolean | null
          _synced?: boolean
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          _synced: boolean
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          org_id: string | null
          p256dh: string
        }
        Insert: {
          _synced?: boolean
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          org_id?: string | null
          p256dh: string
        }
        Update: {
          _synced?: boolean
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          org_id?: string | null
          p256dh?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          _deleted: boolean
          _synced: boolean
          date: string
          id: string
          order_id: string | null
          org_id: string
          product_id: string
          qte_change: number
          updated_at: string
        }
        Insert: {
          _deleted?: boolean
          _synced?: boolean
          date: string
          id?: string
          order_id?: string | null
          org_id: string
          product_id: string
          qte_change: number
          updated_at?: string
        }
        Update: {
          _deleted?: boolean
          _synced?: boolean
          date?: string
          id?: string
          order_id?: string | null
          org_id?: string
          product_id?: string
          qte_change?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movement_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movement_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_product_qte: {
        Args: {
          stock_movement_ids: string[]
        }
        Returns: undefined
      }
      apply_org_rls: {
        Args: {
          table_name: string
        }
        Returns: undefined
      }
      bytea_to_text: {
        Args: {
          data: string
        }
        Returns: string
      }
      http: {
        Args: {
          request: Database["public"]["CompositeTypes"]["http_request"]
        }
        Returns: unknown
      }
      http_delete:
        | {
            Args: {
              uri: string
            }
            Returns: unknown
          }
        | {
            Args: {
              uri: string
              content: string
              content_type: string
            }
            Returns: unknown
          }
      http_get:
        | {
            Args: {
              uri: string
            }
            Returns: unknown
          }
        | {
            Args: {
              uri: string
              data: Json
            }
            Returns: unknown
          }
      http_head: {
        Args: {
          uri: string
        }
        Returns: unknown
      }
      http_header: {
        Args: {
          field: string
          value: string
        }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: {
          uri: string
          content: string
          content_type: string
        }
        Returns: unknown
      }
      http_post:
        | {
            Args: {
              uri: string
              content: string
              content_type: string
            }
            Returns: unknown
          }
        | {
            Args: {
              uri: string
              data: Json
            }
            Returns: unknown
          }
      http_put: {
        Args: {
          uri: string
          content: string
          content_type: string
        }
        Returns: unknown
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: {
          curlopt: string
          value: string
        }
        Returns: boolean
      }
      text_to_bytea: {
        Args: {
          data: string
        }
        Returns: string
      }
      urlencode:
        | {
            Args: {
              data: Json
            }
            Returns: string
          }
        | {
            Args: {
              string: string
            }
            Returns: string
          }
        | {
            Args: {
              string: string
            }
            Returns: string
          }
    }
    Enums: {
      sale_type: "order" | "sale"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

