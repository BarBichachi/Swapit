export type SortOption =
  | "price_asc"
  | "price_desc"
  | "date_asc"
  | "date_desc"
  | "none";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "none", label: "Default" },
  { value: "price_asc", label: "Price (lowest)" },
  { value: "price_desc", label: "Price (highest)" },
  { value: "date_asc", label: "Date (earliest)" },
  { value: "date_desc", label: "Date (latest)" },
];

export type FilterOption = "all" | "available_only";
export const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: "all", label: "All Tickets" },
  { value: "available_only", label: "Only Available" },
];
