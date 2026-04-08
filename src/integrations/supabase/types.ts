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
      historial_consultas: {
        Row: {
          created_at: string
          email: string | null
          id: string
          placa: string
          resultado: Json | null
          status: string
          telefono: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          placa: string
          resultado?: Json | null
          status?: string
          telefono?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          placa?: string
          resultado?: Json | null
          status?: string
          telefono?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historial_consultas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          ano: number | null
          comentarios: string | null
          created_at: string
          id: string
          marca_modelo: string | null
          nombre: string
          placa: string | null
          plan: string | null
          status: string
          telefono: string
          tipo_usuario: string
        }
        Insert: {
          ano?: number | null
          comentarios?: string | null
          created_at?: string
          id?: string
          marca_modelo?: string | null
          nombre: string
          placa?: string | null
          plan?: string | null
          status?: string
          telefono: string
          tipo_usuario: string
        }
        Update: {
          ano?: number | null
          comentarios?: string | null
          created_at?: string
          id?: string
          marca_modelo?: string | null
          nombre?: string
          placa?: string | null
          plan?: string | null
          status?: string
          telefono?: string
          tipo_usuario?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cedula: string | null
          created_at: string
          email: string | null
          id: string
          nombre: string | null
          role: string
          telefono: string | null
        }
        Insert: {
          cedula?: string | null
          created_at?: string
          email?: string | null
          id: string
          nombre?: string | null
          role?: string
          telefono?: string | null
        }
        Update: {
          cedula?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nombre?: string | null
          role?: string
          telefono?: string | null
        }
        Relationships: []
      }
      role_audit_log: {
        Row: {
          changed_by: string
          created_at: string
          id: string
          new_role: string
          old_role: string
          profile_id: string
        }
        Insert: {
          changed_by: string
          created_at?: string
          id?: string
          new_role: string
          old_role: string
          profile_id: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          id?: string
          new_role?: string
          old_role?: string
          profile_id?: string
        }
        Relationships: []
      }
      sla_config: {
        Row: {
          descripcion: string | null
          etapa: string
          horas_objetivo: number
          id: string
          updated_at: string
        }
        Insert: {
          descripcion?: string | null
          etapa: string
          horas_objetivo?: number
          id?: string
          updated_at?: string
        }
        Update: {
          descripcion?: string | null
          etapa?: string
          horas_objetivo?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      traspaso_contratos: {
        Row: {
          contenido_html: string
          created_at: string
          id: string
          pdf_url: string | null
          status: string
          tipo: string
          traspaso_id: string
        }
        Insert: {
          contenido_html: string
          created_at?: string
          id?: string
          pdf_url?: string | null
          status?: string
          tipo: string
          traspaso_id: string
        }
        Update: {
          contenido_html?: string
          created_at?: string
          id?: string
          pdf_url?: string | null
          status?: string
          tipo?: string
          traspaso_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "traspaso_contratos_traspaso_id_fkey"
            columns: ["traspaso_id"]
            isOneToOne: false
            referencedRelation: "traspasos"
            referencedColumns: ["id"]
          },
        ]
      }
      traspaso_documentos: {
        Row: {
          file_url: string
          id: string
          tipo: string
          traspaso_id: string
          uploaded_at: string
        }
        Insert: {
          file_url: string
          id?: string
          tipo: string
          traspaso_id: string
          uploaded_at?: string
        }
        Update: {
          file_url?: string
          id?: string
          tipo?: string
          traspaso_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "traspaso_documentos_traspaso_id_fkey"
            columns: ["traspaso_id"]
            isOneToOne: false
            referencedRelation: "traspasos"
            referencedColumns: ["id"]
          },
        ]
      }
      traspaso_firmas: {
        Row: {
          cedula_firmante: string | null
          contrato_id: string | null
          created_at: string
          documento_url: string | null
          firma_hash: string
          firma_imagen_url: string
          geolocation: string | null
          id: string
          ip_address: string | null
          nombre_firmante: string
          tipo_firmante: string
          traspaso_id: string
          user_agent: string | null
        }
        Insert: {
          cedula_firmante?: string | null
          contrato_id?: string | null
          created_at?: string
          documento_url?: string | null
          firma_hash: string
          firma_imagen_url: string
          geolocation?: string | null
          id?: string
          ip_address?: string | null
          nombre_firmante: string
          tipo_firmante: string
          traspaso_id: string
          user_agent?: string | null
        }
        Update: {
          cedula_firmante?: string | null
          contrato_id?: string | null
          created_at?: string
          documento_url?: string | null
          firma_hash?: string
          firma_imagen_url?: string
          geolocation?: string | null
          id?: string
          ip_address?: string | null
          nombre_firmante?: string
          tipo_firmante?: string
          traspaso_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "traspaso_firmas_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "traspaso_contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traspaso_firmas_traspaso_id_fkey"
            columns: ["traspaso_id"]
            isOneToOne: false
            referencedRelation: "traspasos"
            referencedColumns: ["id"]
          },
        ]
      }
      traspaso_timeline: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          nota: string | null
          status: string
          traspaso_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          nota?: string | null
          status: string
          traspaso_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          nota?: string | null
          status?: string
          traspaso_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "traspaso_timeline_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traspaso_timeline_traspaso_id_fkey"
            columns: ["traspaso_id"]
            isOneToOne: false
            referencedRelation: "traspasos"
            referencedColumns: ["id"]
          },
        ]
      }
      traspasos: {
        Row: {
          antifraude_notas: string | null
          antifraude_status: string
          apoderado_cedula: string | null
          apoderado_nombre: string | null
          codigo: string | null
          comprador_cedula: string | null
          comprador_nombre: string | null
          comprador_rnc: string | null
          comprador_telefono: string | null
          comprador_tipo_persona: string
          created_at: string
          customer_id: string
          es_traspaso_familiar: boolean
          escrow_status: string
          fecha_acto_venta: string | null
          gestor_id: string | null
          id: string
          medio_pago: string | null
          mensajero_nombre: string | null
          notas_internas: string | null
          pago_servicio_status: string
          plan: string
          precio_servicio: number
          precio_vehiculo: number | null
          status: string
          tiene_apoderado: boolean
          tipo_vehiculo: string
          updated_at: string
          vehiculo_ano: number | null
          vehiculo_chasis: string | null
          vehiculo_color: string | null
          vehiculo_marca: string | null
          vehiculo_modelo: string | null
          vehiculo_placa: string | null
          vendedor_cedula: string | null
          vendedor_nombre: string | null
          vendedor_rnc: string | null
          vendedor_telefono: string | null
          vendedor_tipo_persona: string
        }
        Insert: {
          antifraude_notas?: string | null
          antifraude_status?: string
          apoderado_cedula?: string | null
          apoderado_nombre?: string | null
          codigo?: string | null
          comprador_cedula?: string | null
          comprador_nombre?: string | null
          comprador_rnc?: string | null
          comprador_telefono?: string | null
          comprador_tipo_persona?: string
          created_at?: string
          customer_id: string
          es_traspaso_familiar?: boolean
          escrow_status?: string
          fecha_acto_venta?: string | null
          gestor_id?: string | null
          id?: string
          medio_pago?: string | null
          mensajero_nombre?: string | null
          notas_internas?: string | null
          pago_servicio_status?: string
          plan?: string
          precio_servicio?: number
          precio_vehiculo?: number | null
          status?: string
          tiene_apoderado?: boolean
          tipo_vehiculo?: string
          updated_at?: string
          vehiculo_ano?: number | null
          vehiculo_chasis?: string | null
          vehiculo_color?: string | null
          vehiculo_marca?: string | null
          vehiculo_modelo?: string | null
          vehiculo_placa?: string | null
          vendedor_cedula?: string | null
          vendedor_nombre?: string | null
          vendedor_rnc?: string | null
          vendedor_telefono?: string | null
          vendedor_tipo_persona?: string
        }
        Update: {
          antifraude_notas?: string | null
          antifraude_status?: string
          apoderado_cedula?: string | null
          apoderado_nombre?: string | null
          codigo?: string | null
          comprador_cedula?: string | null
          comprador_nombre?: string | null
          comprador_rnc?: string | null
          comprador_telefono?: string | null
          comprador_tipo_persona?: string
          created_at?: string
          customer_id?: string
          es_traspaso_familiar?: boolean
          escrow_status?: string
          fecha_acto_venta?: string | null
          gestor_id?: string | null
          id?: string
          medio_pago?: string | null
          mensajero_nombre?: string | null
          notas_internas?: string | null
          pago_servicio_status?: string
          plan?: string
          precio_servicio?: number
          precio_vehiculo?: number | null
          status?: string
          tiene_apoderado?: boolean
          tipo_vehiculo?: string
          updated_at?: string
          vehiculo_ano?: number | null
          vehiculo_chasis?: string | null
          vehiculo_color?: string | null
          vehiculo_marca?: string | null
          vehiculo_modelo?: string | null
          vehiculo_placa?: string | null
          vendedor_cedula?: string | null
          vendedor_nombre?: string | null
          vendedor_rnc?: string | null
          vendedor_telefono?: string | null
          vendedor_tipo_persona?: string
        }
        Relationships: [
          {
            foreignKeyName: "traspasos_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traspasos_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: { Args: { _user_id: string }; Returns: string }
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
    Enums: {},
  },
} as const
