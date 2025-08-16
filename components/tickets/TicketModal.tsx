import { Ticket } from "@/types/ticket";
import React from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";

interface TicketModalProps {
  visible: boolean;
  onClose: () => void;
  ticket: Ticket | null;
  actions?: React.ReactNode; // תוספות ייחודיות לכל מודל
}

export default function TicketModal({
  visible,
  onClose,
  ticket,
  actions,
}: TicketModalProps) {
  if (!ticket) return null;

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable onPress={onClose} style={styles.overlay}>
        <Pressable style={styles.container}>
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
            <Pressable onPress={onClose} style={styles.imageCloseButton}>
              <Text style={styles.imageCloseText}>✕</Text>
            </Pressable>
          </View>
          <Text style={styles.title}>{ticket.eventTitle}</Text>
          <Text>Date: {ticket.date}</Text>
          <Text>Price: {ticket.price ?? ticket.price}₪</Text>
          <Text>Quantity: {ticket.quantity}</Text>
          {/* כאן יופיעו כפתורים/פיצ'רים נוספים */}
          {actions}
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
});
