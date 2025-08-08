import Input from "@/components/global/Input";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

interface TicketFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortOption: string;
  setSortOption: React.Dispatch<
    React.SetStateAction<
      "none" | "price_asc" | "price_desc" | "date_asc" | "date_desc"
    >
  >;
  sortOpen: boolean;
  setSortOpen: React.Dispatch<React.SetStateAction<boolean>>;
  filterOption: "all" | "available_only";
  setFilterOption: (value: "all" | "available_only") => void;
  sortOptions: { value: string; label: string }[];
}

export default function TicketFilters({
  searchTerm,
  setSearchTerm,
  sortOption,
  setSortOption,
  sortOpen,
  setSortOpen,
  filterOption,
  setFilterOption,
  sortOptions,
}: TicketFiltersProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 16,
        justifyContent: "center",
      }}
    >
      <Input
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="form-input"
      />

      {/* Sort Dropdown */}
      <View style={{ position: "relative", zIndex: 999 }}>
        <Pressable
          onPress={() => setSortOpen((prev) => !prev)}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 6,
            backgroundColor: "#eee",
            borderRadius: 8,
            minWidth: 80,
            flexDirection: "row",
            gap: 4,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 0.5,
          }}
        >
          <Text>
            Sort by:{" "}
            {sortOptions.find((opt) => opt.value === sortOption)?.label ??
              "Default"}
          </Text>
          <Ionicons name={sortOpen ? "chevron-up" : "chevron-down"} size={16} />
        </Pressable>
      </View>

      {/* Filter Dropdown */}
      <select
        value={filterOption}
        onChange={(e) => setFilterOption(e.target.value as typeof filterOption)}
        className="form-input"
        style={{ minWidth: 140 }}
      >
        <option value="all">All Tickets</option>
        <option value="available_only">Only Available</option>
      </select>
    </View>
  );
}
