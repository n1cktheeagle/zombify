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
        };
        Insert: {
          id?: string;
          created_at?: string;
          image_url: string;
          issues?: string[];
          project_name?: string;
          score?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          image_url?: string;
          issues?: string[];
          project_name?: string;
          score?: number;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}
