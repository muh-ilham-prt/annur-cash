import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { IconName } from "../components/Icon";
import { translate } from "./i18n";

// Offline store. Everything the app shows reads from here; nothing touches the network.
export interface PaymentType {
  id: string;
  name: string;
  price: number;
  icon: IconName;
  archived: boolean;
}

export interface Payment {
  id: string;
  typeId: string;
  price: number;
  paid: number;
  // Optional: older rows and any row whose murid was deleted.
  studentId?: string;
  /** Snapshot at record time, so the record survives a murid delete or rename. */
  student?: string;
  cls?: string;
  /** ISO timestamp of the last payment. */
  when?: string;
  /** Overpaid money sitting on this bill; only a full bill holds deposit. */
  credit?: number;
}

export interface Student {
  id: string;
  name: string;
  cls: string;
  nis: string;
}

export interface TypeStat {
  n: number;
  got: number;
  due: number;
}

const TYPES_KEY = "annur_kas_types_v2";
const PAYMENTS_KEY = "annur_kas_payments_v2";
const STUDENTS_KEY = "annur_kas_students_v2";
// v1 shipped with seeded sample data already persisted; drop it so it can never come back.
const LEGACY_KEYS = ["annur_kas_paymentTypes", "annur_kas_payments"];

// Icon palettes from ui/kas-sekolah.html (ICONS). Tailwind classes there map to hex here.
export const TYPE_ICONS: { icon: IconName; bg: string; color: string }[] = [
  { icon: "book-bookmark-bold-duotone", bg: "#d8f3e3", color: "#136447" },
  { icon: "t-shirt-bold-duotone", bg: "#f8e4a8", color: "#c27f17" },
  { icon: "bus-bold-duotone", bg: "#e0f2fe", color: "#0369a1" },
  { icon: "notebook-bold-duotone", bg: "#ffe4e6", color: "#be123c" },
  { icon: "document-text-bold-duotone", bg: "#ede9fe", color: "#6d28d9" },
  { icon: "cup-star-bold-duotone", bg: "#f8e4a8", color: "#c27f17" },
  { icon: "heart-bold-duotone", bg: "#ffe4e6", color: "#be123c" },
  { icon: "tag-price-bold", bg: "#d8f3e3", color: "#136447" },
];

export const toneOf = (icon: IconName) => TYPE_ICONS.find((t) => t.icon === icon) ?? TYPE_ICONS[7];

// Storage is the only source: no sample data, empty until the user creates a type.
async function read<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key).catch(() => null);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as T[];
    } catch {}
  }
  return [];
}

// One listener set for the whole store keeps every mounted screen in sync.
type State = { types: PaymentType[]; payments: Payment[]; students: Student[] };
const listeners = new Set<(state: State) => void>();
const notify = (state: State) => listeners.forEach((fn) => fn(state));

export async function saveTypes(types: PaymentType[]) {
  await AsyncStorage.setItem(TYPES_KEY, JSON.stringify(types));
  notify({ types, payments: await read<Payment>(PAYMENTS_KEY), students: await read<Student>(STUDENTS_KEY) });
}

/** Money the murid has paid beyond their bills. */
export const depositOf = (studentId: string, payments: Payment[]) =>
  payments.filter((p) => p.studentId === studentId).reduce((sum, p) => sum + (p.credit ?? 0), 0);

// Spend a murid's deposit on bills, oldest first, up to `amount` (default: all).
// The bill holding the credit may be full, so credit moves freely between their bills.
function spendDeposit(rows: Payment[], studentId: string, amount = Infinity) {
  const touched = new Map<number, Payment>();
  for (const holder of rows.filter((r) => r.studentId === studentId && (r.credit ?? 0) > 0)) {
    for (const bill of [...rows].sort((a, b) => (a.when ?? "").localeCompare(b.when ?? "")).filter((b) => b.studentId === studentId && b.price > b.paid)) {
      const from = touched.get(rows.indexOf(holder)) ?? holder;
      const take = Math.min(from.credit ?? 0, bill.price - bill.paid, amount);
      if (take <= 0) continue;
      touched.set(rows.indexOf(holder), { ...from, credit: (from.credit ?? 0) - take });
      const target = touched.get(rows.indexOf(bill)) ?? bill;
      touched.set(rows.indexOf(bill), { ...target, paid: target.paid + take });
      amount -= take;
    }
  }
  for (const [i, row] of touched) rows[i] = row;
}

/** Creates the bill if none is open for this murid+type, then applies the payment to it. */
export async function recordPayment(input: {
  student: Student;
  type: PaymentType;
  amount: number;
  /** Spend the murid's whole deposit on their open bills. */
  useDeposit?: boolean;
}) {
  const payments = await read<Payment>(PAYMENTS_KEY);
  const { student, type, amount, useDeposit } = input;
  const now = new Date().toISOString();
  const open = payments
    .filter((p) => p.studentId === student.id && p.typeId === type.id && p.price > p.paid)
    .sort((a, b) => (b.when ?? "").localeCompare(a.when ?? ""))[0];
  const bill = open ?? { id: newId(), typeId: type.id, price: type.price, paid: 0 };
  const total = bill.paid + amount;
  // Surplus is returned as deposit rather than paid past the bill.
  const next = { ...bill, paid: Math.min(total, bill.price), studentId: student.id, student: student.name, cls: student.cls, when: now };
  if (total > bill.price) next.credit = (next.credit ?? 0) + total - bill.price;
  const all = open ? payments.map((p) => (p.id === open.id ? next : p)) : [...payments, next];
  if (useDeposit) spendDeposit(all, student.id);
  await AsyncStorage.setItem(PAYMENTS_KEY, JSON.stringify(all));
  notify({ types: await read<PaymentType>(TYPES_KEY), payments: all, students: await read<Student>(STUDENTS_KEY) });
  return { ...next, rest: Math.max(next.price - next.paid, 0), deposit: depositOf(student.id, all) };
}

export async function saveStudents(students: Student[]) {
  await AsyncStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  notify({ types: await read<PaymentType>(TYPES_KEY), payments: await read<Payment>(PAYMENTS_KEY), students });
}

/** Types, payments and murid, all persisted in AsyncStorage. */
export function usePaymentStore() {
  const [state, setState] = useState<State>({ types: [], payments: [], students: [] });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void AsyncStorage.multiRemove(LEGACY_KEYS);
    listeners.add(setState);
    void Promise.all([read<PaymentType>(TYPES_KEY), read<Payment>(PAYMENTS_KEY), read<Student>(STUDENTS_KEY)]).then(
      ([types, payments, students]) => {
        setState({ types, payments, students });
        setLoaded(true);
      },
    );
    return () => {
      listeners.delete(setState);
    };
  }, []);

  const update = async (types: PaymentType[]) => {
    setState((prev) => ({ ...prev, types }));
    await saveTypes(types);
  };
  const updateStudents = async (students: Student[]) => {
    setState((prev) => ({ ...prev, students }));
    await saveStudents(students);
  };
  return { ...state, loaded, update, updateStudents };
}

export function studentTotals(student: Student, payments: Payment[]) {
  const own = payments.filter((p) => p.studentId === student.id);
  const paid = own.reduce((sum, p) => sum + p.paid, 0);
  const due = own.reduce((sum, p) => sum + Math.max(p.price - p.paid, 0), 0);
  // A murid whose bills are all settled shows their deposit as the "paid" remaining.
  return { n: own.length, paid: due ? paid : paid + depositOf(student.id, payments), due };
}

export function typeStats(type: PaymentType, payments: Payment[]): TypeStat {
  const used = payments.filter((p) => p.typeId === type.id);
  return {
    n: used.length,
    got: used.reduce((sum, p) => sum + p.paid, 0),
    due: used.reduce((sum, p) => sum + Math.max(p.price - p.paid, 0), 0),
  };
}

// ponytail: id uniqueness only. Use expo-crypto randomUUID when ids cross devices.
export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
