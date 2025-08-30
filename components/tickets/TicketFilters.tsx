import Input from "@/components/global/Input";
import {
  FILTER_OPTIONS,
  FilterOption,
  SORT_OPTIONS,
  SortOption,
} from "@/lib/constants/tickets";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
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

  // Filter
  filterOption: FilterOption;
  setFilterOption: (value: FilterOption) => void;
  filterOpen: boolean;
  setFilterOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // Anchor refs
  sortAnchorRef: AnchorRef;
  filterAnchorRef: AnchorRef;

  // Optional sort options
  sortOptions?: { value: SortOption; label: string }[];
}

export default function TicketFilters({
  searchTerm,
  setSearchTerm,
  sortOption,
  sortOpen,
  setSortOpen,
  filterOption,
  setFilterOption,
  filterOpen,
  setFilterOpen,
  sortAnchorRef,
  filterAnchorRef,
  sortOptions = SORT_OPTIONS,
}: TicketFiltersProps) {
  const sortLabel = useMemo(
    () =>
      sortOptions.find((opt) => opt.value === sortOption)?.label ?? "Default",
    [sortOptions, sortOption]
  );

  const filterLabel = useMemo(
    () =>
      FILTER_OPTIONS.find((o) => o.value === filterOption)?.label ??
      "All Tickets",
    [filterOption]
  );

  const { width } = useWindowDimensions();
  const isCompact = width < 480;

  const icon = isCompact ? 16 : 18;
  const chevron = isCompact ? 14 : 16;
  const labelFont = isCompact ? 12 : 16;
  const valueFont = isCompact ? 10 : 15;

  return (
    <div className="toolbar">
      {/* Search */}
      <div
        className="toolbar__search"
        style={
          {
            width: "100%",
          } as any
        }
      >
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
              paddingHorizontal: 10,
            }}
            accessibilityRole="button"
            accessibilityLabel="Sort tickets"
            aria-expanded={sortOpen}
            aria-controls="sort-menu"
          >
            <Ionicons
              name="funnel-outline"
              size={icon}
              style={{ marginRight: 4 }}
            />
            <Text
              style={{ fontWeight: "600", marginRight: 4, fontSize: labelFont }}
            >
              Sort by:
            </Text>
            <Text style={{ opacity: 0.85, fontSize: valueFont }}>
              {sortLabel}
            </Text>
            <Ionicons
              name={sortOpen ? "chevron-up" : "chevron-down"}
              size={chevron}
              style={{ marginLeft: 6, opacity: 0.7 }}
            />
          </Pressable>
        </div>

        {/* Filter trigger */}
        <div ref={filterAnchorRef} className="toolbar__control">
          <Pressable
            onPress={() => setFilterOpen((prev) => !prev)}
            className="toolbar__button"
            style={{
              flexDirection: "row",
              alignItems: "center",
              height: "100%",
              paddingHorizontal: 10,
            }}
            accessibilityRole="button"
            accessibilityLabel="Filter tickets"
            aria-expanded={filterOpen}
            aria-controls="filter-menu"
          >
            <Ionicons
              name="options-outline"
              size={icon}
              style={{ marginRight: 4 }}
            />
            <Text
              style={{ fontWeight: "600", marginRight: 4, fontSize: labelFont }}
            >
              Filter:
            </Text>
            <Text style={{ opacity: 0.85, fontSize: valueFont }}>
              {filterLabel}
            </Text>
            <Ionicons
              name={filterOpen ? "chevron-up" : "chevron-down"}
              size={chevron}
              style={{ marginLeft: 6, opacity: 0.7 }}
            />
          </Pressable>
        </div>
      </div>
    </div>
  );
}
