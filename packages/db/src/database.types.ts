export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          created_at?: string;
        };
        Update: {
          email?: string | null;
        };
        Relationships: [];
      };
      legends: {
        Row: {
          id: string;
          name: string;
          set_name: string;
        };
        Insert: {
          id: string;
          name: string;
          set_name: string;
        };
        Update: {
          name?: string;
          set_name?: string;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          user_id: string;
          player_legend_id: string;
          opponent_legend_id: string;
          notes: string | null;
          winner: "player" | "opponent" | "tie";
          player_game_wins: number;
          opponent_game_wins: number;
          duration_seconds: number | null;
          played_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          player_legend_id: string;
          opponent_legend_id: string;
          notes?: string | null;
          winner: "player" | "opponent" | "tie";
          player_game_wins: number;
          opponent_game_wins: number;
          duration_seconds?: number | null;
          played_at?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["matches"]["Insert"]>;
        Relationships: [];
      };
      games: {
        Row: {
          id: string;
          match_id: string;
          game_number: number;
          starting_player: "player" | "opponent";
          winning_point: 8 | 9 | 10;
          winner: "player" | "opponent";
          player_score: number;
          opponent_score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          game_number: number;
          starting_player: "player" | "opponent";
          winning_point: 8 | 9 | 10;
          winner: "player" | "opponent";
          player_score: number;
          opponent_score: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["games"]["Insert"]>;
        Relationships: [];
      };
      score_events: {
        Row: {
          id: string;
          game_id: string;
          player_side: "player" | "opponent";
          event_type: "holding" | "conquering" | "ability" | "manual_adjustment";
          points_delta: number;
          resulting_player_score: number;
          resulting_opponent_score: number;
          previous_score: number | null;
          adjusted_score: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          player_side: "player" | "opponent";
          event_type: "holding" | "conquering" | "ability" | "manual_adjustment";
          points_delta: number;
          resulting_player_score: number;
          resulting_opponent_score: number;
          previous_score?: number | null;
          adjusted_score?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["score_events"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
