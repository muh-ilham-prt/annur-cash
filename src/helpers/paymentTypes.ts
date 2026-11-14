import { apiFetch } from "./api";
import type { IconName } from "../components/Icon";
import type { PaymentType } from "./domain";

type Row = { id: number; name: string; price: number; icon: string; archived: boolean };
const toType = (r: Row): PaymentType => ({ id: String(r.id), name: r.name, price: r.price, icon: r.icon as IconName, archived: r.archived });
const body = (t: PaymentType) => JSON.stringify({ name: t.name, price: t.price, icon: t.icon, archived: t.archived });

export const fetchTypes = async () => (await apiFetch<Row[]>("/payment-types")).map(toType);
export const createType = async (t: PaymentType) => toType(await apiFetch<Row>("/payment-types", { method: "POST", body: body(t) }));
export const updateType = async (t: PaymentType) => toType(await apiFetch<Row>(`/payment-types/${t.id}`, { method: "PUT", body: body(t) }));
export const deleteType = (t: PaymentType) => apiFetch(`/payment-types/${t.id}`, { method: "DELETE" });
