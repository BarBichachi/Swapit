import TicketCard from "@/components/TicketCard";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { TextInput } from "react-native-gesture-handler";
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

const [userName, setUserName] = useState("Bar");

useEffect(() => {
  const fetchUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserName(user?.user_metadata?.first_name ?? "Bar");
  };

  fetchUser();
}, []);

export default function HomePage() {
  const router = useRouter();

  // MOCK TICKETS
  const [mockTickets, setMockTickets] = useState([
    {
      eventTitle: "Coldplay Live",
      date: "12/09/2025",
      price: 320,
      quantity: 2,
    },
    {
      eventTitle: "Euroleague Final",
      date: "05/10/2025",
      price: 450,
      quantity: 1,
    },
    {
      eventTitle: "Bar Test",
      date: "05/11/2025",
      price: 450,
      quantity: 1,
    },
    {
      eventTitle: "Bar Test",
      date: "05/11/2025",
      price: 450,
      quantity: 1,
    },
    {
      eventTitle: "Bar Test",
      date: "05/11/2025",
      price: 450,
      quantity: 1,
    },
    {
      eventTitle: "Bar Test",
      date: "05/11/2025",
      price: 450,
      quantity: 1,
    },
    {
      eventTitle: "Bar Test",
      date: "05/11/2025",
      price: 450,
      quantity: 1,
    },
  ]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ padding: 16 }}>
        {/* Welcome Message */}
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

            <TouchableOpacity style={styles.button}>
              <Text>Sort ▼</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button}>
              <Text>Filter ⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tickets Grid */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            columnGap: 12,
          }}
        >
          {mockTickets.map((ticket, index) => (
            <TicketCard key={index} {...ticket} />
          ))}
        </View>
      </ScrollView>

      {/* Floating + Button */}
      <View
        style={{
          position: "absolute",
          bottom: 30,
          right: 20,
          zIndex: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => router.push("/(tickets)/upload")}
          style={{
            backgroundColor: "#0288D1",
            width: 60,
            height: 60,
            borderRadius: 30,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 5,
          }}
        >
          <Text
            style={{
              color: "white",
              fontSize: 36,
              lineHeight: 40,
              textAlign: "center",
            }}
          >
            +
          </Text>{" "}
        </TouchableOpacity>
      </View>
    </View>
  );
}
