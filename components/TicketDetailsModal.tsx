import { Ticket } from "@/types/ticket";
import Slider from "@react-native-assets/slider";
import { useEffect, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";

interface TicketDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  ticket: Ticket | null;
}

export default function TicketDetailsModal({
  visible,
  onClose,
  ticket,
}: TicketDetailsModalProps) {
  const [suggestedPrice, setSuggestedPrice] = useState(ticket?.price ?? 0);

  useEffect(() => {
    if (visible && ticket?.price != null) {
      setSuggestedPrice(ticket.price);
    }
  }, [visible, ticket?.price]);

  if (!ticket) return null;

  const isFullPrice = suggestedPrice === ticket.price;
  const buttonColor = isFullPrice ? "#4FC3F7" : "#FFA726";
  const buttonText = isFullPrice ? "Purchase" : "Offer";

  const handleAction = () => {
    if (isFullPrice) {
      // TODO
      alert("Purchasing ticket at full price: " + ticket.price);
    } else {
      // TODO
      alert("Suggested price: " + suggestedPrice);
    }
    onClose(); // Close modal after action
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
          <Text>Price: {ticket.price}₪</Text>
          <Text>Quantity: {ticket.quantity}</Text>

          {/* Slider */}
          <Text style={{ marginTop: 20 }}>Set your price:</Text>
          <Slider
            style={{ width: "60%", height: 20, cursor: "pointer" }}
            minimumValue={0}
            maximumValue={ticket.price}
            step={1}
            value={suggestedPrice}
            onValueChange={setSuggestedPrice}
            minimumTrackTintColor="#4FC3F7"
            maximumTrackTintColor="#E0E0E0"
            thumbTintColor="#4FC3F7"
          />
          <Text style={{ textAlign: "center", marginBottom: 10 }}>
            {suggestedPrice}₪
          </Text>

          {/* Button */}
          <Pressable
            onPress={handleAction}
            style={[styles.button, { backgroundColor: buttonColor }]}
          >
            <Text style={styles.buttonText}>{buttonText}</Text>
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
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
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
  closeText: {
    fontSize: 20,
    color: "#999",
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
    width: "30%",
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 14,
  },
});
