import Dropdown from "@/components/global/Dropdown";
import FloatingAddButton from "@/components/home/FloatingAddButton";
import WelcomeHeader from "@/components/home/WelcomeHeader";
import TicketDetailsModal from "@/components/tickets/TicketDetailsModal";
import TicketFilters from "@/components/tickets/TicketFilters";
import TicketGrid from "@/components/tickets/TicketGrid";
import { useFilteredTickets } from "@/hooks/useFilteredTickets";
import { useTickets } from "@/hooks/useTickets";
import {
  FILTER_OPTIONS,
  FilterOption,
  SORT_OPTIONS,
  SortOption,
} from "@/lib/constants/tickets";
import { Ticket } from "@/types/ticket";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import "./styles.css";

export default function HomePage() {
  const router = useRouter();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("none");
  const [filterOption, setFilterOption] = useState<FilterOption>("all");
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const sortAnchorRef = useRef<any>(null);
  const filterAnchorRef = useRef<any>(null);
  const { tickets, userName } = useTickets();

  const filteredTickets = useFilteredTickets({
    tickets,
    searchTerm,
    filterOption,
    sortOption,
  });

  return (
    <View style={{ flex: 1, position: "relative", zIndex: 1 }}>
      <ScrollView
        style={{ padding: 16 }}
        contentContainerStyle={{ zIndex: 0, position: "relative" }}
        onScrollBeginDrag={() => {
          setSortOpen(false);
          setFilterOpen(false);
        }}
      >
        {/* Welcome Section */}
        <WelcomeHeader userName={userName} />

        {/* Ticket Filters */}
        <TicketFilters
          sortAnchorRef={sortAnchorRef}
          filterAnchorRef={filterAnchorRef}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortOption={sortOption}
          setSortOption={setSortOption}
          sortOpen={sortOpen}
          setSortOpen={setSortOpen}
          filterOption={filterOption}
          setFilterOption={setFilterOption}
          filterOpen={filterOpen}
          setFilterOpen={setFilterOpen}
        />

        {/* Ticket Grid */}
        <TicketGrid tickets={filteredTickets} onSelect={setSelectedTicket} />
      </ScrollView>

      {/* Floating Add Button */}
      <FloatingAddButton onPress={() => router.push("/(tickets)/add-ticket")} />

      {/* Ticket Details Modal */}
      <TicketDetailsModal
        visible={!!selectedTicket}
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />

      {/* Sort Dropdown */}
      <Dropdown
        visible={sortOpen}
        options={SORT_OPTIONS}
        selected={sortOption}
        onSelect={(value) => {
          setSortOption(value as typeof sortOption);
          setSortOpen(false);
        }}
        onClose={() => setSortOpen(false)}
        anchorRef={sortAnchorRef}
        offset={6}
        matchTriggerWidth
      />

      {/*Filter Dropdown */}
      <Dropdown
        visible={filterOpen}
        options={FILTER_OPTIONS}
        selected={filterOption}
        onSelect={(value) => {
          setFilterOption(value as typeof filterOption);
          setFilterOpen(false);
        }}
        onClose={() => setFilterOpen(false)}
        anchorRef={filterAnchorRef}
        offset={6}
        matchTriggerWidth
      />
    </View>
  );
}
