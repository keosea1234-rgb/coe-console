import type { EventType, FY, Region, Status } from './constants';
import type { BusinessGroup } from './types';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      client_errors: {
        Row: {
          id: string;
          source: 'error-boundary' | 'window-error' | 'unhandled-rejection';
          message: string;
          stack: string | null;
          component_stack: string | null;
          route: string | null;
          user_agent: string | null;
          app_version: string | null;
          actor_id: string | null;
          actor_email: string | null;
          reported_at: string;
        };
        Insert: {
          id?: string;
          source: 'error-boundary' | 'window-error' | 'unhandled-rejection';
          message: string;
          stack?: string | null;
          component_stack?: string | null;
          route?: string | null;
          user_agent?: string | null;
          app_version?: string | null;
          actor_id?: string | null;
          actor_email?: string | null;
          reported_at?: string;
        };
        Update: {
          id?: string;
          source?: 'error-boundary' | 'window-error' | 'unhandled-rejection';
          message?: string;
          stack?: string | null;
          component_stack?: string | null;
          route?: string | null;
          user_agent?: string | null;
          app_version?: string | null;
          actor_id?: string | null;
          actor_email?: string | null;
          reported_at?: string;
        };
        Relationships: [];
      };
      event_attachments: {
        Row: {
          id: string;
          event_id: string;
          doc_type: string;
          file_name: string;
          storage_path: string;
          content_type: string | null;
          size_bytes: number;
          uploaded_by: string | null;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          doc_type: string;
          file_name: string;
          storage_path: string;
          content_type?: string | null;
          size_bytes: number;
          uploaded_by?: string | null;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          doc_type?: string;
          file_name?: string;
          storage_path?: string;
          content_type?: string | null;
          size_bytes?: number;
          uploaded_by?: string | null;
          uploaded_at?: string;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          table_name: string;
          operation: 'INSERT' | 'UPDATE' | 'DELETE';
          record_id: string;
          actor_id: string | null;
          actor_email: string | null;
          changed_fields: string[];
          old_data: Json | null;
          new_data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          table_name: string;
          operation: 'INSERT' | 'UPDATE' | 'DELETE';
          record_id: string;
          actor_id?: string | null;
          actor_email?: string | null;
          changed_fields?: string[];
          old_data?: Json | null;
          new_data?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          table_name?: string;
          operation?: 'INSERT' | 'UPDATE' | 'DELETE';
          record_id?: string;
          actor_id?: string | null;
          actor_email?: string | null;
          changed_fields?: string[];
          old_data?: Json | null;
          new_data?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      feedback_responses: {
        Row: {
          id: string;
          event_id: string;
          requestor_id: string;
          requestor_email: string;
          tool_score: number;
          support_score: number;
          comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          requestor_id: string;
          requestor_email: string;
          tool_score: number;
          support_score: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          requestor_id?: string;
          requestor_email?: string;
          tool_score?: number;
          support_score?: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          role: 'user' | 'admin';
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: 'user' | 'admin';
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'user' | 'admin';
          created_at?: string;
        };
        Relationships: [];
      };
      request_updates: {
        Row: {
          id: string;
          event_id: string;
          author_id: string;
          author_email: string;
          author_role: 'user' | 'admin';
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          author_id: string;
          author_email: string;
          author_role: 'user' | 'admin';
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          author_id?: string;
          author_email?: string;
          author_role?: 'user' | 'admin';
          body?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      sourcing_events: {
        Row: {
          id: string;
          name: string;
          fy: FY;
          category: string;
          subcategory: string;
          region: Region;
          regions: Region[] | null;
          business_groups: BusinessGroup[] | null;
          type: EventType;
          event_types: EventType[] | null;
          status: Status;
          addressable: number | string;
          sourced: number | string;
          savings: number | string;
          start_date: string;
          requestor: string | null;
          requestor_id: string | null;
          should_cost_modeling: boolean | null;
          risk_assessment: boolean | null;
          esg_assessment: boolean | null;
          directness: 'Direct' | 'Indirect' | null;
          feedback_requested: boolean;
          request_created_at: string | null;
          archived_at: string | null;
          archived_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          fy: FY;
          category: string;
          subcategory: string;
          region: Region;
          regions?: Region[] | null;
          business_groups?: BusinessGroup[] | null;
          type: EventType;
          event_types?: EventType[] | null;
          status?: Status;
          addressable?: number | string;
          sourced?: number | string;
          savings?: number | string;
          start_date: string;
          requestor?: string | null;
          requestor_id?: string | null;
          should_cost_modeling?: boolean | null;
          risk_assessment?: boolean | null;
          esg_assessment?: boolean | null;
          directness?: 'Direct' | 'Indirect' | null;
          feedback_requested?: boolean;
          request_created_at?: string | null;
          archived_at?: string | null;
          archived_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          fy?: FY;
          category?: string;
          subcategory?: string;
          region?: Region;
          regions?: Region[] | null;
          business_groups?: BusinessGroup[] | null;
          type?: EventType;
          event_types?: EventType[] | null;
          status?: Status;
          addressable?: number | string;
          sourced?: number | string;
          savings?: number | string;
          start_date?: string;
          requestor?: string | null;
          requestor_id?: string | null;
          should_cost_modeling?: boolean | null;
          risk_assessment?: boolean | null;
          esg_assessment?: boolean | null;
          directness?: 'Direct' | 'Indirect' | null;
          feedback_requested?: boolean;
          request_created_at?: string | null;
          archived_at?: string | null;
          archived_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      spend_baseline: {
        Row: {
          fy: FY;
          category: string;
          region: Region;
          value: number | string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          fy: FY;
          category: string;
          region: Region;
          value: number | string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          fy?: FY;
          category?: string;
          region?: Region;
          value?: number | string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      audit_changed_fields: {
        Args: { old_row: Json; new_row: Json };
        Returns: string[];
      };
      audit_record_id: {
        Args: { row_data: Json };
        Returns: string;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      directness: 'Direct' | 'Indirect';
      event_status: Status;
      event_type: EventType;
      fy: FY;
      region: Region;
      user_role: 'user' | 'admin';
    };
    CompositeTypes: Record<string, never>;
  };
};
