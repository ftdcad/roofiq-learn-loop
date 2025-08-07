export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      learning_events: {
        Row: {
          accuracy_delta: number | null
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          patterns_learned: Json | null
          prediction_id: string
        }
        Insert: {
          accuracy_delta?: number | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          patterns_learned?: Json | null
          prediction_id: string
        }
        Update: {
          accuracy_delta?: number | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          patterns_learned?: Json | null
          prediction_id?: string
        }
        Relationships: []
      }
      neighborhood_analysis: {
        Row: {
          address: string
          analysis_date: string
          average_roof_area: number | null
          coordinates: Json
          id: string
          median_roof_area: number | null
          radius_miles: number
          total_samples: number | null
        }
        Insert: {
          address: string
          analysis_date?: string
          average_roof_area?: number | null
          coordinates: Json
          id?: string
          median_roof_area?: number | null
          radius_miles?: number
          total_samples?: number | null
        }
        Update: {
          address?: string
          analysis_date?: string
          average_roof_area?: number | null
          coordinates?: Json
          id?: string
          median_roof_area?: number | null
          radius_miles?: number
          total_samples?: number | null
        }
        Relationships: []
      }
      prediction_feedback: {
        Row: {
          created_at: string
          feedback_type: string
          id: string
          prediction_id: string
          user_feedback: string | null
        }
        Insert: {
          created_at?: string
          feedback_type: string
          id?: string
          prediction_id: string
          user_feedback?: string | null
        }
        Update: {
          created_at?: string
          feedback_type?: string
          id?: string
          prediction_id?: string
          user_feedback?: string | null
        }
        Relationships: []
      }
      quality_checks: {
        Row: {
          confidence_calibration: number | null
          created_at: string
          id: string
          internal_consistency: boolean | null
          outlier_detection: boolean | null
          physically_possible: boolean | null
          prediction_id: string
          validation_notes: string | null
        }
        Insert: {
          confidence_calibration?: number | null
          created_at?: string
          id?: string
          internal_consistency?: boolean | null
          outlier_detection?: boolean | null
          physically_possible?: boolean | null
          prediction_id: string
          validation_notes?: string | null
        }
        Update: {
          confidence_calibration?: number | null
          created_at?: string
          id?: string
          internal_consistency?: boolean | null
          outlier_detection?: boolean | null
          physically_possible?: boolean | null
          prediction_id?: string
          validation_notes?: string | null
        }
        Relationships: []
      }
      roof_analyses: {
        Row: {
          address: string
          ai_confidence: number | null
          ai_prediction: Json
          area_error_percent: number | null
          comparison_results: Json | null
          coordinates: Json
          created_at: string
          footprint_data: Json | null
          footprint_upload_date: string | null
          id: string
          overall_accuracy_score: number | null
          prediction_date: string
          satellite_image_url: string | null
          updated_at: string
          user_id: string | null
          validation_data: Json | null
          validation_report_id: string | null
          validation_upload_date: string | null
        }
        Insert: {
          address: string
          ai_confidence?: number | null
          ai_prediction: Json
          area_error_percent?: number | null
          comparison_results?: Json | null
          coordinates: Json
          created_at?: string
          footprint_data?: Json | null
          footprint_upload_date?: string | null
          id?: string
          overall_accuracy_score?: number | null
          prediction_date?: string
          satellite_image_url?: string | null
          updated_at?: string
          user_id?: string | null
          validation_data?: Json | null
          validation_report_id?: string | null
          validation_upload_date?: string | null
        }
        Update: {
          address?: string
          ai_confidence?: number | null
          ai_prediction?: Json
          area_error_percent?: number | null
          comparison_results?: Json | null
          coordinates?: Json
          created_at?: string
          footprint_data?: Json | null
          footprint_upload_date?: string | null
          id?: string
          overall_accuracy_score?: number | null
          prediction_date?: string
          satellite_image_url?: string | null
          updated_at?: string
          user_id?: string | null
          validation_data?: Json | null
          validation_report_id?: string | null
          validation_upload_date?: string | null
        }
        Relationships: []
      }
      system_metrics: {
        Row: {
          average_processing_time_ms: number | null
          cost_per_prediction: number | null
          created_at: string
          daily_predictions: number | null
          error_rate: number | null
          id: string
          learning_velocity: number | null
          metadata: Json | null
          metric_date: string
        }
        Insert: {
          average_processing_time_ms?: number | null
          cost_per_prediction?: number | null
          created_at?: string
          daily_predictions?: number | null
          error_rate?: number | null
          id?: string
          learning_velocity?: number | null
          metadata?: Json | null
          metric_date?: string
        }
        Update: {
          average_processing_time_ms?: number | null
          cost_per_prediction?: number | null
          created_at?: string
          daily_predictions?: number | null
          error_rate?: number | null
          id?: string
          learning_velocity?: number | null
          metadata?: Json | null
          metric_date?: string
        }
        Relationships: []
      }
      training_progress: {
        Row: {
          area_accuracy: number
          average_accuracy: number
          estimated_days_to_target: number | null
          facet_detection_rate: number
          id: string
          last_updated: string
          model_version: string
          pitch_accuracy: number
          target_comparisons: number
          total_comparisons: number
        }
        Insert: {
          area_accuracy?: number
          average_accuracy?: number
          estimated_days_to_target?: number | null
          facet_detection_rate?: number
          id?: string
          last_updated?: string
          model_version?: string
          pitch_accuracy?: number
          target_comparisons?: number
          total_comparisons?: number
        }
        Update: {
          area_accuracy?: number
          average_accuracy?: number
          estimated_days_to_target?: number | null
          facet_detection_rate?: number
          id?: string
          last_updated?: string
          model_version?: string
          pitch_accuracy?: number
          target_comparisons?: number
          total_comparisons?: number
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
