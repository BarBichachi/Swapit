import TicketModal from "@/components/tickets/TicketModal";
import { supabase } from "@/lib/supabase";
import { Ticket } from "@/types/ticket";
import Slider from "@react-native-assets/slider";
import { useEffect, useState } from "react";
import { Pressable, Text } from "react-native";

export default function TicketUpdateModal({
  visible,
  onClose,
  ticket,
  onUpdated,
}: {
  visible: boolean;
  onClose: () => void;
  ticket: Ticket | null;
  onUpdated?: () => void;
}) {
  const [newPrice, setNewPrice] = useState(ticket?.price ?? 0);
  const [originalPrice, setOriginalPrice] = useState<number | null>(null);

  useEffect(() => {
    if (visible && ticket?.price != null) {
      setNewPrice(ticket.price);

      // שליפת original_price מהטבלה ticket_units
      const fetchOriginalPrice = async () => {
        if (ticket?.id) {
          const { data } = await supabase
            .from("ticket_units")
            .select("original_price")
            .eq("id", ticket.id)
            .single();
          setOriginalPrice(data?.original_price ?? ticket.price);
        }
      };
      fetchOriginalPrice();
    }
  }, [visible, ticket?.price, ticket?.id]);

  if (!ticket) return null;

  // עדכון מחיר בטבלת ticket_units
  const handleUpdatePrice = async () => {
    const { error } = await supabase
      .from("ticket_units")
      .update({ current_price: newPrice })
      .eq("id", ticket.id);

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
      .eq("id", ticket.id);

    if (error) {
      alert("Error, Failed to remove from sale");
    } else {
      alert("Success, Ticket removed from sale");
      onUpdated?.();
      onClose();
    }
  };

  return (
    <TicketModal
      visible={visible}
      onClose={onClose}
      ticket={ticket}
      actions={
        <>
          <Slider
            style={{
              width: "60%",
              height: 20,
              cursor: "pointer",
              marginTop: 20,
            }}
            minimumValue={1}
            maximumValue={originalPrice ?? ticket.price}
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
            style={{
              marginTop: 10,
              paddingVertical: 12,
              borderRadius: 8,
              width: "60%",
              backgroundColor: "#4FC3F7",
            }}
          >
            <Text
              style={{
                color: "#fff",
                textAlign: "center",
                fontWeight: "600",
                fontSize: 14,
              }}
            >
              Update Price
            </Text>
          </Pressable>
          <Pressable
            onPress={handleRemoveFromSale}
            style={{
              marginTop: 10,
              paddingVertical: 12,
              borderRadius: 8,
              width: "60%",
              backgroundColor: "#FFA726",
            }}
          >
            <Text
              style={{
                color: "#fff",
                textAlign: "center",
                fontWeight: "600",
                fontSize: 14,
              }}
            >
              Remove from Sale
            </Text>
          </Pressable>
        </>
      }
    />
  );
}
