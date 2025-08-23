import TicketModal from "@/components/tickets/TicketModal";
import useAuthGuard from "@/hooks/useAuthGuard";
import useProfile from "@/hooks/useProfile";
import { purchaseTicketNaive } from "@/lib/purchase";
import { Ticket } from "@/types/ticket";
import Slider from "@react-native-assets/slider";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text } from "react-native";

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
  const inFlightRef = useRef(false);
  const idempoRef = useRef<string | undefined>(undefined);
  const { isAuthed, requireAuth } = useAuthGuard();
  const { userId } = useProfile();
  const isMine = !!userId && ticket?.sellerId === userId;

  useEffect(() => {
    if (visible && ticket?.price != null) {
      setSuggestedPrice(ticket.price);
    }
  }, [visible, ticket?.price]);

  useEffect(() => {
    if (!visible) return;
    inFlightRef.current = false;
    idempoRef.current = undefined;
    setBuying(false);
  }, [visible, ticket?.id]);

  useEffect(() => {
    const onVis = () => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
      ) {
        inFlightRef.current = false;
        idempoRef.current = undefined;
        setBuying(false);
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVis);
    }
    return () => {
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVis);
      }
    };
  }, []);

  if (!ticket) return null;

  const isFullPrice = suggestedPrice === ticket.price;
  const buttonColor = isFullPrice ? "#4FC3F7" : "#FFA726";
  const authedText = isMine
    ? "You own this ticket"
    : isFullPrice
    ? "Purchase"
    : "Offer";
  const buttonText = isMine
    ? authedText
    : isAuthed
    ? authedText
    : `Login to ${authedText}`;

  // runs only after auth is confirmed
  const actionCore = async () => {
    if (isMine) {
      alert("You can’t purchase your own ticket.");
      return;
    }

    try {
      if (isFullPrice) {
        setBuying(true);
        if (!idempoRef.current) {
          idempoRef.current =
            (globalThis as any)?.crypto?.randomUUID?.() ??
            `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        }
        await purchaseTicketNaive(
          String(ticket.id),
          1,
          idempoRef.current,
          userId!
        );

        alert("Purchase completed.");
        onPurchased?.();
      } else {
        alert(`Suggested price: ${suggestedPrice}₪`);
      }
      onClose();
    } catch (e: any) {
      alert(e?.message ?? "Unknown error");
    } finally {
      setBuying(false);
      idempoRef.current = undefined;
    }
  };

  const handleAction = async () => {
    // stale guard release after tab switch
    if (!buying && inFlightRef.current) inFlightRef.current = false;

    // prevent double-press / rapid re-entry
    if (inFlightRef.current || buying) return;
    inFlightRef.current = true;

    // If we already know the user (from useProfile), run directly
    if (userId) {
      try {
        await actionCore();
      } finally {
        inFlightRef.current = false;
        idempoRef.current = undefined;
      }
      return;
    }

    // If not logged in: close modal and redirect to login (handled in hook)
    requireAuth(
      async () => {
        await actionCore(); // actionCore manages buying + idempotency
        inFlightRef.current = false;
        idempoRef.current = undefined;
      },
      {
        onFail: () => {
          // auth failed or redirected: release the guard
          inFlightRef.current = false;
          idempoRef.current = undefined;
          onClose();
        },
        redirectParams: { open: "ticket", ticketId: String(ticket.id) },
      }
    );
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
            disabled={buying || isMine}
            style={[
              {
                marginTop: 10,
                paddingVertical: 12,
                borderRadius: 8,
                width: "30%",
                backgroundColor: buttonColor,
                opacity: buying || isMine ? 0.7 : 1,
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
