export interface Token {
  access_token: string;
  token_type: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Group {
  id: number;
  name: string;
  description?: string;
  created_by: number;
  created_at: string;
  members?: Member[];
  total_expenses?: number;
}

export interface GroupDetail extends Group {
  members: Member[];
}

export interface Member {
  group_id: number;
  user_id: number;
  user_name: string;
  joined_at: string;
  left_at: string | null;
}

export interface Expense {
  id: number;
  group_id: number;
  description: string;
  amount: number;
  expense_date: string;
  created_by: number;
  paid_by: number;
  paid_by_name: string;
  split_type: "equal" | "unequal" | "percentage" | "shares";
  i_paid: boolean;
  my_share: number;
}

export interface ExpenseCreate {
  group_id: number;
  description: string;
  amount: number;
  expense_date: string;
  paid_by: number;
  split_type: "equal" | "unequal" | "percentage" | "shares";
  splits: {
    user_id: number;
    split_value: number;
  }[];
}

export interface BalanceSummary {
  group_id: number;
  minimum_settlements: {
    from_user_id: number;
    from_user_name: string;
    to_user_id: number;
    to_user_name: string;
    amount: number;
  }[];
  member_balances: {
    user_id: number;
    user_name: string;
    net_balance: number;
  }[];
}

export interface MemberBalance {
  user_id: number;
  user_name: string;
  group_id: number;
  net_balance: number;
  owes: {
    user_id: number;
    user_name: string;
    amount: number;
  }[];
  owed_by: {
    user_id: number;
    user_name: string;
    amount: number;
  }[];
  expenses: {
    expense_id: number;
    description: string;
    amount: number;
    expense_date: string;
    paid_by: number;
    paid_by_name: string;
    my_share: number;
  }[];
}

export interface Settlement {
  id: number;
  group_id: number;
  from_user_id: number;
  to_user_id: number;
  amount: number;
  date: string;
}

export interface SettlementCreate {
  group_id: number;
  from_user_id: number;
  to_user_id: number;
  amount: number;
  date: string;
}

export interface ImportReport {
  run_id: string;
  status: "processing" | "review_needed" | "completed" | "failed";
  stats: {
    total: number;
    ready: number;
    flagged: number;
    fixed: number;
    skipped: number;
  };
  anomalies: {
    id: number;
    row_num: number;
    severity: "ERROR" | "WARNING" | "INFO";
    problem: string;
    raw_data: any;
    proposed_action: string;
    status: "pending" | "resolved";
    resolution_action: string | null;
  }[];
}
