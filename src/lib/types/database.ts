export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type DocumentType = "quotation" | "invoice";
export type DocumentStatus = "draft" | "issued" | "paid";
export type InvoiceHeaderTheme = "blue" | "gradient" | "h24";
export type InvoiceStampPreset = "biloop" | "h24";
export type UserRole = "super_admin" | "admin";

export interface Database {
  invoice: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          company_name: string | null;
          logo_url: string | null;
          dashboard_logo_url: string | null;
          dashboard_header_text: string | null;
          invoice_header_theme: InvoiceHeaderTheme;
          invoice_stamp: InvoiceStampPreset;
          default_terms: string[];
          contact_name: string | null;
          contact_phone_1: string | null;
          contact_phone_2: string | null;
          website_url: string | null;
          email: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          company_name?: string | null;
          logo_url?: string | null;
          dashboard_logo_url?: string | null;
          dashboard_header_text?: string | null;
          invoice_header_theme?: InvoiceHeaderTheme;
          invoice_stamp?: InvoiceStampPreset;
          default_terms?: string[];
          contact_name?: string | null;
          contact_phone_1?: string | null;
          contact_phone_2?: string | null;
          website_url?: string | null;
          email?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_name?: string | null;
          logo_url?: string | null;
          dashboard_logo_url?: string | null;
          dashboard_header_text?: string | null;
          invoice_header_theme?: InvoiceHeaderTheme;
          invoice_stamp?: InvoiceStampPreset;
          default_terms?: string[];
          contact_name?: string | null;
          contact_phone_1?: string | null;
          contact_phone_2?: string | null;
          website_url?: string | null;
          email?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          address: string | null;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          address?: string | null;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          address?: string | null;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          type: DocumentType;
          document_number: string;
          status: DocumentStatus;
          issue_date: string | null;
          due_date: string | null;
          client_id: string | null;
          subtotal: number;
          tax: number;
          tax_rate: number;
          grand_total: number;
          has_stamp: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: DocumentType;
          document_number: string;
          status?: DocumentStatus;
          issue_date?: string | null;
          due_date?: string | null;
          client_id?: string | null;
          subtotal?: number;
          tax?: number;
          tax_rate?: number;
          grand_total?: number;
          has_stamp?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: DocumentType;
          document_number?: string;
          status?: DocumentStatus;
          issue_date?: string | null;
          due_date?: string | null;
          client_id?: string | null;
          subtotal?: number;
          tax?: number;
          tax_rate?: number;
          grand_total?: number;
          has_stamp?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      document_items: {
        Row: {
          id: string;
          document_id: string;
          product_name: string;
          unit_price: number;
          quantity: number;
          total: number;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          product_name: string;
          unit_price?: number;
          quantity?: number;
          total?: number;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          product_name?: string;
          unit_price?: number;
          quantity?: number;
          total?: number;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["invoice"]["Tables"]["profiles"]["Row"];
export type Client = Database["invoice"]["Tables"]["clients"]["Row"];
export type Document = Database["invoice"]["Tables"]["documents"]["Row"];
export type DocumentItem = Database["invoice"]["Tables"]["document_items"]["Row"];

export type DocumentWithRelations = Document & {
  clients: Client | null;
  document_items: DocumentItem[];
};

export interface LineItemForm {
  id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
}

export interface DocumentFormState {
  type: DocumentType;
  status: DocumentStatus;
  document_number: string;
  issue_date: string;
  due_date: string;
  client_id: string;
  tax_rate: number;
  has_stamp: boolean;
  notes: string;
  items: LineItemForm[];
}
