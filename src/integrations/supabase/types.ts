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
      arbo_sync_log: {
        Row: {
          created_by: string | null
          created_count: number | null
          deactivated_count: number | null
          error_message: string | null
          finished_at: string | null
          id: string
          started_at: string | null
          status: string | null
          total_xml: number | null
          updated_count: number | null
        }
        Insert: {
          created_by?: string | null
          created_count?: number | null
          deactivated_count?: number | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          total_xml?: number | null
          updated_count?: number | null
        }
        Update: {
          created_by?: string | null
          created_count?: number | null
          deactivated_count?: number | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          total_xml?: number | null
          updated_count?: number | null
        }
        Relationships: []
      }
      imoveis: {
        Row: {
          area_m2: number | null
          bairro: string | null
          banheiros: number | null
          cep: string | null
          cidade: string | null
          cliente: string
          codigo: string
          corretor_id: string | null
          cover_image_index: number | null
          created_at: string | null
          created_by: string | null
          data_cadastro: string | null
          descricao: string | null
          endereco: string
          estado: string | null
          id: string
          image_urls: string[] | null
          numero: string | null
          plataformas_anuncio: string[] | null
          quartos: number | null
          rua: string | null
          tipo: string
          tipos_disponiveis: string[] | null
          titulo: string | null
          updated_by: string | null
          vagas: number | null
          valor: number | null
        }
        Insert: {
          area_m2?: number | null
          bairro?: string | null
          banheiros?: number | null
          cep?: string | null
          cidade?: string | null
          cliente: string
          codigo: string
          corretor_id?: string | null
          cover_image_index?: number | null
          created_at?: string | null
          created_by?: string | null
          data_cadastro?: string | null
          descricao?: string | null
          endereco: string
          estado?: string | null
          id?: string
          image_urls?: string[] | null
          numero?: string | null
          plataformas_anuncio?: string[] | null
          quartos?: number | null
          rua?: string | null
          tipo: string
          tipos_disponiveis?: string[] | null
          titulo?: string | null
          updated_by?: string | null
          vagas?: number | null
          valor?: number | null
        }
        Update: {
          area_m2?: number | null
          bairro?: string | null
          banheiros?: number | null
          cep?: string | null
          cidade?: string | null
          cliente?: string
          codigo?: string
          corretor_id?: string | null
          cover_image_index?: number | null
          created_at?: string | null
          created_by?: string | null
          data_cadastro?: string | null
          descricao?: string | null
          endereco?: string
          estado?: string | null
          id?: string
          image_urls?: string[] | null
          numero?: string | null
          plataformas_anuncio?: string[] | null
          quartos?: number | null
          rua?: string | null
          tipo?: string
          tipos_disponiveis?: string[] | null
          titulo?: string | null
          updated_by?: string | null
          vagas?: number | null
          valor?: number | null
        }
        Relationships: []
      }
      imoveis_arbo: {
        Row: {
          manual_override: boolean | null
          active: boolean | null
          address: string | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          complement: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          detail_url: string | null
          featured: boolean | null
          features: string[] | null
          garage: number | null
          id: string
          images: string[] | null
          last_update_date: string | null
          latitude: number | null
          list_date: string | null
          listing_id: string
          living_area: number | null
          longitude: number | null
          lot_area: number | null
          neighborhood: string | null
          postal_code: string | null
          price: number | null
          primary_image: string | null
          property_type: string | null
          publication_type: string | null
          state: string | null
          state_abbr: string | null
          street_number: string | null
          suites: number | null
          synced_at: string | null
          title: string | null
          transaction_type: string | null
          unit_floor: number | null
          updated_at: string | null
          year_built: number | null
        }
        Insert: {
          manual_override?: boolean | null
          active?: boolean | null
          address?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          complement?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          detail_url?: string | null
          featured?: boolean | null
          features?: string[] | null
          garage?: number | null
          id?: string
          images?: string[] | null
          last_update_date?: string | null
          latitude?: number | null
          list_date?: string | null
          listing_id: string
          living_area?: number | null
          longitude?: number | null
          lot_area?: number | null
          neighborhood?: string | null
          postal_code?: string | null
          price?: number | null
          primary_image?: string | null
          property_type?: string | null
          publication_type?: string | null
          state?: string | null
          state_abbr?: string | null
          street_number?: string | null
          suites?: number | null
          synced_at?: string | null
          title?: string | null
          transaction_type?: string | null
          unit_floor?: number | null
          updated_at?: string | null
          year_built?: number | null
        }
        Update: {
          manual_override?: boolean | null
          active?: boolean | null
          address?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          complement?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          detail_url?: string | null
          featured?: boolean | null
          features?: string[] | null
          garage?: number | null
          id?: string
          images?: string[] | null
          last_update_date?: string | null
          latitude?: number | null
          list_date?: string | null
          listing_id?: string
          living_area?: number | null
          longitude?: number | null
          lot_area?: number | null
          neighborhood?: string | null
          postal_code?: string | null
          price?: number | null
          primary_image?: string | null
          property_type?: string | null
          publication_type?: string | null
          state?: string | null
          state_abbr?: string | null
          street_number?: string | null
          suites?: number | null
          synced_at?: string | null
          title?: string | null
          transaction_type?: string | null
          unit_floor?: number | null
          updated_at?: string | null
          year_built?: number | null
        }
        Relationships: []
      }
      imovel_comments: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          created_by_name: string | null
          id: string
          imovel_id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          id?: string
          imovel_id: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          id?: string
          imovel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "imovel_comments_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
        ]
      }
      imovel_history: {
        Row: {
          action: string
          created_at: string
          created_by: string | null
          created_by_name: string | null
          description: string | null
          id: string
          imovel_id: string
        }
        Insert: {
          action: string
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          description?: string | null
          id?: string
          imovel_id: string
        }
        Update: {
          action?: string
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          description?: string | null
          id?: string
          imovel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "imovel_history_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_comments: {
        Row: {
          comment: string
          created_at: string
          created_by: string | null
          id: string
          lead_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_comments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_pipeline_stages: {
        Row: {
          color: string
          created_at: string
          id: string
          is_final: boolean
          is_won: boolean
          name: string
          order_index: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_final?: boolean
          is_won?: boolean
          name: string
          order_index: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_final?: boolean
          is_won?: boolean
          name?: string
          order_index?: number
          updated_at?: string
        }
        Relationships: []
      }
      lead_stage_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          from_stage_id: string | null
          id: string
          lead_id: string
          notes: string | null
          to_stage_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          from_stage_id?: string | null
          id?: string
          lead_id: string
          notes?: string | null
          to_stage_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          from_stage_id?: string | null
          id?: string
          lead_id?: string
          notes?: string | null
          to_stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_stage_history_from_stage_id_fkey"
            columns: ["from_stage_id"]
            isOneToOne: false
            referencedRelation: "lead_pipeline_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_stage_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_stage_history_to_stage_id_fkey"
            columns: ["to_stage_id"]
            isOneToOne: false
            referencedRelation: "lead_pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          corretor_id: string | null
          created_at: string
          created_by: string | null
          email: string
          id: string
          imovel_arbo_id: string | null
          imovel_id: string | null
          lost_reason_id: string | null
          nome: string
          observacoes: string | null
          origem: string | null
          stage_id: string | null
          status: string
          telefone: string
          tipo_interesse: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          imovel_arbo_id?: string | null
          imovel_id?: string | null
          lost_reason_id?: string | null
          nome: string
          observacoes?: string | null
          origem?: string | null
          stage_id?: string | null
          status?: string
          telefone: string
          tipo_interesse: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          imovel_arbo_id?: string | null
          imovel_id?: string | null
          lost_reason_id?: string | null
          nome?: string
          observacoes?: string | null
          origem?: string | null
          stage_id?: string | null
          status?: string
          telefone?: string
          tipo_interesse?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_imovel_arbo_id_fkey"
            columns: ["imovel_arbo_id"]
            isOneToOne: false
            referencedRelation: "imoveis_arbo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_lost_reason_id_fkey"
            columns: ["lost_reason_id"]
            isOneToOne: false
            referencedRelation: "lost_reasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "lead_pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      lost_reasons: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          order_index: number
          reason: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          order_index?: number
          reason: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          order_index?: number
          reason?: string
        }
        Relationships: []
      }
      metricas: {
        Row: {
          created_at: string | null
          created_by: string | null
          data_registro: string | null
          id: string
          imovel_id: string
          leads: number
          mes: string
          updated_by: string | null
          visitas_realizadas: number
          visualizacoes: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data_registro?: string | null
          id?: string
          imovel_id: string
          leads?: number
          mes: string
          updated_by?: string | null
          visitas_realizadas?: number
          visualizacoes?: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data_registro?: string | null
          id?: string
          imovel_id?: string
          leads?: number
          mes?: string
          updated_by?: string | null
          visitas_realizadas?: number
          visualizacoes?: number
        }
        Relationships: [
          {
            foreignKeyName: "metricas_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cargo: string | null
          created_at: string | null
          email: string | null
          id: string
          nome_completo: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          nome_completo: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nome_completo?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          activities: Json | null
          assigned_to: string | null
          comments: Json | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          imovel_id: string | null
          lead_id: string | null
          order_index: number
          priority: string
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          activities?: Json | null
          assigned_to?: string | null
          comments?: Json | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          imovel_id?: string | null
          lead_id?: string | null
          order_index?: number
          priority?: string
          status?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          activities?: Json | null
          assigned_to?: string | null
          comments?: Json | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          imovel_id?: string | null
          lead_id?: string | null
          order_index?: number
          priority?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_pipeline_metrics: {
        Args: never
        Returns: {
          conversion_rate: number
          lead_count: number
          stage_id: string
          stage_name: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_users_with_roles: {
        Args: never
        Returns: {
          avatar_url: string
          cargo: string
          created_at: string
          email: string
          id: string
          nome_completo: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "corretor"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "corretor"],
    },
  },
} as const
