// src/lib/api.ts

const BASE = process.env.NEXT_PUBLIC_API_URL;

if (!BASE) {
  throw new Error("NEXT_PUBLIC_API_URL is not defined in environment variables");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
  
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `API error ${res.status}`);
  }
  
  return res.json();
}

// Ensure types are imported or defined (will add properly via types.ts)
import { 
  User, Group, GroupDetail, Member, Expense, ExpenseCreate, 
  BalanceSummary, MemberBalance, Settlement, SettlementCreate, ImportReport, Token
} from "./types";

// Auth
export const api = {
  auth: {
    login:    (email: string, password: string) =>
      request<Token>("/api/auth/login", { method:"POST", body: JSON.stringify({email, password}) }),
    register: (name: string, email: string, password: string) =>
      request<Token>("/api/auth/register", { method:"POST", body: JSON.stringify({name, email, password}) }),
    me:       () => request<User>("/api/auth/me"),
  },
  
  groups: {
    list:          () => request<Group[]>("/api/groups"),
    create:        (data: {name: string, description?: string}) => request<Group>("/api/groups", { method:"POST", body: JSON.stringify(data) }),
    detail:        (id: number) => request<GroupDetail>(`/api/groups/${id}`),
    addMember:     (groupId: number, userId: number, joinedAt: string) =>
      request(`/api/groups/${groupId}/members`, { method:"POST", body: JSON.stringify({user_id: userId, joined_at: joinedAt}) }),
    removeMember:  (groupId: number, userId: number, leftAt: string) =>
      request(`/api/groups/${groupId}/members/${userId}/leave`, { method:"PATCH", body: JSON.stringify({left_at: leftAt}) }),
    activeMembers: (groupId: number, date: string) =>
      request<Member[]>(`/api/groups/${groupId}/members?date=${date}`),
  },
  
  expenses: {
    list:   (groupId: number) => request<Expense[]>(`/api/expenses?group_id=${groupId}`),
    create: (data: ExpenseCreate) => request<Expense>("/api/expenses", { method:"POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<ExpenseCreate>) => request<Expense>(`/api/expenses/${id}`, { method:"PUT", body: JSON.stringify(data) }),
    delete: (id: number) => request(`/api/expenses/${id}`, { method:"DELETE" }),
  },
  
  balances: {
    summary:  (groupId: number) => request<BalanceSummary>(`/api/groups/${groupId}/balances`),
    member:   (groupId: number, userId: number) => request<MemberBalance>(`/api/groups/${groupId}/balances/${userId}`),
  },
  
  settlements: {
    list:   (groupId: number) => request<Settlement[]>(`/api/groups/${groupId}/settlements`),
    create: (data: SettlementCreate) => request<Settlement>("/api/settlements", { method:"POST", body: JSON.stringify(data) }),
  },
  
  import: {
    upload:  (groupId: number, file: File) => {
      const form = new FormData();
      form.append("file", file);
      form.append("group_id", groupId.toString());
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
      return fetch(`${BASE}/api/import`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      }).then(r => r.json()) as Promise<ImportReport>;
    },
    report:   (runId: string) => request<ImportReport>(`/api/import/${runId}/report`),
    resolve:  (runId: string, anomalyId: number, action: "approve" | "skip") =>
      request(`/api/import/${runId}/resolve/${anomalyId}`, { method:"POST", body: JSON.stringify({action}) }),
  },
};
