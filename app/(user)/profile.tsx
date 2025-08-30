import TicketCard from "@/components/tickets/TicketCard";
import TicketModal from "@/components/tickets/TicketModal";
import TicketUpdateModal from "@/components/tickets/TicketUpdateModal";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePurchasedTickets } from "@/hooks/usePurchasedTickets";
import { useTickets } from "@/hooks/useTickets";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
  updateButton: {
    marginTop: 18,
    backgroundColor: "#4FC3F7",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  updateButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
});

const formatPhone = (phone: string) => {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 4) {
    return digits.slice(0, 3) + "-" + digits.slice(3);
  }
  return digits;
};

export default function ProfileScreen() {
  const { currentUser, loading } = useAuthContext();
  const router = useRouter();

  const [selectedSellingGroup, setSelectedSellingGroup] = useState<any | null>(
    null
  );
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [selectedPurchasedTicket, setSelectedPurchasedTicket] = useState<
    any | null
  >(null);
  const [purchasedModalVisible, setPurchasedModalVisible] = useState(false);

  // משיכת הכרטיסים שאני מוכר
  const {
    tickets,
    groups,
    loading: loadingSelling,
    refetch,
    ticketIdMap,
  } = useTickets();

  // משיכת הכרטיסים שרכשתי (hook חדש)
  const { tickets: purchasedTickets, loading: loadingPurchased } =
    usePurchasedTickets(currentUser.id ?? null);

  const handleUpdateDetails = () => {
    router.push("/(user)/updatedetails");
  };

  if (loading || loadingSelling || loadingPurchased) {
    return (
      <View style={styles.centerTop}>
        <Text>Loading data...</Text>
      </View>
    );
  }

  if (!currentUser.isLoggedIn) {
    return (
      <View style={styles.centerTop}>
        <Text>Not logged in</Text>
        <Pressable
          style={styles.loginButton}
          onPress={() => router.push("/(auth)/login")}
        >
          <Text style={{ color: "#fff" }}>Go to Login</Text>
        </Pressable>
      </View>
    );
  }

  // קבוצות שאני מוכר (המשתמש הנוכחי הוא הבעלים של הקבוצה)
  const mySellingGroups = groups.filter((g) => g.sellerId === currentUser.id);

  // מזהי כל היחידות בקבוצה שנבחרה
  const mySellingTicketIds = selectedSellingGroup
    ? ticketIdMap.get(selectedSellingGroup.ticket_id) ?? []
    : [];

  return (
    <ScrollView contentContainerStyle={styles.centerTop}>
      {/* Profile Info */}
      <View style={styles.profileBox}>
        <Text style={styles.title}>{currentUser.fullName}</Text>
        <Text>Email: {currentUser.email ?? "-"}</Text>
        <Text>Phone: {formatPhone(currentUser.phone ?? "")}</Text>
        <Text>Balance: {currentUser.balance.toLocaleString()} coins</Text>
        <Text>City: {currentUser.city ?? "-"}</Text>
        <Text>Birth Year: {currentUser.birth_year ?? "-"}</Text>
        <Text>Gender: {currentUser.gender ?? "-"}</Text>

        <TouchableOpacity
          style={styles.updateButton}
          onPress={handleUpdateDetails}
        >
          <Text style={styles.updateButtonText}>Update Personal Details</Text>
        </TouchableOpacity>
      </View>

      {/* Selling Tickets */}
      <Text style={[styles.title, { marginTop: 24 }]}>Tickets I'm Selling</Text>
      <View style={styles.ticketsList}>
        {mySellingGroups.length === 0 ? (
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
          mySellingGroups.map((group, index) => (
            <TicketCard
              key={group.id ?? index}
              {...group}
              onPress={() => {
                setSelectedSellingGroup(group);
                setUpdateModalVisible(true);
              }}
            />
          ))
        )}
      </View>

      <TicketUpdateModal
        visible={updateModalVisible}
        onClose={() => setUpdateModalVisible(false)}
        ticket={selectedSellingGroup}
        ticketIds={mySellingTicketIds}
        tickets={tickets}
        onUpdated={() => {
          setUpdateModalVisible(false);
          refetch();
        }}
      />

      {/* Purchased Tickets */}
      <Text style={[styles.title, { marginTop: 32 }]}>Tickets I Purchased</Text>
      <View style={styles.ticketsList}>
        {purchasedTickets.length === 0 ? (
          <View style={{ alignItems: "center" }}>
            <Text>No purchased tickets</Text>
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
          purchasedTickets.map((tx, index) => (
            <TicketCard
              key={tx.id ?? index}
              {...tx.ticket_unit}
              onPress={() => {
                setSelectedPurchasedTicket(tx.ticket_unit);
                setPurchasedModalVisible(true);
              }}
            />
          ))
        )}
      </View>

      <TicketModal
        visible={purchasedModalVisible}
        onClose={() => setPurchasedModalVisible(false)}
        tickets={selectedPurchasedTicket ? [selectedPurchasedTicket] : []}
      />
    </ScrollView>
  );
}
