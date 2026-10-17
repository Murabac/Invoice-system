export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type DocumentType = "quotation" | "invoice";
export type DocumentStatus = "draft" | "issued" | "paid";
export type InvoiceHeaderTheme = "m2b";
export type InvoiceStampPreset = "m2b";
export type UserRole = "super_admin" | "admin" | "pending";
export type CashbookEntryType = "income" | "expense";
export type CashbookSource = "manual" | "invoice";

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
          business_address_line1: string | null;
          business_address_line2: string | null;
          business_phone: string | null;
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
          business_address_line1?: string | null;
          business_address_line2?: string | null;
          business_phone?: string | null;
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
          business_address_line1?: string | null;
          business_address_line2?: string | null;
          business_phone?: string | null;
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
          hide_client_name: boolean;
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
          hide_client_name?: boolean;
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
          hide_client_name?: boolean;
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
      cashbook_entries: {
        Row: {
          id: string;
          user_id: string;
          entry_type: CashbookEntryType;
          amount: number;
          entry_date: string;
          description: string;
          category: string | null;
          source: CashbookSource;
          invoice_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entry_type: CashbookEntryType;
          amount: number;
          entry_date?: string;
          description: string;
          category?: string | null;
          source?: CashbookSource;
          invoice_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          entry_type?: CashbookEntryType;
          amount?: number;
          entry_date?: string;
          description?: string;
          category?: string | null;
          source?: CashbookSource;
          invoice_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      library_folders: {
        Row: {
          id: string;
          name: string;
          parent_id: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          parent_id?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          parent_id?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      library_files: {
        Row: {
          id: string;
          folder_id: string | null;
          title: string;
          original_filename: string;
          storage_path: string;
          mime_type: string;
          file_size_bytes: number;
          uploaded_by: string;
          document_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          folder_id?: string | null;
          title: string;
          original_filename: string;
          storage_path: string;
          mime_type: string;
          file_size_bytes: number;
          uploaded_by: string;
          document_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          folder_id?: string | null;
          title?: string;
          original_filename?: string;
          storage_path?: string;
          mime_type?: string;
          file_size_bytes?: number;
          uploaded_by?: string;
          document_id?: string | null;
          created_at?: string;
          updated_at?: string;
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
export type CashbookEntry =
  Database["invoice"]["Tables"]["cashbook_entries"]["Row"];
export type LibraryFolder =
  Database["invoice"]["Tables"]["library_folders"]["Row"];
export type LibraryFile =
  Database["invoice"]["Tables"]["library_files"]["Row"];

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
  hide_client_name: boolean;
  notes: string;
  items: LineItemForm[];
}
