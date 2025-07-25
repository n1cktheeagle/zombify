// File: lib/supabase.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      feedback: {
        Row: {
          id: string;
          created_at: string;
          image_url: string;
          issues: string[];
          project_name: string;
          score: number;
          analysis: Json; // Full ZombifyAnalysis stored as JSONB
          user_id: string | null;
          is_guest: boolean;
          chain_id: string;
          original_filename: string | null; // New field for original uploaded filename
        };
        Insert: {
          id?: string;
          created_at?: string;
          image_url: string;
          issues?: string[];
          project_name?: string;
          score?: number;
          analysis?: Json;
          user_id?: string | null;
          is_guest?: boolean;
          chain_id?: string;
          original_filename?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          image_url?: string;
          issues?: string[];
          project_name?: string;
          score?: number;
          analysis?: Json;
          user_id?: string | null;
          is_guest?: boolean;
          chain_id?: string;
          original_filename?: string | null;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}
