import Dropdown from "@/components/Dropdown";
import Input from "@/components/Input";
import { useTickets } from "@/hooks/useTickets";

import TicketCard from "@/components/TicketCard";
import TicketDetailsModal from "@/components/TicketDetailsModal";
import { Ticket } from "@/types/ticket";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import "./styles.css";

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "#eee",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
    borderWidth: 0.5,
  },
});

export default function HomePage() {
  const router = useRouter();

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<
    "price_asc" | "price_desc" | "date_asc" | "date_desc" | "none"
  >("none");
  const [filterOption, setFilterOption] = useState<"all" | "available_only">(
    "all"
  );
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [sortOpen, setSortOpen] = useState(false);

  const sortOptions = [
    { value: "none", label: "Default" },
    { value: "price_asc", label: "Price (lowest)" },
    { value: "price_desc", label: "Price (highest)" },
    { value: "date_asc", label: "Date (earliest)" },
    { value: "date_desc", label: "Date (latest)" },
  ];

  const { tickets, userName } = useTickets();

  useEffect(() => {
    // Filter and sort tickets based on search, sort, and filter options
    let updated = [...tickets];

    // 🔍 Search by event title
    if (searchTerm.trim()) {
      updated = updated.filter((t) =>
        t.eventTitle.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // ⚙️ Filter
    if (filterOption === "available_only") {
      updated = updated.filter((t) => t.quantity > 0);
    }

    // 🔃 Sort
    switch (sortOption) {
      case "price_asc":
        updated.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        updated.sort((a, b) => b.price - a.price);
        break;
      case "date_asc":
        updated.sort((a, b) => (a.date < b.date ? -1 : 1));
        break;
      case "date_desc":
        updated.sort((a, b) => (a.date > b.date ? -1 : 1));
        break;
    }

    setFilteredTickets(updated);
  }, [tickets, searchTerm, filterOption, sortOption]);

  return (
    <View style={{ flex: 1, position: "relative", zIndex: 1 }}>
      <ScrollView
        style={{ padding: 16 }}
        contentContainerStyle={{ zIndex: 0, position: "relative" }}
        onScrollBeginDrag={() => setSortOpen(false)}
      >
        {/* Welcome Section */}
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <Text style={{ fontSize: 22, fontWeight: "600" }}>
            Hi {userName} 👋
          </Text>
          <Text style={{ fontSize: 16, marginBottom: 12 }}>
            Ready to sell or buy a ticket?
          </Text>

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
                  ...styles.button,
                  flexDirection: "row",
                  gap: 4,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text>
                  Sort by:{" "}
                  {sortOptions.find((opt) => opt.value === sortOption)?.label ??
                    "Default"}
                </Text>
                <Ionicons
                  name={sortOpen ? "chevron-up" : "chevron-down"}
                  size={16}
                />
              </Pressable>
            </View>

            {/* Filter Dropdown */}
            <select
              value={filterOption}
              onChange={(e) =>
                setFilterOption(e.target.value as typeof filterOption)
              }
              className="form-input"
              style={{ minWidth: 140 }}
            >
              <option value="all">All Tickets</option>
              <option value="available_only">Only Available</option>
            </select>
          </View>
        </View>

        {/* Ticket Grid */}

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            columnGap: 12,
          }}
        >
          {filteredTickets.map((ticket, index) => (
            <TicketCard
              key={ticket.id ?? index}
              {...ticket}
              onPress={() => setSelectedTicket(ticket)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Floating Add Button */}
      <View
        style={{
          position: "absolute",
          bottom: 40,
          left: "50%",
          transform: [{ translateX: -30 }],
          zIndex: 100,
        }}
      >
        <Pressable
          onPress={() => alert("Add Ticket")}
          onHoverIn={() => setIsHovered(true)}
          onHoverOut={() => setIsHovered(false)}
          style={{
            backgroundColor: isHovered ? "#0277BD" : "#0288D1",
            width: 60,
            height: 60,
            borderRadius: 30,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#0288D1",
            shadowOpacity: 0.5,
            shadowRadius: 50,
            shadowOffset: { width: 0, height: 0 },
            elevation: 8,
            transform: [{ scale: isHovered ? 1.12 : 1 }],
            cursor: "pointer",
          }}
        >
          <Ionicons name="add" size={36} color="white" />
        </Pressable>
      </View>

      {/* Ticket Details Modal */}
      <TicketDetailsModal
        visible={!!selectedTicket}
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />

      {/* Sort Dropdown Floated */}
      <Dropdown
        visible={sortOpen}
        options={sortOptions}
        selected={sortOption}
        onSelect={(value) => {
          setSortOption(value as typeof sortOption);
          setSortOpen(false);
        }}
        onClose={() => setSortOpen(false)}
        anchor={{ top: 130, left: "50%" }}
      />
    </View>
  );
}
