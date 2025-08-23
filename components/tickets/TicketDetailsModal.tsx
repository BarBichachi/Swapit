import TicketModal from "@/components/tickets/TicketModal";
import useAuthGuard from "@/hooks/useAuthGuard";
import { purchaseTicketNaive } from "@/lib/purchase";
import { Ticket } from "@/types/ticket";
import Slider from "@react-native-assets/slider";
import { useEffect, useState } from "react";
import { Alert, Pressable, Text } from "react-native";

interface TicketDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  ticket: Ticket | null;
  onPurchased?: () => void;
}

export default function TicketDetailsModal({
  visible,
  onClose,
  ticket,
  onPurchased,
}: TicketDetailsModalProps) {
  const [suggestedPrice, setSuggestedPrice] = useState(ticket?.price ?? 0);
  const [buying, setBuying] = useState(false);
  const { isAuthed, requireAuth } = useAuthGuard();

  useEffect(() => {
    if (visible && ticket?.price != null) {
      setSuggestedPrice(ticket.price);
    }
  }, [visible, ticket?.price]);

  if (!ticket) return null;

  const isFullPrice = suggestedPrice === ticket.price;
  const buttonColor = isFullPrice ? "#4FC3F7" : "#FFA726";
  const authedText = isFullPrice ? "Purchase" : "Offer";
  const buttonText = isAuthed ? authedText : `Login to ${authedText}`;

  // runs only after auth is confirmed
  const actionCore = async () => {
    try {
      if (isFullPrice) {
        setBuying(true);
        await purchaseTicketNaive(String(ticket.id), 1); // quantity = 1 for now
        Alert.alert("Success", "Purchase completed.");
        onPurchased?.();
      } else {
        Alert.alert("Offer sent", `Suggested price: ${suggestedPrice}₪`);
      }
      onClose();
    } catch (e: any) {
      Alert.alert("Purchase failed", e?.message ?? "Unknown error");
    } finally {
      setBuying(false);
    }
  };

  const handleAction = () => {
    // If not logged in: close modal and redirect to login (handled in hook)
    requireAuth(actionCore, {
      onFail: onClose,
      redirectParams: { open: "ticket", ticketId: String(ticket.id) },
    });
  };

  return (
    <TicketModal
      visible={visible}
      onClose={onClose}
      ticket={ticket}
      actions={
        <>
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
          <Pressable
            onPress={handleAction}
            disabled={buying}
            style={[
              {
                marginTop: 10,
                paddingVertical: 12,
                borderRadius: 8,
                width: "30%",
                backgroundColor: buttonColor,
                opacity: buying ? 0.7 : 1,
              },
            ]}
          >
            <Text
              style={{
                color: "#fff",
                textAlign: "center",
                fontWeight: "600",
                fontSize: 14,
              }}
            >
              {buying ? "Processing..." : buttonText}
            </Text>
          </Pressable>
        </>
      }
    />
  );
}
