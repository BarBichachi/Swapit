import Input from "@/components/global/Input";
import { PriceRange } from "@/hooks/useFilteredTickets";
import { SORT_OPTIONS, SortOption } from "@/lib/constants/tickets";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Text, useWindowDimensions } from "react-native";
import "../../app/styles.css";

type AnchorRef = React.RefObject<any>;

interface TicketFiltersProps {
  // Search
  searchTerm: string;
  setSearchTerm: (term: string) => void;

  // Sort
  sortOption: SortOption;
  setSortOption: React.Dispatch<React.SetStateAction<SortOption>>;
  sortOpen: boolean;
  setSortOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // Filter state
  filterOpen: boolean;
  setFilterOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedPriceRanges: PriceRange[];
  setSelectedPriceRanges: (ranges: PriceRange[]) => void;

  // Date range
  dateRange: { from: string | null; to: string | null };
  setDateRange: (r: { from: string | null; to: string | null }) => void;

  // Anchor refs
  sortAnchorRef: AnchorRef;
  filterAnchorRef: AnchorRef;

  // Optional sort options
  sortOptions?: { value: SortOption; label: string }[];
}

const ALL_PRICE_RANGES: { value: PriceRange; label: string }[] = [
  { value: "1-100", label: "1–100₪" },
  { value: "101-200", label: "101–200₪" },
  { value: "201-300", label: "201–300₪" },
  { value: "301-400", label: "301–400₪" },
  { value: "401-500", label: "401–500₪" },
  { value: "500+", label: "500₪+" },
];

export default function TicketFilters({
  searchTerm,
  setSearchTerm,
  sortOption,
  sortOpen,
  setSortOpen,
  filterOpen,
  setFilterOpen,
  selectedPriceRanges,
  setSelectedPriceRanges,
  dateRange,
  setDateRange,
  sortAnchorRef,
  filterAnchorRef,
  sortOptions = SORT_OPTIONS,
}: TicketFiltersProps) {
  const sortLabel = useMemo(
    () => sortOptions.find((opt) => opt.value === sortOption)?.label ?? "Default",
    [sortOptions, sortOption]
  );

  const humanDate = (d?: string | null) => {
    if (!d) return "";
    const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return d;
    return `${m[3]}/${m[2]}/${m[1]}`;
  };

  const filterSummary = useMemo(() => {
    const parts: string[] = [];
    if (selectedPriceRanges.length) parts.push(`${selectedPriceRanges.length} ranges`);
    if (dateRange?.from || dateRange?.to) {
      parts.push(`${humanDate(dateRange.from)} – ${humanDate(dateRange.to)}`.trim());
    }
    return parts.length ? parts.join(", ") : "All Tickets";
  }, [selectedPriceRanges, dateRange]);

  const { width } = useWindowDimensions();
  const isCompact = width < 768;

  const icon = isCompact ? 12 : 14;
  const chevron = isCompact ? 11 : 12;
  const labelFont = isCompact ? 12 : 13;
  const valueFont = isCompact ? 11 : 12;

  const toggleRange = (r: PriceRange) => {
    const set = new Set(selectedPriceRanges);
    set.has(r) ? set.delete(r) : set.add(r);
    setSelectedPriceRanges(Array.from(set));
  };

  const resetFilters = () => {
    setSelectedPriceRanges([]);
    setDateRange({ from: null, to: null });
  };

  const setFrom = (v: string | null) => {
    const from = v;
    const to = dateRange.to;
    if (from && to && from > to) setDateRange({ from, to: from });
    else setDateRange({ from, to });
  };

  const setTo = (v: string | null) => {
    const from = dateRange.from;
    const to = v;
    if (from && to && to < from) setDateRange({ from: to, to });
    else setDateRange({ from, to });
  };

  // עיגון לחלון הפילטר אל הכפתור (כמו ב-sort)
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 360,
  });

  useEffect(() => {
    if (!filterOpen) return;

    const calc = () => {
      const anchor = filterAnchorRef?.current as HTMLElement | null;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const margin = 6;
      const desired = Math.min(440, Math.max(320, rect.width)); // רוחב נוח
      const vw = window.innerWidth || document.documentElement.clientWidth;

      // השארת שוליים 8px מהמסך
      const maxLeft = vw - desired - 8;
      const left = Math.min(Math.max(8, rect.left), Math.max(8, maxLeft));
      const top = rect.bottom + margin;

      setPanelPos({ top, left, width: desired });
    };

    const onDocClick = (e: MouseEvent) => {
      const anchor = filterAnchorRef?.current as HTMLElement | null;
      const panel = document.getElementById("filter-dropdown-panel");
      if (!anchor || !panel) return;
      if (anchor.contains(e.target as Node) || panel.contains(e.target as Node)) return;
      setFilterOpen(false);
    };

    calc();
    window.addEventListener("resize", calc);
    window.addEventListener("scroll", calc, true);
    document.addEventListener("mousedown", onDocClick);

    return () => {
      window.removeEventListener("resize", calc);
      window.removeEventListener("scroll", calc, true);
      document.removeEventListener("mousedown", onDocClick);
    };
  }, [filterOpen, filterAnchorRef, setFilterOpen]);

  return (
    <div className="toolbar">
      <style>
        {`
          /* מגדיל פונט בלי להגדיל קומפוננטה */
          .tf-date {
            height: 30px;
            padding: 2px 8px;
            font-size: 15px;
            line-height: 26px;
            border-radius: 8px;
            border: 1px solid #ddd;
            width: 100%;
            min-width: 0;
            box-sizing: border-box;
          }
          .toolbar__dropdown input[type="date"]::-webkit-calendar-picker-indicator {
            width: 14px; height: 14px; transform: scale(0.9);
          }
          .toolbar__dropdown input[type="date"]::-webkit-datetime-edit,
          .toolbar__dropdown input[type="date"]::-webkit-datetime-edit-fields-wrapper,
          .toolbar__dropdown input[type="date"]::-webkit-datetime-edit-text,
          .toolbar__dropdown input[type="date"]::-webkit-datetime-edit-year-field,
          .toolbar__dropdown input[type="date"]::-webkit-datetime-edit-month-field,
          .toolbar__dropdown input[type="date"]::-webkit-datetime-edit-day-field {
            font-size: 15px;
            line-height: 26px;
          }
          .tf-btn-sm {
            height: 30px;
            padding: 0 10px;
            font-size: 14px;
            line-height: 30px;
            border-radius: 8px;
            font-weight: 700;
          }
        `}
      </style>

      {/* Search */}
      <div className="toolbar__search" style={{ width: "100%" } as any}>
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e: any) => setSearchTerm(e.target?.value ?? "")}
        />
      </div>

      {/* Controls row */}
      <div className="toolbar__controls">
        {/* Sort trigger */}
        <div ref={sortAnchorRef} className="toolbar__control">
          <Pressable
            onPress={() => setSortOpen((prev) => !prev)}
            className="toolbar__button"
            style={{
              flexDirection: "row",
              alignItems: "center",
              height: "100%",
              paddingHorizontal: 8,
            }}
            accessibilityRole="button"
            accessibilityLabel="Sort tickets"
            aria-expanded={sortOpen}
            aria-controls="sort-menu"
          >
            <Ionicons name="funnel-outline" size={icon} style={{ marginRight: 4 }} />
            <Text style={{ fontWeight: "600", marginRight: 4, fontSize: labelFont }}>
              Sort by:
            </Text>
            <Text style={{ opacity: 0.85, fontSize: valueFont }}>
              {sortOptions.find((o) => o.value === sortOption)?.label ?? "Default"}
            </Text>
            <Ionicons
              name={sortOpen ? "chevron-up" : "chevron-down"}
              size={chevron}
              style={{ marginLeft: 4, opacity: 0.7 }}
            />
          </Pressable>
        </div>

        {/* Filter trigger */}
        <div className="toolbar__control">
          <div
            ref={filterAnchorRef}
            style={{ position: "relative", display: "inline-flex", alignItems: "stretch" }}
          >
            <Pressable
              onPress={() => setFilterOpen((prev) => !prev)}
              className="toolbar__button"
              style={{
                flexDirection: "row",
                alignItems: "center",
                height: "100%",
                paddingHorizontal: 8,
              }}
              accessibilityRole="button"
              accessibilityLabel="Filter tickets"
              aria-expanded={filterOpen}
              aria-controls="filter-menu"
            >
              <Ionicons name="options-outline" size={icon} style={{ marginRight: 4 }} />
              <Text style={{ fontWeight: "600", marginRight: 4, fontSize: labelFont }}>
                Filter:
              </Text>
              <Text style={{ opacity: 0.85, fontSize: valueFont }}>{filterSummary}</Text>
              <Ionicons
                name={filterOpen ? "chevron-up" : "chevron-down"}
                size={chevron}
                style={{ marginLeft: 4, opacity: 0.7 }}
              />
            </Pressable>
          </div>
        </div>
      </div>

      {/* Filter dropdown – ממוקם יחסית לכפתור (עיגון) */}
      {filterOpen && (
        <div
          id="filter-dropdown-panel"
          role="dialog"
          aria-label="Filter tickets"
          className="toolbar__dropdown"
          style={{
            position: "fixed",
            top: panelPos.top,
            left: panelPos.left,
            width: panelPos.width,
            background: "#fff",
            borderRadius: 10,
            boxShadow: "0 6px 20px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)",
            padding: 10,
            zIndex: 2000,
            maxHeight: "70vh",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {/* Price ranges */}
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Price ranges</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 6,
              marginBottom: 8,
            }}
          >
            {ALL_PRICE_RANGES.map((opt) => (
              <label
                key={opt.value}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  minHeight: 24,
                  lineHeight: "18px",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedPriceRanges.includes(opt.value)}
                  onChange={() => toggleRange(opt.value)}
                  style={{ width: 14, height: 14, margin: 0, cursor: "pointer" }}
                />
                <span style={{ userSelect: "none" }}>{opt.label}</span>
              </label>
            ))}
          </div>

          {/* Date range */}
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Date range</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(120px,1fr) minmax(120px,1fr) auto",
              gap: 6,
              alignItems: "center",
            }}
          >
            <input
              type="date"
              className="tf-date"
              value={dateRange.from ?? ""}
              onChange={(e) => setFrom(e.target.value || null)}
              aria-label="From date"
            />
            <input
              type="date"
              className="tf-date"
              value={dateRange.to ?? ""}
              onChange={(e) => setTo(e.target.value || null)}
              aria-label="To date"
            />
            <button
              type="button"
              onClick={() => setDateRange({ from: null, to: null })}
              className="tf-btn-sm"
              style={{
                border: "1px solid #ddd",
                background: "#fff",
                color: "#333",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              clear
            </button>
          </div>

          {/* Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 10,
              gap: 6,
            }}
          >
            <button
              type="button"
              onClick={resetFilters}
              className="tf-btn-sm"
              style={{
                border: "1px solid #ddd",
                background: "#fff",
                color: "#333",
                cursor: "pointer",
                minWidth: 78,
              }}
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setFilterOpen(false)}
              className="tf-btn-sm"
              style={{
                border: "none",
                background: "#4FC3F7",
                color: "#fff",
                cursor: "pointer",
                minWidth: 78,
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}