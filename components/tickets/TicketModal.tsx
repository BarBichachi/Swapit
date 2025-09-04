import { supabase } from "@/lib/supabase";
import { Ticket } from "@/types/ticket";
import React, { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

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

// תאריך בפורמט DD/MM/YYYY, שעה בלי שניות
function formatDateTime(dateStr?: string) {
  if (!dateStr) return "TBD";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "TBD";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy}, ${hh}:${min}`;
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
  const [localTicket, setLocalTicket] = useState<any>(null);

  useEffect(() => {
    if (!visible || !ticketIds.length) {
      setLocalTicket(null);
      return;
    }
    const currentTicketId = ticketIds[currentIndex];
    if (!currentTicketId) return;

    // אם יש כרטיס במערך – נשתמש בו כבסיס, אבל תמיד נטען מהשרת להשלמת הפרטים
    const base = tickets.find((t) => t.id === currentTicketId);
    if (base) setLocalTicket((prev: any) => prev ?? base);

    const fetchTicket = async () => {
      const { data, error } = await supabase
        .from("ticket_units")
        .select(
          `
          *,
          event:events (
            name,
            datetime,
            city,
            venue,
            image_url
          )
        `
        )
        .eq("id", currentTicketId)
        .single();

      if (error) {
        console.error("fetchTicket error:", error);
        return;
      }

      if (data) {
        // הגנה: לפעמים event חוזר כמערך
        const evRaw = (data as any).event;
        const ev = Array.isArray(evRaw) ? evRaw[0] : evRaw || {};

        setLocalTicket((prev: any) => ({
          ...(prev ?? {}),
          id: data.id,
          event_id: data.event_id,
          sellerId: data.owner_user_id,
          eventTitle: ev?.name ?? prev?.eventTitle ?? "Unknown",
          date: ev?.datetime
            ? formatDateTime(ev.datetime)
            : prev?.date ?? "TBD",
          city: ev?.city ?? prev?.city ?? "",
          venue: ev?.venue ?? prev?.venue ?? "",
          areaType: (data as any).area_type ?? prev?.areaType ?? "",
          isSeated: (data as any).is_seated ?? prev?.isSeated ?? false,
          section: (data as any).section ?? prev?.section ?? "",
          row: (data as any).row ?? prev?.row ?? "",
          seatNumber: (data as any).seat_number ?? prev?.seatNumber ?? "",
          price: (data as any).current_price ?? prev?.price ?? 0,
          quantity: (data as any).quantity_available ?? prev?.quantity ?? 1,
          imageUrl:
            typeof ev?.image_url === "string" &&
            /^https?:\/\//i.test(ev.image_url)
              ? ev.image_url
              : prev?.imageUrl,
          status: prev?.status ?? "active",
        }));
      }
    };

    fetchTicket();
  }, [visible, ticketIds, currentIndex, tickets]);

  const { width, height } = useWindowDimensions();
  const isPhone = width < 480;

  if (!visible || !localTicket) return null;

  const modalWidth = Math.min(720, Math.floor(width * (isPhone ? 0.94 : 0.7)));
  const imageHeight = Math.min(
    360,
    Math.floor(height * (isPhone ? 0.35 : 0.5))
  );
  const contentMaxHeight = Math.floor(height * 0.82);

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        onPress={onClose}
        style={[
          styles.overlay,
          Platform.OS === "web" ? { width, height } : null,
        ]}
      >
        <Pressable
          style={[
            styles.container,
            { width: modalWidth, maxHeight: contentMaxHeight },
          ]}
          onPress={(e: any) => e?.stopPropagation?.()}
        >
          <View style={{ width: "100%", alignItems: "center" }}>
            <Image
              source={{
                uri:
                  localTicket.imageUrl ||
                  "https://i.ytimg.com/vi/1RPkbjqSk5k/hq720.jpg",
              }}
              style={{
                width: "100%",
                height: imageHeight,
                borderRadius: 10,
                marginBottom: 10,
              }}
              resizeMode="cover"
            />
            <Pressable onPress={onClose} style={styles.imageCloseButton}>
              <Text style={styles.imageCloseText}>✕</Text>
            </Pressable>
          </View>

          <View
            style={{
              width: "100%",
              maxHeight: contentMaxHeight - (imageHeight + 60),
            }}
          >
            <View style={{ paddingHorizontal: 4, alignItems: "center" }}>
              <Text style={styles.title}>{localTicket.eventTitle}</Text>

              {/* date + time */}
              <View style={styles.row}>
                <Text style={styles.label}>Date & Time:</Text>
                <Text style={styles.value}>{localTicket.date}</Text>
              </View>

              {/* City | Venue */}
              <View style={styles.row}>
                <Text style={styles.label}>City:</Text>
                <Text style={styles.value}>{localTicket.city}</Text>
                <Text style={styles.separator}> | </Text>
                <Text style={styles.label}>Venue:</Text>
                <Text style={styles.value}>{localTicket.venue}</Text>
              </View>

              {/* area type | is seated */}
              <View style={styles.row}>
                <Text style={styles.label}>Area type:</Text>
                <Text style={styles.value}>{localTicket.areaType}</Text>
                <Text style={styles.separator}> | </Text>
                <Text style={styles.label}>Is seated:</Text>
                <Text style={styles.value}>
                  {localTicket.isSeated ? "Yes" : "No"}
                </Text>
              </View>

              {/* section | row | seat number */}
              {localTicket.isSeated && (
                <View style={styles.row}>
                  <Text style={styles.label}>Section:</Text>
                  <Text style={styles.value}>{localTicket.section}</Text>
                  <Text style={styles.separator}> | </Text>
                  <Text style={styles.label}>Row:</Text>
                  <Text style={styles.value}>{localTicket.row}</Text>
                  <Text style={styles.separator}> | </Text>
                  <Text style={styles.label}>Seat number:</Text>
                  <Text style={styles.value}>{localTicket.seatNumber}</Text>
                </View>
              )}

              {/* Price */}
              <View style={styles.row}>
                <Text style={styles.label}>Price:</Text>
                <Text style={styles.value}>{localTicket.price}₪</Text>
              </View>
            </View>
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
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#00000099",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
  },
  container: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    gap: 6,
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
    textAlign: "center",
  },
  row: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  label: {
    fontWeight: "600",
    color: "#333",
  },
  value: {
    color: "#444",
    marginLeft: 4,
  },
  separator: {
    color: "#888",
    marginHorizontal: 6,
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
