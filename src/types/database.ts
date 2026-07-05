export type FixedExpenseCategory =
  | "moradia"
  | "utilidades"
  | "financiamento"
  | "outros";

export type Profile = {
  id: string;
  full_name: string;
  created_at: string;
};

export type FixedExpense = {
  id: string;
  user_id: string;
  name: string;
  category: FixedExpenseCategory;
  due_day: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type FixedExpenseEntry = {
  id: string;
  fixed_expense_id: string;
  user_id: string;
  amount: number;
  billing_month: string;
  due_day: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type FixedExpenseWithEntry = FixedExpense & {
  entry: FixedExpenseEntry | null;
};

export type FixedExpenseEntryWithAccount = FixedExpenseEntry & {
  fixed_expenses: { name: string; category: string; is_active: boolean };
};

export type CreditCard = {
  id: string;
  user_id: string;
  name: string;
  last_digits: string | null;
  closing_day: number;
  due_day: number;
  credit_limit: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CardMember = {
  id: string;
  credit_card_id: string;
  name: string;
  is_owner: boolean;
  created_at: string;
};

export type Purchase = {
  id: string;
  credit_card_id: string;
  card_member_id: string;
  description: string;
  total_amount: number;
  purchase_date: string;
  installments: number;
  created_at: string;
};

export type PurchaseInstallment = {
  id: string;
  purchase_id: string;
  credit_card_id: string;
  installment_number: number;
  amount: number;
  billing_month: string;
  created_at: string;
};

export type PurchaseWithMember = Purchase & {
  card_members: Pick<CardMember, "name" | "is_owner">;
};

export type InstallmentWithDetails = PurchaseInstallment & {
  purchases: Pick<Purchase, "description" | "installments" | "purchase_date"> & {
    card_members: Pick<CardMember, "name" | "is_owner">;
  };
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          full_name?: string;
        };
        Update: {
          full_name?: string;
        };
        Relationships: [];
      };
      fixed_expenses: {
        Row: FixedExpense;
        Insert: {
          user_id: string;
          name: string;
          category: FixedExpenseCategory;
          due_day: number;
          is_active?: boolean;
          notes?: string | null;
        };
        Update: {
          name?: string;
          category?: FixedExpenseCategory;
          due_day?: number;
          is_active?: boolean;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      fixed_expense_entries: {
        Row: FixedExpenseEntry;
        Insert: {
          fixed_expense_id: string;
          user_id: string;
          amount: number;
          billing_month: string;
          due_day: number;
          notes?: string | null;
        };
        Update: {
          amount?: number;
          due_day?: number;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      credit_cards: {
        Row: CreditCard;
        Insert: {
          user_id: string;
          name: string;
          last_digits?: string | null;
          closing_day: number;
          due_day: number;
          credit_limit?: number | null;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          last_digits?: string | null;
          closing_day?: number;
          due_day?: number;
          credit_limit?: number | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      card_members: {
        Row: CardMember;
        Insert: {
          credit_card_id: string;
          name: string;
          is_owner?: boolean;
        };
        Update: {
          name?: string;
          is_owner?: boolean;
        };
        Relationships: [];
      };
      purchases: {
        Row: Purchase;
        Insert: {
          credit_card_id: string;
          card_member_id: string;
          description: string;
          total_amount: number;
          purchase_date: string;
          installments?: number;
        };
        Update: {
          card_member_id?: string;
          description?: string;
          total_amount?: number;
          purchase_date?: string;
          installments?: number;
        };
        Relationships: [];
      };
      purchase_installments: {
        Row: PurchaseInstallment;
        Insert: {
          purchase_id: string;
          credit_card_id: string;
          installment_number: number;
          amount: number;
          billing_month: string;
        };
        Update: {
          amount?: number;
          billing_month?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
