import Dropdown from "@/components/global/Dropdown";
import FloatingAddButton from "@/components/home/FloatingAddButton";
import WelcomeHeader from "@/components/home/WelcomeHeader";
import TicketDetailsModal from "@/components/tickets/TicketDetailsModal";
import TicketFilters from "@/components/tickets/TicketFilters";
import TicketGrid from "@/components/tickets/TicketGrid";
import { useAuthContext } from "@/contexts/AuthContext";
import { PriceRange, useFilteredTickets } from "@/hooks/useFilteredTickets";
import { useTickets } from "@/hooks/useTickets";
import { SORT_OPTIONS, SortOption } from "@/lib/constants/tickets";
import { Ticket } from "@/types/ticket";
import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import "./styles.css";

export default function HomePage() {
  const router = useRouter();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Search/sort/filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("none");
  const [sortOpen, setSortOpen] = useState(false);

  // Filter UI (price ranges + date range)
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<PriceRange[]>(
    []
  );
  const [dateRange, setDateRange] = useState<{
    from: string | null;
    to: string | null;
  }>({
    from: null,
    to: null,
  });

  // Anchors for popovers
  const sortAnchorRef = useRef<any>(null);
  const filterAnchorRef = useRef<any>(null);

  const { tickets, groups, refetch, ticketIdMap } = useTickets();
  const { currentUser, loading, refreshProfile } = useAuthContext();

  // Apply filters & sort on groups (not individual ticket units)
  const filteredGroups = useFilteredTickets({
    tickets: groups,
    searchTerm,
    sortOption,
    selectedPriceRanges,
    dateRange,
  });

  // Support opening a ticket via query string (?open=ticket&ticketId=...)
  const pathname = usePathname();
  const params = useLocalSearchParams<{
    open?: string | string[];
    ticketId?: string | string[];
    refresh?: string | string[];
  }>();
  const [pendingTicketId, setPendingTicketId] = useState<string | null>(null);
  useEffect(() => {
    const open = Array.isArray(params.open) ? params.open[0] : params.open;
    const ticketId = Array.isArray(params.ticketId)
      ? params.ticketId[0]
      : params.ticketId;
    if (open === "ticket" && ticketId) setPendingTicketId(String(ticketId));
  }, [params.open, params.ticketId]);

  const isFocused = useIsFocused();

  useEffect(() => {
    const open = Array.isArray(params.open) ? params.open[0] : params.open;
    const ticketId = Array.isArray(params.ticketId)
      ? params.ticketId[0]
      : params.ticketId;
    if (open === "ticket" && ticketId) setPendingTicketId(String(ticketId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.open, params.ticketId]);

  // Try once more if not found the first time
  const triedRefetchRef = useRef(false);

  useEffect(() => {
    if (!isFocused) return; // + wait until Home is focused (after returning from login)
    if (!pendingTicketId || loading) return;
    if (!groups?.length) return;

    // 1) If the param is a GROUP id, open directly
    let group = groups.find((g) => String(g.id) === String(pendingTicketId));

    // 2) If it’s a UNIT id, map it -> group via ticketIdMap
    if (!group && ticketIdMap instanceof Map) {
      for (const [groupId, unitIds] of ticketIdMap.entries()) {
        if (unitIds.some((u) => String(u) === String(pendingTicketId))) {
          group = groups.find((g) => String(g.id) === String(groupId));
          if (group) break;
        }
      }
    }

    if (group) {
      setSelectedTicket(group);
      router.replace("/"); // clear ?open=...&ticketId=...
      setPendingTicketId(null);
    } else {
      // not found yet — try one refetch then clear
      refetch()
        .catch(() => {})
        .finally(() => {
          router.replace("/");
          setPendingTicketId(null);
        });
    }
  }, [pendingTicketId, loading, groups, ticketIdMap, refetch, router]);

  // IDs of selected group's ticket units
  const selectedTicketIds =
    selectedTicket &&
    ticketIdMap instanceof Map &&
    typeof selectedTicket.id === "string"
      ? ticketIdMap.get(selectedTicket.id) ?? []
      : [];

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
          filterOpen={filterOpen}
          setFilterOpen={setFilterOpen}
          selectedPriceRanges={selectedPriceRanges}
          setSelectedPriceRanges={setSelectedPriceRanges}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />

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
    </View>
  );
}
