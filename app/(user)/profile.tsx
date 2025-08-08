import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProfileAndTickets = async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        setProfile(null);
        setTickets([]);
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      setProfile(profileData);

      // Fetch tickets bought or sold by the user
      const { data: ticketsData } = await supabase
        .from("tickets")
        .select("*")
        .or(`seller_id.eq.${userId},buyer_id.eq.${userId}`);

      setTickets(ticketsData || []);
      setLoading(false);
    };

    fetchProfileAndTickets();
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

  // Separate tickets
  const sellingTickets = tickets.filter((ticket) => ticket.seller_id === profile.id);
  const boughtTickets = tickets.filter((ticket) => ticket.buyer_id === profile.id);

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
        {sellingTickets.length === 0 ? (
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
          sellingTickets.map((ticket) => (
            <View key={ticket.id} style={styles.ticketBox}>
              <Text>Event Name: {ticket.event_name || ticket.event_id}</Text>
              <Text>Price: {ticket.current_price} ₪</Text>
              <Text>Quantity: {ticket.quantity_available}</Text>
              <Text>Status: For Sale</Text>
            </View>
          ))
        )}
      </View>

      <Text style={[styles.title, { marginTop: 24 }]}>Tickets I've Bought</Text>
      <View style={styles.ticketsList}>
        {boughtTickets.length === 0 ? (
          <View style={{ alignItems: "center" }}>
            <Text>No tickets purchased</Text>
            <Pressable
              style={styles.linkButton}
              onPress={() => router.push("/")}
            >
              <Text style={{ color: "#007AFF" }}>
                Go to main page to buy tickets
              </Text>
            </Pressable>
          </View>
        ) : (
          boughtTickets.map((ticket) => (
            <View key={ticket.id} style={styles.ticketBox}>
              <Text>Event Name: {ticket.event_name || ticket.event_id}</Text>
              <Text>Price: {ticket.current_price} ₪</Text>
              <Text>Quantity: {ticket.quantity_available}</Text>
              <Text>Status: Purchased</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

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
  },
  ticketBox: {
    backgroundColor: "#f3f3f3",
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
    minWidth: 220,
    alignItems: "flex-start",
  },
});