import { supabase } from "@/lib/supabase";
import { Ticket } from "@/types/ticket";
import Slider from "@react-native-assets/slider";
import { useEffect, useState } from "react";
import { Alert, Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";

interface TicketUpdateModalProps {
  visible: boolean;
  onClose: () => void;
  ticket: Ticket | null;
  onUpdated?: () => void; // callback after update
}

export default function TicketUpdateModal({
  visible,
  onClose,
  ticket,
  onUpdated,
}: TicketUpdateModalProps) {
  const [newPrice, setNewPrice] = useState(ticket?.price ?? 0);

  useEffect(() => {
    if (visible && ticket?.price != null) {
      setNewPrice(ticket.price);
    }
  }, [visible, ticket?.price]);

  if (!ticket) return null;

  // עדכון מחיר
  const handleUpdatePrice = async () => {
    const { error } = await supabase
      .from("tickets")
      .update({ current_price: newPrice })
      .eq("id", ticket.id);

    if (error) {
      Alert.alert("Error", "Failed to update price");
    } else {
      Alert.alert("Success", "Price updated");
      onUpdated?.();
      onClose();
    }
  };

  // הורדה ממכירה (עדכון סטטוס)
  const handleRemoveFromSale = async () => {
    const { error } = await supabase
      .from("tickets")
      .update({ status: "removed" })
      .eq("id", ticket.id);

    if (error) {
      Alert.alert("Error", "Failed to remove from sale");
    } else {
      Alert.alert("Success", "Ticket removed from sale");
      onUpdated?.();
      onClose();
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable onPress={onClose} style={styles.overlay}>
        <Pressable onPress={() => {}} style={styles.container}>
          {/* Image */}
          <View style={{ width: "100%", alignItems: "center" }}>
            <Image
              source={{
                uri:
                  ticket.imageUrl ||
                  "https://i.ytimg.com/vi/1RPkbjqSk5k/hq720.jpg",
              }}
              style={{
                width: "100%",
                height: 300,
                borderRadius: 10,
                marginBottom: 10,
              }}
              resizeMode="cover"
            />

            {/* Close Button */}
            <Pressable onPress={onClose} style={styles.imageCloseButton}>
              <Text style={styles.imageCloseText}>✕</Text>
            </Pressable>
          </View>

          {/* Ticket Info */}
          <Text style={styles.title}>{ticket.eventTitle}</Text>
          <Text>Date: {ticket.date}</Text>
          <Text>Current Price: {ticket.price}₪</Text>
          <Text>Quantity: {ticket.quantity}</Text>

          {/* Slider */}
          <Text style={{ marginTop: 20 }}>Update price:</Text>
          <Slider
            style={{ width: "60%", height: 20, cursor: "pointer" }}
            minimumValue={0}
            maximumValue={ticket.price * 2}
            step={1}
            value={newPrice}
            onValueChange={setNewPrice}
            minimumTrackTintColor="#4FC3F7"
            maximumTrackTintColor="#E0E0E0"
            thumbTintColor="#4FC3F7"
          />
          <Text style={{ textAlign: "center", marginBottom: 10 }}>
            {newPrice}₪
          </Text>

          {/* Update Price Button */}
          <Pressable
            onPress={handleUpdatePrice}
            style={[styles.button, { backgroundColor: "#4FC3F7" }]}
          >
            <Text style={styles.buttonText}>Update Price</Text>
          </Pressable>

          {/* Remove from Sale Button */}
          <Pressable
            onPress={handleRemoveFromSale}
            style={[styles.button, { backgroundColor: "#FFA726" }]}
          >
            <Text style={styles.buttonText}>Remove from Sale</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#00000099",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
  },
  container: {
    width: "50%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    gap: 4,
    cursor: "auto",
  },
  imageCloseButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#00000088",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  imageCloseText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  button: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 8,
    width: "60%",
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 14,
  },
});