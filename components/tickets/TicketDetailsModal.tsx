import TicketModal from "@/components/tickets/TicketModal";
import useAuthGuard from "@/hooks/useAuthGuard";
import { Ticket } from "@/types/ticket";
import Slider from "@react-native-assets/slider";
import { useEffect, useState } from "react";
import { Pressable, Text } from "react-native";

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

  const actionCore = () => {
    if (isFullPrice) {
      alert("Purchasing ticket at full price: " + ticket.price);
    } else {
      alert("Suggested price: " + suggestedPrice);
    }
    onClose();
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
            style={[
              {
                marginTop: 10,
                paddingVertical: 12,
                borderRadius: 8,
                width: "30%",
                backgroundColor: buttonColor,
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
              {buttonText}
            </Text>
          </Pressable>
        </>
      }
    />
  );
}
