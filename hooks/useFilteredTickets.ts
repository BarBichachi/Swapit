import { SortOption } from "@/lib/constants/tickets";
import { Ticket } from "@/types/ticket";
import { useMemo } from "react";

export type PriceRange =
  | "1-100"
  | "101-200"
  | "201-300"
  | "301-400"
  | "401-500"
  | "500+";

export type DateRange = {
  from?: string | Date | null;
  to?: string | Date | null;
};

// ממיר תאריך למספר מ״ש, תומך ב-ISO וב-DD/MM/YYYY[, HH:MM]
const toTs = (d: any): number => {
  if (!d && d !== 0) return 0;
  if (d instanceof Date) return d.getTime() || 0;
  if (typeof d === "number") return isFinite(d) ? d : 0;
  if (typeof d === "string") {
    const s = d.trim();
    if (!s) return 0;

    // ISO
    if (/\d{4}-\d{2}-\d{2}/.test(s) || s.includes("T") || s.includes("Z")) {
      const t = Date.parse(s);
      return isNaN(t) ? 0 : t;
    }

    // DD/MM/YYYY[, HH:MM] או DD.MM.YYYY
    const m = s.match(
      /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})(?:[,\s]+(\d{1,2}):(\d{2}))?$/
    );
    if (m) {
      const [, dd, mm, yyyy, hh, min] = m;
      const dt = new Date(
        Number(yyyy),
        Number(mm) - 1,
        Number(dd),
        hh ? Number(hh) : 0,
        min ? Number(min) : 0
      ).getTime();
      return isNaN(dt) ? 0 : dt;
    }

    const t = Date.parse(s);
    return isNaN(t) ? 0 : t;
  }

  if (typeof d === "object") {
    return toTs(d.datetime ?? d.date ?? d.eventDate);
  }
  return 0;
};

const toEndOfDayTs = (d: any): number => {
  const s = typeof d === "string" ? d.trim() : null;
  const base = toTs(d);
  if (!base) return 0;
  // אם זו מחרוזת תאריך בלי שעה – החשב עד סוף היום
  if (typeof d === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(s || "")) return base + 86399999;
    if (/^\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{4}$/.test(s || "")) return base + 86399999;
  }
  if (d instanceof Date) {
    if (
      d.getHours() === 0 &&
      d.getMinutes() === 0 &&
      d.getSeconds() === 0 &&
      d.getMilliseconds() === 0
    ) {
      return base + 86399999;
    }
  }
  return base;
};

// מוצא את התאריך הרלוונטי בכל אובייקט כרטיס/קבוצה
const getTicketTs = (t: any): number => {
  const candidates = [
    t?.datetime,
    t?.eventDate,
    t?.date,
    t?.event?.datetime,
    (t as any)?.events?.[0]?.datetime,
  ];
  for (const c of candidates) {
    const ts = toTs(c);
    if (ts) return ts;
  }
  return 0;
};

const inSelectedPriceRanges = (price: number, ranges: PriceRange[]): boolean => {
  if (!ranges?.length) return true;
  if (price == null || isNaN(price)) return false;

  for (const r of ranges) {
    switch (r) {
      case "1-100":
        if (price >= 1 && price <= 100) return true;
        break;
      case "101-200":
        if (price >= 101 && price <= 200) return true;
        break;
      case "201-300":
        if (price >= 201 && price <= 300) return true;
        break;
      case "301-400":
        if (price >= 301 && price <= 400) return true;
        break;
      case "401-500":
        if (price >= 401 && price <= 500) return true;
        break;
      case "500+":
        if (price >= 500) return true;
        break;
    }
  }
  return false;
};

export function useFilteredTickets({
  tickets,
  searchTerm,
  sortOption,
  selectedPriceRanges,
  dateRange,
}: {
  tickets: Ticket[];
  searchTerm: string;
  sortOption: SortOption;
  selectedPriceRanges: PriceRange[];
  dateRange?: DateRange | null;
}) {
  return useMemo(() => {
    const list0: any[] = tickets ?? [];
    const term = (searchTerm || "").trim().toLowerCase();

    // חיפוש לפי כותרת
    let list = term
      ? list0.filter((t: any) =>
          String(t.eventTitle ?? "").toLowerCase().includes(term)
        )
      : list0;

    // טווחי מחיר
    if (selectedPriceRanges?.length) {
      list = list.filter((t: any) =>
        inSelectedPriceRanges(Number(t.price ?? 0), selectedPriceRanges)
      );
    }

    // טווח תאריכים
    const fromTs = dateRange?.from ? toTs(dateRange.from) : 0;
    const toTsVal = dateRange?.to ? toEndOfDayTs(dateRange.to) : Number.POSITIVE_INFINITY;
    if (fromTs || isFinite(toTsVal)) {
      list = list.filter((t: any) => {
        const ts = getTicketTs(t);
        if (!ts) return false;
        if (fromTs && ts < fromTs) return false;
        if (isFinite(toTsVal) && ts > toTsVal) return false;
        return true;
      });
    }

    const arr = [...list];

    switch (sortOption) {
      case "price_asc":
        arr.sort((a: any, b: any) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case "price_desc":
        arr.sort((a: any, b: any) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case "date_asc":
        arr.sort((a: any, b: any) => getTicketTs(a) - getTicketTs(b));
        break;
      case "date_desc":
        arr.sort((a: any, b: any) => getTicketTs(b) - getTicketTs(a));
        break;
      case "none":
      default:
        break;
    }
    return arr;
  }, [tickets, searchTerm, sortOption, selectedPriceRanges, dateRange?.from, dateRange?.to]);
}