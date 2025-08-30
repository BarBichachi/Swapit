import TicketModal from "@/components/tickets/TicketModal";
import { useAuthContext } from "@/contexts/AuthContext";
import { purchaseTicketNaive } from "@/lib/purchase";
import { Ticket } from "@/types/ticket";
import Slider from "@react-native-assets/slider";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text } from "react-native";

interface TicketDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  ticket: Ticket | null;
  ticketIds?: string[];
  tickets?: Ticket[];
  onPurchased?: () => void;
}

export default function TicketDetailsModal({
  visible,
  onClose,
  ticket,
  ticketIds = [],
  tickets = [],
  onPurchased,
}: TicketDetailsModalProps) {
  const router = useRouter();
  const { currentUser } = useAuthContext();

  const [suggestedPrice, setSuggestedPrice] = useState(ticket?.price ?? 0);
  const [buying, setBuying] = useState(false);
  const inFlightRef = useRef(false);
  const idempoRef = useRef<string | undefined>(undefined);

  const userId = currentUser.id ?? null;
  const isLoggedIn = currentUser.isLoggedIn;

  // דפדוף בין כרטיסים בקבוצה
  const [currentIndex, setCurrentIndex] = useState(0);
  useEffect(() => {
    if (!visible || !ticket || !ticketIds.length) {
      setCurrentIndex(0);
      return;
    }
    const idx = ticketIds.findIndex((id) => id === ticket.id);
    setCurrentIndex(idx >= 0 ? idx : 0);
  }, [visible, ticket?.id, ticketIds]);

  const currentTicketId = ticketIds[currentIndex] ?? ticket?.id;
  const currentTicket = tickets.find((t) => t.id === currentTicketId) ?? ticket;

  const isMine = !!userId && currentTicket?.sellerId === userId;

  // תיקון: עדכון suggestedPrice בכל מעבר כרטיס
  useEffect(() => {
    if (visible && ticketIds.length && tickets.length) {
      const t = tickets.find((t) => t.id === ticketIds[currentIndex]);
      if (t?.price != null) setSuggestedPrice(t.price);
    }
  }, [visible, currentIndex, ticketIds, tickets]);

  useEffect(() => {
    if (!visible) return;
    inFlightRef.current = false;
    idempoRef.current = undefined;
    setBuying(false);
  }, [visible, currentTicket?.id]);

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
      return () => document.removeEventListener("visibilitychange", onVis);
    }
  }, []);

  if (!currentTicket) return null;

  const isFullPrice = suggestedPrice === currentTicket.price;
  const buttonColor = isFullPrice ? "#4FC3F7" : "#FFA726";
  const authedText = isMine
    ? "You own this ticket"
    : isFullPrice
    ? "Purchase"
    : "Offer";
  const buttonText = isMine
    ? authedText
    : isLoggedIn
    ? authedText
    : `Login to ${authedText}`;

  // Actual action (only when logged in and not buying own ticket)
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
          String(currentTicketId),
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
    // release stale guard after tab switch
    if (!buying && inFlightRef.current) inFlightRef.current = false;

    // prevent double-press
    if (inFlightRef.current || buying) return;
    inFlightRef.current = true;

    try {
      // If guest: close modal and navigate to login with intent
      if (!isLoggedIn) {
        onClose();
        router.push({
          pathname: "/(auth)/login",
          params: {
            source: "guard",
            redirect: "/", // or the page you want to land on after login
            open: "ticket",
            ticketId: String(ticket.id),
          },
        } as never);
        return;
      }

      // Logged in: run the core action
      await actionCore();
    } finally {
      inFlightRef.current = false;
      idempoRef.current = undefined;
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < ticketIds.length - 1) setCurrentIndex(currentIndex + 1);
  };

  return (
    <TicketModal
      visible={visible}
      onClose={onClose}
      ticketIds={ticketIds}
      currentIndex={currentIndex}
      handlePrev={handlePrev}
      handleNext={handleNext}
      actions={
        <>
          <Text style={{ marginTop: 20 }}>Set your price:</Text>
          <Slider
            style={{ width: "60%", height: 20, cursor: "pointer" }}
            minimumValue={0}
            maximumValue={currentTicket.price}
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
      tickets={tickets}
    />
  );
}
