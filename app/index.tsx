import TicketCard from "@/components/TicketCard";
import TicketDetailsModal from "@/components/TicketDetailsModal";
import { supabase } from "@/lib/supabase";
import { Ticket } from "@/types/ticket";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
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

  const [userName, setUserName] = useState("Bar");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUserName(user?.user_metadata?.first_name ?? "Bar");

        const { data, error } = await supabase
          .from("tickets")
          .select(
            `
            id,
            current_price,
            quantity_available,
            event_id,
            events:events (
              name,
              datetime,
              image_url
            )
          `
          )
          .eq("status", "active");

        if (error) return;

        const formattedTickets = (data ?? []).map((t) => {
          const event = Array.isArray(t.events) ? t.events[0] : t.events;

          return {
            id: t.id,
            eventTitle: event?.name ?? "Unknown",
            date: event?.datetime
              ? new Date(event.datetime).toLocaleDateString("en-GB")
              : "TBD",
            price: t.current_price,
            quantity: t.quantity_available,
            imageUrl: event?.image_url
              ? supabase.storage
                  .from("event-images")
                  .getPublicUrl(event.image_url).data.publicUrl
              : undefined,
          };
        });

        setTickets(formattedTickets);
      } catch (err) {
        // Optionally log to monitoring service
      }
    };

    fetchTickets();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ padding: 16 }}>
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
            <TextInput
              placeholder="Search..."
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                width: 200,
              }}
            />

            <Pressable style={styles.button}>
              <Text>Sort ▼</Text>
            </Pressable>

            <Pressable style={styles.button}>
              <Text>Filter ⚙️</Text>
            </Pressable>
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
          {tickets.map((ticket, index) => (
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
    </View>
  );
}
