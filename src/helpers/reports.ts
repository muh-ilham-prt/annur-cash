import { apiFetch } from "./api";
import type { Payment } from "./domain";

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");

type ReportRow = {
  id: string | number;
  amount: number;
  evidence?: string | null;
  created_at?: string;
  payment?: {
    id?: string | number;
    student_id?: string | number;
    payment_type_id?: string | number;
    price?: number;
    paid?: number;
    credit?: number;
    student_name?: string | null;
    cls?: string | null;
    type?: { name?: string };
  };
};

type ReportResponse = { data?: { data?: ReportRow[] } | ReportRow[] };

const id = (value: string | number | undefined) => (value == null ? "" : String(value));
const evidenceUrl = (value: string | null | undefined) => {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  const path = value.replace(/^\//, "");
  const origin = API_URL.replace(/\/api\/?$/, "");
  return `${origin}/${path.startsWith("storage/") ? path : `storage/${path}`}`;
};

export const evidenceUrlFor = evidenceUrl;

export async function fetchRecentPayments(): Promise<Payment[]> {
  const response = await apiFetch<ReportResponse>("/reports?per_page=5000");
  const rows = Array.isArray(response.data) ? response.data : response.data?.data ?? [];
  const creditedBills = new Set<string>();
  return rows.map((row) => {
    const bill = row.payment ?? {};
    const billId = id(bill.id);
    const credit = billId && !creditedBills.has(billId) ? Number(bill.credit ?? 0) : 0;
    if (billId) creditedBills.add(billId);
    return {
      id: id(row.id),
      typeId: id(bill.payment_type_id),
      price: Number(bill.price ?? 0),
      paid: Number(row.amount ?? 0),
      billPaid: Number(bill.paid ?? 0),
      credit: credit || undefined,
      studentId: id(bill.student_id) || undefined,
      student: bill.student_name ?? undefined,
      cls: bill.cls ?? undefined,
      when: row.created_at,
      evidence: evidenceUrl(row.evidence),
    };
  });
}
