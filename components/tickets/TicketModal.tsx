import { supabase } from "@/lib/supabase";
import { Ticket } from "@/types/ticket";
import React, { useEffect, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";

interface TicketModalProps {
  visible: boolean;
  onClose: () => void;
  ticket: Ticket | null;
  actions?: React.ReactNode;
}

export default function TicketModal({
  visible,
  onClose,
  ticket,
  actions,
}: TicketModalProps) {
  if (!ticket) return null;

  // local copy so we can patch fields from Realtime
  const [localTicket, setLocalTicket] = useState(ticket);

  // keep local state in sync when a *different* ticket is opened
  useEffect(() => {
    setLocalTicket(ticket);
  }, [ticket?.id]);

  // subscribe to updates for this ticket while the modal is open
  useEffect(() => {
    if (!visible || !ticket?.id) return;

    const channel = supabase
      .channel(`ticket-${ticket.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tickets",
          filter: `id=eq.${ticket.id}`,
        },
        (payload: any) => {
          const row = payload.new;
          // Map DB columns -> modal fields you render
          setLocalTicket((prev) =>
            prev
              ? {
                  ...prev,
                  // adjust these mappings to your Ticket type/columns
                  price: row?.current_price ?? prev.price,
                  quantity: row?.quantity_available ?? prev.quantity,
                }
              : prev
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [visible, ticket?.id]);

  if (!localTicket) return null;

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
                  localTicket.imageUrl ||
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
          <Text style={styles.title}>{localTicket.eventTitle}</Text>
          <Text>Date: {localTicket.date}</Text>
          <Text>Price: {localTicket.price ?? localTicket.price}₪</Text>
          <Text>Quantity: {localTicket.quantity}</Text>
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
