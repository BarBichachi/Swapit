import TicketCard from "@/components/tickets/TicketCard";
import TicketUpdateModal from "@/components/tickets/TicketUpdateModal";
import { supabase } from "@/lib/supabase";
import { Ticket } from "@/types/ticket";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const styles = StyleSheet.create({
  centerTop: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 48,
    paddingBottom: 32,
  },
  profileBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    margin: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    minWidth: 260,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  loginButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  linkButton: {
    marginTop: 8,
    padding: 8,
  },
  ticketsList: {
    width: "100%",
    alignItems: "center",
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    columnGap: 12,
  },
});

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  const fetchProfileAndTickets = async () => {
    setLoading(true);

    // Get user session
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;
    if (!userId) {
      setProfile(null);
      setTickets([]);
      setLoading(false);
      return;
    }

    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    setProfile(profileData);

    // Fetch tickets the user is selling (user_id)
    const { data: ticketsData } = await supabase
      .from("tickets")
      .select(
        `
          id,
          current_price,
          quantity_available,
          event_id,
          status,
          events:events (
            name,
            datetime,
            image_url
          )
        `
      )
      .eq("user_id", userId);

    const formattedTickets: Ticket[] = (ticketsData ?? []).map((t: any) => {
      const event = Array.isArray(t.events) ? t.events[0] : t.events;
      return {
        id: t.id,
        eventTitle: event?.name ?? "Unknown",
        date: event?.datetime
          ? new Date(event.datetime).toLocaleDateString("en-GB")
          : "TBD",
        price: t.current_price,
        quantity: t.quantity_available,
        imageUrl:
          typeof event?.image_url === "string" &&
          /^https?:\/\//i.test(event.image_url)
            ? event.image_url
            : undefined,
        status: t.status,
      };
    });

    setTickets(formattedTickets);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfileAndTickets();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        fetchProfileAndTickets();
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.centerTop}>
        <Text>Loading data...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centerTop}>
        <Text>Not logged in</Text>
        <Pressable
          style={styles.loginButton}
          onPress={() => router.push("/login")}
        >
          <Text style={{ color: "#fff" }}>Go to Login</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.centerTop}>
      <View style={styles.profileBox}>
        <Text style={styles.title}>
          {profile.first_name} {profile.last_name}
        </Text>
        <Text>Email: {profile.email}</Text>
        <Text>Phone: {profile.phone}</Text>
        <Text>City: {profile.city}</Text>
        <Text>Birth Year: {profile.birth_year}</Text>
        <Text>Gender: {profile.gender}</Text>
      </View>

      <Text style={[styles.title, { marginTop: 24 }]}>Tickets I'm Selling</Text>
      <View style={styles.ticketsList}>
        {tickets.length === 0 ? (
          <View style={{ alignItems: "center" }}>
            <Text>No tickets for sale</Text>
            <Pressable
              style={styles.linkButton}
              onPress={() => router.push("/")}
            >
              <Text style={{ color: "#007AFF" }}>
                Go to main page to sell tickets
              </Text>
            </Pressable>
          </View>
        ) : (
          tickets.map((ticket, index) => (
            <TicketCard
              key={ticket.id ?? index}
              {...ticket}
              onPress={() => {
                setSelectedTicket(ticket);
                setModalVisible(true);
              }}
            />
          ))
        )}
      </View>

      <TicketUpdateModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        ticket={selectedTicket}
        onUpdated={() => {
          setModalVisible(false);
          fetchProfileAndTickets();
        }}
      />
    </ScrollView>
  );
}
