import Dropdown from "@/components/global/Dropdown";
import FloatingAddButton from "@/components/home/FloatingAddButton";
import WelcomeHeader from "@/components/home/WelcomeHeader";
import TicketDetailsModal from "@/components/tickets/TicketDetailsModal";
import TicketFilters from "@/components/tickets/TicketFilters";
import TicketGrid from "@/components/tickets/TicketGrid";
import { useAuthContext } from "@/contexts/AuthContext";
import { useFilteredTickets } from "@/hooks/useFilteredTickets";
import { useTickets } from "@/hooks/useTickets";
import {
  FILTER_OPTIONS,
  FilterOption,
  SORT_OPTIONS,
  SortOption,
} from "@/lib/constants/tickets";
import { Ticket } from "@/types/ticket";
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
  const { tickets, groups, refetch, ticketIdMap } = useTickets();
  const { currentUser, loading, refreshProfile } = useAuthContext();

  // סינון ומיון על קבוצות (ולא על tickets בודדים)
  const filteredGroups = useFilteredTickets({
    tickets: groups,
    searchTerm,
    filterOption,
    sortOption,
  });

  const pathname = usePathname();
  const params = useLocalSearchParams<{
    open?: string | string[];
    ticketId?: string | string[];
  }>();
  const [pendingTicketId, setPendingTicketId] = useState<string | null>(null);

  useEffect(() => {
    const open = Array.isArray(params.open) ? params.open[0] : params.open;
    const ticketId = Array.isArray(params.ticketId)
      ? params.ticketId[0]
      : params.ticketId;
    if (open === "ticket" && ticketId) setPendingTicketId(String(ticketId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.open, params.ticketId]);

  useEffect(() => {
    return () => setPendingTicketId(null);
  }, []);

  useEffect(() => {
    if (!pendingTicketId) return;
    if (loading) return;
    if (!groups?.length) return;

    const t = groups.find((x) => String(x.id) === pendingTicketId);
    if (!t) return;

    setSelectedTicket(t);

    router.replace({ pathname, params: {} } as never);
    setPendingTicketId(null);
  }, [pendingTicketId, groups, loading, pathname, router]);

  // שליפת מערך ה-ids של הקבוצה שנבחרה
  const selectedTicketIds =
    selectedTicket &&
    ticketIdMap instanceof Map &&
    typeof selectedTicket.id === "string"
      ? ticketIdMap.get(selectedTicket.id) ?? []
      : [];

  // בדיקת לוג
  console.log("selectedTicketIds:", selectedTicketIds);
  console.log("selectedTicket:", selectedTicket);

  return (
    <View style={{ flex: 1, position: "relative", zIndex: 1 }}>
      <ScrollView
        style={{ padding: 16 }}
        contentContainerStyle={{
          zIndex: 0,
          position: "relative",
          paddingBottom: 100,
        }}
        onScrollBeginDrag={() => {
          setSortOpen(false);
          setFilterOpen(false);
        }}
      >
        <WelcomeHeader
          userName={
            loading
              ? "Guest"
              : currentUser.isLoggedIn
              ? currentUser.fullName || "User"
              : "Guest"
          }
        />

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

        {/* הצגת קבוצות ולא כרטיסים בודדים */}
        <TicketGrid tickets={filteredGroups} onSelect={setSelectedTicket} />
      </ScrollView>

      <FloatingAddButton onPress={() => router.push("/(tickets)/add-ticket")} />

      <TicketDetailsModal
        visible={!!selectedTicket}
        ticket={selectedTicket}
        ticketIds={selectedTicketIds}
        tickets={tickets}
        onClose={() => setSelectedTicket(null)}
        onPurchased={() => {
          refetch?.();
          refreshProfile();
          setSelectedTicket(null);
        }}
      />

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
