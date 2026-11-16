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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      farmers: {
        Row: {
          biological_sex: string
          cellphone: string
          created_at: string
          created_by: string
          date_born: string
          email: string | null
          farmer_cc: string
          farmer_last: string
          farmer_name: string
          farmer_signature: string | null
          id: number
          photo: string | null
          village: number
        }
        Insert: {
          biological_sex?: string
          cellphone: string
          created_at?: string
          created_by: string
          date_born: string
          email?: string | null
          farmer_cc: string
          farmer_last: string
          farmer_name: string
          farmer_signature?: string | null
          id?: number
          photo?: string | null
          village: number
        }
        Update: {
          biological_sex?: string
          cellphone?: string
          created_at?: string
          created_by?: string
          date_born?: string
          email?: string | null
          farmer_cc?: string
          farmer_last?: string
          farmer_name?: string
          farmer_signature?: string | null
          id?: number
          photo?: string | null
          village?: number
        }
        Relationships: [
          {
            foreignKeyName: "farmers_village_fkey"
            columns: ["village"]
            isOneToOne: false
            referencedRelation: "village"
            referencedColumns: ["codigo"]
          },
        ]
      }
      form_fields: {
        Row: {
          created_at: string
          form_id: number
          id: number
          key: string
          label: string
          options: Json | null
          placeholder: string | null
          position: number
          required: boolean
          type: string
          validation: Json | null
        }
        Insert: {
          created_at?: string
          form_id: number
          id?: never
          key: string
          label: string
          options?: Json | null
          placeholder?: string | null
          position?: number
          required?: boolean
          type: string
          validation?: Json | null
        }
        Update: {
          created_at?: string
          form_id?: number
          id?: never
          key?: string
          label?: string
          options?: Json | null
          placeholder?: string | null
          position?: number
          required?: boolean
          type?: string
          validation?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "form_fields_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      form_status_log: {
        Row: {
          changed_at: string
          changed_by: string | null
          form_id: number
          from_status: string | null
          id: number
          to_status: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          form_id: number
          from_status?: string | null
          id?: never
          to_status: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          form_id?: number
          from_status?: string | null
          id?: never
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_status_log_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          farmer_fields: string[]
          finalized_at: string | null
          finalized_by: string | null
          id: number
          list_columns: string[]
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          description?: string | null
          farmer_fields?: string[]
          finalized_at?: string | null
          finalized_by?: string | null
          id?: never
          list_columns?: string[]
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          farmer_fields?: string[]
          finalized_at?: string | null
          finalized_by?: string | null
          id?: never
          list_columns?: string[]
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          id: string
          nombre: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          id?: string
          nombre?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          id?: string
          nombre?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      requests: {
        Row: {
          created_at: string
          created_by: string
          data: Json
          farmer_id: number
          id: number
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          data?: Json
          farmer_id: number
          id?: never
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          data?: Json
          farmer_id?: number
          id?: never
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "vistaCampesino"
            referencedColumns: ["id"]
          },
        ]
      }
      village: {
        Row: {
          codigo: number
          created_at: string
          description: string
        }
        Insert: {
          codigo: number
          created_at?: string
          description: string
        }
        Update: {
          codigo?: number
          created_at?: string
          description?: string
        }
        Relationships: []
      }
    }
    Views: {
      vistaCampesino: {
        Row: {
          cellphone: string | null
          created_at: string | null
          date_born: string | null
          edad: number | null
          email: string | null
          farmer_cc: string | null
          full_name: string | null
          id: number | null
          photo: string | null
          sexo: string | null
          village: string | null
        }
        Relationships: []
      }
      vistaEdadCampesinos: {
        Row: {
          cantidad_personas: number | null
          edad: number | null
        }
        Relationships: []
      }
      vistaEdadSexoCampesinos: {
        Row: {
          cantidad_personas: number | null
          edad: number | null
          sexo: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      duplicate_form: {
        Args: { p_form_id: number; p_name?: string }
        Returns: number
      }
      finalize_form: {
        Args: {
          p_expected_updated_at: string
          p_form_id: number
          p_list_columns?: string[]
        }
        Returns: undefined
      }
      form_has_requests: { Args: { p_form_id: number }; Returns: boolean }
      reorder_form_fields: {
        Args: { p_form_id: number; p_ids: number[] }
        Returns: undefined
      }
      set_form_list_columns: {
        Args: {
          p_expected_updated_at?: string
          p_form_id: number
          p_list_columns: string[]
        }
        Returns: undefined
      }
      set_form_status: {
        Args: {
          p_expected_updated_at?: string
          p_form_id: number
          p_status: string
        }
        Returns: undefined
      }
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
