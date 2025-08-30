import { supabase } from "@/lib/supabase";
import { Ticket } from "@/types/ticket";
import React, { useEffect, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface TicketModalProps {
  visible: boolean;
  onClose: () => void;
  ticketIds?: string[];
  actions?: React.ReactNode;
  currentIndex?: number;
  handlePrev?: () => void;
  handleNext?: () => void;
  tickets?: Ticket[];
}

export default function TicketModal({
  visible,
  onClose,
  ticketIds = [],
  actions,
  currentIndex = 0,
  handlePrev,
  handleNext,
  tickets = [],
}: TicketModalProps) {
  const [localTicket, setLocalTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    if (!visible || !ticketIds.length) {
      setLocalTicket(null);
      return;
    }
    const currentTicketId = ticketIds[currentIndex];

    // אם יש לך את כל הכרטיסים במערך tickets, תשלוף אותם מקומית
    if (tickets.length) {
      setLocalTicket(tickets.find((t) => t.id === currentTicketId) ?? null);
      return;
    }

    // אחרת, תטען מהשרת
    const fetchTicket = async () => {
      const { data } = await supabase
        .from("ticket_units")
        .select(`
          ticket_id,
          event_id,
          owner_user_id,
          current_price,
          quantity_available,
          events:events (
            name,
            datetime,
            image_url
          )
        `)
        .eq("ticket_id", currentTicketId)
        .single();

      if (data) {
        const ev = Array.isArray(data.events) ? data.events[0] : data.events;
        setLocalTicket({
          id: data.ticket_id,
          event_id: data.event_id,
          sellerId: data.owner_user_id,
          eventTitle: ev?.name ?? "Unknown",
          date: ev?.datetime
            ? new Date(ev.datetime).toLocaleDateString("en-GB")
            : "TBD",
          price: data.current_price ?? 0,
          quantity: data.quantity_available ?? 1,
          imageUrl:
            typeof ev?.image_url === "string" &&
            /^https?:\/\//i.test(ev.image_url!)
              ? ev.image_url
              : undefined,
          status: "active",
        });
      }
    };

    fetchTicket();
  }, [visible, ticketIds, currentIndex, tickets]);

  if (!visible || !localTicket) return null;

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
          <Text>Price: {localTicket.price}₪</Text>
          <Text>Quantity: {localTicket.quantity}</Text>
          {actions}
          {ticketIds.length > 1 && (
            <View style={styles.navButtons}>
              <TouchableOpacity
                style={[
                  styles.navButton,
                  currentIndex === 0 && { opacity: 0.5 },
                ]}
                onPress={handlePrev}
                disabled={currentIndex === 0}
              >
                <Text style={styles.navButtonText}>Previous</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.navButton,
                  currentIndex === ticketIds.length - 1 && { opacity: 0.5 },
                ]}
                onPress={handleNext}
                disabled={currentIndex === ticketIds.length - 1}
              >
                <Text style={styles.navButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          )}
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
  navButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 16,
  },
  navButton: {
    backgroundColor: "#4FC3F7",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  navButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
});