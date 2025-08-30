import TicketModal from "@/components/tickets/TicketModal";
import { supabase } from "@/lib/supabase";
import { Ticket } from "@/types/ticket";
import Slider from "@react-native-assets/slider";
import { useEffect, useState } from "react";
import { Pressable, Text } from "react-native";

interface TicketUpdateModalProps {
  visible: boolean;
  onClose: () => void;
  ticket: Ticket | null;
  ticketIds?: string[];
  tickets?: Ticket[];
  onUpdated?: () => void;
}

export default function TicketUpdateModal({
  visible,
  onClose,
  ticket,
  ticketIds = [],
  tickets = [],
  onUpdated,
}: TicketUpdateModalProps) {
  // דפדוף בין כרטיסים
  const [currentIndex, setCurrentIndex] = useState(0);

  // הכרטיס הנוכחי לפי הדפדוף
  const currentTicketId = ticketIds[currentIndex];
  const currentTicket = tickets.find((t) => t.id === currentTicketId);

  const [newPrice, setNewPrice] = useState(currentTicket?.price ?? 0);
  const [originalPrice, setOriginalPrice] = useState<number | null>(null);

  useEffect(() => {
    if (visible && ticket && ticketIds.length) {
      const idx = ticketIds.findIndex((id) => id === ticket.id);
      setCurrentIndex(idx >= 0 ? idx : 0);
    }
  }, [visible, ticket?.id, ticketIds]);

  // עדכון הסליידר והמחיר בכל מעבר כרטיס
  useEffect(() => {
    if (visible && currentTicket) {
      setNewPrice(currentTicket.price);

      const fetchOriginalPrice = async () => {
        const { data } = await supabase
          .from("ticket_units")
          .select("original_price")
          .eq("id", currentTicket.id)
          .single();
        setOriginalPrice(data?.original_price ?? currentTicket.price);
      };
      fetchOriginalPrice();
    }
  }, [visible, currentIndex, currentTicket?.id, currentTicket?.price]);

  // עדכון מחיר בטבלת ticket_units
  const handleUpdatePrice = async () => {
    const { error } = await supabase
      .from("ticket_units")
      .update({ current_price: newPrice })
      .eq("id", currentTicket?.id);

    if (error) {
      alert("Error, Failed to update price");
    } else {
      alert("Success, Price updated");
      onUpdated?.();
      onClose();
    }
  };

  // הסרת כרטיס מהמחירה (עדכון סטטוס ל-removed)
  const handleRemoveFromSale = async () => {
    const { error } = await supabase
      .from("ticket_units")
      .update({ status: "removed" })
      .eq("id", currentTicket?.id);

    if (error) {
      alert("Error, Failed to remove from sale");
    } else {
      alert("Success, Ticket removed from sale");
      onUpdated?.();
      onClose();
    }
  };

  if (!currentTicket) return null;

  return (
    <TicketModal
      visible={visible}
      onClose={onClose}
      tickets={tickets}
      ticketIds={ticketIds}
      currentIndex={currentIndex}
      handlePrev={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
      handleNext={() => setCurrentIndex((i) => Math.min(i + 1, ticketIds.length - 1))}
      actions={
        <>
          <Slider
            style={{ width: "60%", height: 20, cursor: "pointer", marginTop: 20 }}
            minimumValue={1}
            maximumValue={originalPrice ?? currentTicket.price}
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
          <Pressable
            onPress={handleUpdatePrice}
            style={{ marginTop: 10, paddingVertical: 12, borderRadius: 8, width: "60%", backgroundColor: "#4FC3F7" }}
          >
            <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600", fontSize: 14 }}>
              Update Price
            </Text>
          </Pressable>
          <Pressable
            onPress={handleRemoveFromSale}
            style={{ marginTop: 10, paddingVertical: 12, borderRadius: 8, width: "60%", backgroundColor: "#FFA726" }}
          >
            <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600", fontSize: 14 }}>
              Remove from Sale
            </Text>
          </Pressable>
        </>
      }
    />
  );
}