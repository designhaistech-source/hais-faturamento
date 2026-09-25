export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      billing_analyses: {
        Row: {
          analyzed_at: string
          billed_total: number
          completed_at: string | null
          contract_company: string
          contract_id: string | null
          divergence_count: number
          error_message: string | null
          expected_total: number
          file_hash: string | null
          file_name: string
          health_plan: string
          id: string
          item_count: number
          processing_details: Json | null
          processing_status: string | null
          provider: string
          status: string
          unanalyzed_count: number
          xml_content: string | null
        }
        Insert: {
          analyzed_at?: string
          billed_total?: number
          completed_at?: string | null
          contract_company?: string
          contract_id?: string | null
          divergence_count?: number
          error_message?: string | null
          expected_total?: number
          file_hash?: string | null
          file_name: string
          health_plan?: string
          id?: string
          item_count?: number
          processing_details?: Json | null
          processing_status?: string | null
          provider?: string
          status?: string
          unanalyzed_count?: number
          xml_content?: string | null
        }
        Update: {
          analyzed_at?: string
          billed_total?: number
          completed_at?: string | null
          contract_company?: string
          contract_id?: string | null
          divergence_count?: number
          error_message?: string | null
          expected_total?: number
          file_hash?: string | null
          file_name?: string
          health_plan?: string
          id?: string
          item_count?: number
          processing_details?: Json | null
          processing_status?: string | null
          provider?: string
          status?: string
          unanalyzed_count?: number
          xml_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_analyses_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_analysis_items: {
        Row: {
          adjustment_percent: number | null
          analysis_id: string
          calculation: string | null
          category: string
          code: string
          created_at: string
          description: string
          difference: number | null
          executed_at: string | null
          expected_value: number | null
          factor: number | null
          id: string
          line_number: number
          quantity: number
          reason: string | null
          reference_type: string | null
          reference_value: number | null
          rule_description: string | null
          source: string
          status: string
          total_value: number | null
          unit_value: number | null
        }
        Insert: {
          adjustment_percent?: number | null
          analysis_id: string
          calculation?: string | null
          category?: string
          code?: string
          created_at?: string
          description?: string
          difference?: number | null
          executed_at?: string | null
          expected_value?: number | null
          factor?: number | null
          id?: string
          line_number?: number
          quantity?: number
          reason?: string | null
          reference_type?: string | null
          reference_value?: number | null
          rule_description?: string | null
          source?: string
          status?: string
          total_value?: number | null
          unit_value?: number | null
        }
        Update: {
          adjustment_percent?: number | null
          analysis_id?: string
          calculation?: string | null
          category?: string
          code?: string
          created_at?: string
          description?: string
          difference?: number | null
          executed_at?: string | null
          expected_value?: number | null
          factor?: number | null
          id?: string
          line_number?: number
          quantity?: number
          reason?: string | null
          reference_type?: string | null
          reference_value?: number | null
          rule_description?: string | null
          source?: string
          status?: string
          total_value?: number | null
          unit_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_analysis_items_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "billing_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_rules: {
        Row: {
          adjustment_percent: number
          base_type: string
          category: string
          codes: string
          contract_id: string
          created_at: string
          factor: number
          id: string
          negotiated_value: number | null
          reviewed: boolean
          source_excerpt: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          adjustment_percent?: number
          base_type?: string
          category?: string
          codes?: string
          contract_id: string
          created_at?: string
          factor?: number
          id?: string
          negotiated_value?: number | null
          reviewed?: boolean
          source_excerpt?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          adjustment_percent?: number
          base_type?: string
          category?: string
          codes?: string
          contract_id?: string
          created_at?: string
          factor?: number
          id?: string
          negotiated_value?: number | null
          reviewed?: boolean
          source_excerpt?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_rules_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          cnpj: string
          company: string
          created_at: string
          file_name: string
          file_path: string
          file_type: string
          id: string
          valid_until: string | null
        }
        Insert: {
          cnpj?: string
          company: string
          created_at?: string
          file_name: string
          file_path: string
          file_type?: string
          id?: string
          valid_until?: string | null
        }
        Update: {
          cnpj?: string
          company?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_type?: string
          id?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      pricing_version_files: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_type: string | null
          id: string
          position: number
          version_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_type?: string | null
          id?: string
          position: number
          version_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_type?: string | null
          id?: string
          position?: number
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_version_files_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "pricing_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_versions: {
        Row: {
          base_type: string
          created_at: string
          created_by: string
          file_hash: string | null
          file_name: string
          file_path: string
          file_type: string | null
          files: Json | null
          id: string
          processed_count: number | null
          retryable: boolean
          status: string
          status_guidance: string | null
          status_problem: string | null
          unprocessed_count: number | null
          unprocessed_reasons: Json | null
          version_month: string | null
        }
        Insert: {
          base_type?: string
          created_at?: string
          created_by: string
          file_hash?: string | null
          file_name: string
          file_path: string
          file_type?: string | null
          files?: Json | null
          id?: string
          processed_count?: number | null
          retryable?: boolean
          status: string
          status_guidance?: string | null
          status_problem?: string | null
          unprocessed_count?: number | null
          unprocessed_reasons?: Json | null
          version_month?: string | null
        }
        Update: {
          base_type?: string
          created_at?: string
          created_by?: string
          file_hash?: string | null
          file_name?: string
          file_path?: string
          file_type?: string | null
          files?: Json | null
          id?: string
          processed_count?: number | null
          retryable?: boolean
          status?: string
          status_guidance?: string | null
          status_problem?: string | null
          unprocessed_count?: number | null
          unprocessed_reasons?: Json | null
          version_month?: string | null
        }
        Relationships: []
      }
      tuss_version_files: {
        Row: {
          created_at: string
          file_hash: string | null
          file_name: string
          file_path: string
          file_type: string | null
          id: string
          position: number
          version_id: string
        }
        Insert: {
          created_at?: string
          file_hash?: string | null
          file_name: string
          file_path: string
          file_type?: string | null
          id?: string
          position?: number
          version_id: string
        }
        Update: {
          created_at?: string
          file_hash?: string | null
          file_name?: string
          file_path?: string
          file_type?: string | null
          id?: string
          position?: number
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tuss_version_files_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "tuss_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      tuss_versions: {
        Row: {
          created_at: string
          created_by: string
          file_name: string
          file_path: string
          file_type: string | null
          id: string
          processed_count: number | null
          retryable: boolean
          status: string
          status_guidance: string | null
          status_problem: string | null
          table_name: string
          unprocessed_count: number | null
          version_month: string
        }
        Insert: {
          created_at?: string
          created_by: string
          file_name: string
          file_path: string
          file_type?: string | null
          id?: string
          processed_count?: number | null
          retryable?: boolean
          status?: string
          status_guidance?: string | null
          status_problem?: string | null
          table_name?: string
          unprocessed_count?: number | null
          version_month?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          file_name?: string
          file_path?: string
          file_type?: string | null
          id?: string
          processed_count?: number | null
          retryable?: boolean
          status?: string
          status_guidance?: string | null
          status_problem?: string | null
          table_name?: string
          unprocessed_count?: number | null
          version_month?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
