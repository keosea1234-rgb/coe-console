import type { EventType, FY, Region, Status } from './constants';
import type { BusinessGroup } from './types';

type OrgStatus = 'active' | 'inactive';
type OrgMembershipRole = 'member' | 'manager' | 'admin';
type MembershipStatus = 'active' | 'invited' | 'inactive';
type SupplierStatus = 'active' | 'inactive' | 'blocked';
type SupplierContactStatus = 'active' | 'invited' | 'inactive';
type SupplierParticipationStatus =
  | 'invited'
  | 'accepted'
  | 'declined'
  | 'submitted'
  | 'awarded'
  | 'not_awarded'
  | 'withdrawn';
type RfxWorkflowStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'published'
  | 'live'
  | 'evaluation'
  | 'awarded'
  | 'cancelled'
  | 'closed';
type ApprovalRequestType = 'event_launch' | 'award' | 'document_exception' | 'other';
type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
type DocumentRequirementStatus = 'open' | 'waived' | 'closed';
type DocumentSubmissionStatus = 'submitted' | 'accepted' | 'rejected' | 'superseded';

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
      approval_requests: {
        Row: {
          id: string;
          org_id: string;
          event_id: string | null;
          request_type: ApprovalRequestType;
          status: ApprovalStatus;
          requester_id: string | null;
          approver_id: string | null;
          due_at: string | null;
          decided_at: string | null;
          decision_note: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          event_id?: string | null;
          request_type: ApprovalRequestType;
          status?: ApprovalStatus;
          requester_id?: string | null;
          approver_id?: string | null;
          due_at?: string | null;
          decided_at?: string | null;
          decision_note?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          event_id?: string | null;
          request_type?: ApprovalRequestType;
          status?: ApprovalStatus;
          requester_id?: string | null;
          approver_id?: string | null;
          due_at?: string | null;
          decided_at?: string | null;
          decision_note?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
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
      document_requirements: {
        Row: {
          id: string;
          org_id: string;
          event_id: string;
          supplier_id: string | null;
          name: string;
          description: string | null;
          required: boolean;
          status: DocumentRequirementStatus;
          due_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          event_id: string;
          supplier_id?: string | null;
          name: string;
          description?: string | null;
          required?: boolean;
          status?: DocumentRequirementStatus;
          due_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          event_id?: string;
          supplier_id?: string | null;
          name?: string;
          description?: string | null;
          required?: boolean;
          status?: DocumentRequirementStatus;
          due_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      document_submissions: {
        Row: {
          id: string;
          org_id: string;
          requirement_id: string;
          participation_id: string;
          supplier_id: string;
          submitted_by_contact_id: string | null;
          status: DocumentSubmissionStatus;
          file_name: string;
          storage_path: string;
          content_type: string | null;
          size_bytes: number;
          reviewed_by: string | null;
          reviewed_at: string | null;
          reviewer_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          requirement_id: string;
          participation_id: string;
          supplier_id: string;
          submitted_by_contact_id?: string | null;
          status?: DocumentSubmissionStatus;
          file_name: string;
          storage_path: string;
          content_type?: string | null;
          size_bytes: number;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          reviewer_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          requirement_id?: string;
          participation_id?: string;
          supplier_id?: string;
          submitted_by_contact_id?: string | null;
          status?: DocumentSubmissionStatus;
          file_name?: string;
          storage_path?: string;
          content_type?: string | null;
          size_bytes?: number;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          reviewer_note?: string | null;
          created_at?: string;
          updated_at?: string;
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
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          status: OrgStatus;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          status?: OrgStatus;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          status?: OrgStatus;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      org_memberships: {
        Row: {
          id: string;
          org_id: string;
          user_id: string;
          role: OrgMembershipRole;
          status: MembershipStatus;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          user_id: string;
          role?: OrgMembershipRole;
          status?: MembershipStatus;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          user_id?: string;
          role?: OrgMembershipRole;
          status?: MembershipStatus;
          created_by?: string | null;
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
      sourcing_event_status_history: {
        Row: {
          id: string;
          org_id: string;
          event_id: string;
          old_status: string | null;
          new_status: RfxWorkflowStatus;
          note: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          event_id: string;
          old_status?: string | null;
          new_status: RfxWorkflowStatus;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          event_id?: string;
          old_status?: string | null;
          new_status?: RfxWorkflowStatus;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
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
      supplier_contacts: {
        Row: {
          id: string;
          org_id: string;
          supplier_id: string;
          profile_id: string | null;
          email: string;
          full_name: string | null;
          title: string | null;
          status: SupplierContactStatus;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          supplier_id: string;
          profile_id?: string | null;
          email: string;
          full_name?: string | null;
          title?: string | null;
          status?: SupplierContactStatus;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          supplier_id?: string;
          profile_id?: string | null;
          email?: string;
          full_name?: string | null;
          title?: string | null;
          status?: SupplierContactStatus;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      supplier_event_participation: {
        Row: {
          id: string;
          org_id: string;
          event_id: string;
          supplier_id: string;
          status: SupplierParticipationStatus;
          invited_at: string | null;
          responded_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          event_id: string;
          supplier_id: string;
          status?: SupplierParticipationStatus;
          invited_at?: string | null;
          responded_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          event_id?: string;
          supplier_id?: string;
          status?: SupplierParticipationStatus;
          invited_at?: string | null;
          responded_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      suppliers: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          legal_name: string | null;
          status: SupplierStatus;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          legal_name?: string | null;
          status?: SupplierStatus;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          legal_name?: string | null;
          status?: SupplierStatus;
          created_by?: string | null;
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
      can_read_document_requirement: {
        Args: { target_requirement_id: string };
        Returns: boolean;
      };
      can_read_document_submission: {
        Args: { target_submission_id: string };
        Returns: boolean;
      };
      can_submit_document: {
        Args: {
          target_requirement_id: string;
          target_participation_id: string;
          target_supplier_id: string;
          target_contact_id: string;
        };
        Returns: boolean;
      };
      dashboard_summary: {
        Args: {
          filter_fys?: FY[] | null;
          filter_statuses?: Status[] | null;
          filter_categories?: string[] | null;
          filter_regions?: Region[] | null;
          filter_subcategories?: string[] | null;
          filter_types?: EventType[] | null;
          filter_requestor_id?: string | null;
          filter_created_from?: string | null;
          filter_created_to?: string | null;
        };
        Returns: {
          total_addressable: number | string;
          total_sourced: number | string;
          total_savings: number | string;
          total_events: number | string;
          live_events: number | string;
          completed_events: number | string;
          status_counts: Json;
          category_counts: Json;
          region_counts: Json;
        }[];
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_org_member: {
        Args: { target_org_id: string };
        Returns: boolean;
      };
      is_supplier_contact: {
        Args: { target_supplier_id: string };
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
