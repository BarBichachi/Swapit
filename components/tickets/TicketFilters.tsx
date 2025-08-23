import Input from "@/components/global/Input";
import {
  FILTER_OPTIONS,
  FilterOption,
  SORT_OPTIONS,
  SortOption,
} from "@/lib/constants/tickets";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Pressable, Text } from "react-native";
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

  return (
    <div className="toolbar">
      {/* Search */}
      <div
        className="toolbar__search"
        style={
          {
            width: 500,
            maxWidth: "100%",
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
          >
            <Ionicons
              name="funnel-outline"
              size={18}
              style={{ marginRight: 6 }}
            />
            <Text style={{ fontWeight: "600", marginRight: 4 }}>Sort by:</Text>
            <Text style={{ opacity: 0.85 }}>{sortLabel}</Text>
            <Ionicons
              name={sortOpen ? "chevron-up" : "chevron-down"}
              size={16}
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
          >
            <Ionicons
              name="options-outline"
              size={18}
              style={{ marginRight: 6 }}
            />
            <Text style={{ fontWeight: "600", marginRight: 4 }}>Filter:</Text>
            <Text style={{ opacity: 0.85 }}>{filterLabel}</Text>
            <Ionicons
              name={filterOpen ? "chevron-up" : "chevron-down"}
              size={16}
              style={{ marginLeft: 6, opacity: 0.7 }}
            />
          </Pressable>
        </div>
      </div>
    </div>
  );
}
