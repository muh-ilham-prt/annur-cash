import type { IconName } from "../components/Icon";

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
  billPaid?: number;
  studentId?: string;
  student?: string;
  cls?: string;
  when?: string;
  credit?: number;
  evidence?: string;
}

export interface Student {
  id: string;
  name: string;
  cls: string;
  nis: string;
  status?: "active" | "candidate";
  ppdbId?: string;
}

export interface TypeStat {
  n: number;
  got: number;
  due: number;
}

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
export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
export const depositOf = (studentId: string, payments: Payment[]) => payments.filter((p) => p.studentId === studentId).reduce((sum, p) => sum + (p.credit ?? 0), 0);
export const studentTotals = (student: Student, payments: Payment[]) => {
  const own = payments.filter((p) => p.studentId === student.id);
  const due = own.reduce((sum, p) => sum + Math.max(p.price - (p.billPaid ?? p.paid), 0), 0);
  return { n: own.length, paid: own.reduce((sum, p) => sum + p.paid, 0), due };
};
export const typeStats = (type: PaymentType, payments: Payment[]): TypeStat => {
  const used = payments.filter((p) => p.typeId === type.id);
  return { n: used.length, got: used.reduce((sum, p) => sum + p.paid, 0), due: used.reduce((sum, p) => sum + Math.max(p.price - (p.billPaid ?? p.paid), 0), 0) };
};
