import { FilterOption, SortOption } from "@/lib/constants/tickets"; // ← import types here
import { Ticket } from "@/types/ticket";
import { useMemo } from "react";

const toTs = (d: string | number | Date) => new Date(d).getTime() || 0;

export function useFilteredTickets({
  tickets,
  searchTerm,
  filterOption,
  sortOption,
}: {
  tickets: Ticket[];
  searchTerm: string;
  filterOption: FilterOption;
  sortOption: SortOption;
}) {
  return useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    let list = tickets;
    if (term)
      list = list.filter((t) => t.eventTitle.toLowerCase().includes(term));
    if (filterOption === "available_only")
      list = list.filter((t) => (t.quantity ?? 0) > 0);

    const arr = [...list];
    switch (sortOption) {
      case "price_asc":
        arr.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        break;
      case "price_desc":
        arr.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
      case "date_asc":
        arr.sort((a, b) => toTs(a.date) - toTs(b.date));
        break;
      case "date_desc":
        arr.sort((a, b) => toTs(b.date) - toTs(a.date));
        break;
      case "none":
      default:
        break;
    }
    return arr;
  }, [tickets, searchTerm, filterOption, sortOption]);
}
