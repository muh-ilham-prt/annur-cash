const rupiah = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });
export const formatRupiah = (value: number) => `Rp. ${rupiah.format(value)}`;
