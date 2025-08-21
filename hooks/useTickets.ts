import { supabase } from "@/lib/supabase";
import { Ticket } from "@/types/ticket";
import { useEffect, useState } from "react";

export const useTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    const { data, error } = await supabase
      .from("tickets")
      .select(
        `
        id,
        current_price,
        quantity_available,
        event_id,
        events:events (
          name,
          datetime,
          image_url
        )
      `
      )
      .eq("status", "active");

    if (error) return;

    const formatted = (data ?? []).map((t) => {
      const event = Array.isArray(t.events) ? t.events[0] : t.events;
      return {
        id: t.id,
        eventTitle: event?.name ?? "Unknown",
        date: event?.datetime
          ? new Date(event.datetime).toLocaleDateString("en-GB")
          : "TBD",
        price: t.current_price,
        quantity: t.quantity_available,
        imageUrl:
          typeof event?.image_url === "string" &&
          /^https?:\/\//i.test(event.image_url)
            ? event.image_url
            : undefined,
      };
    });

    setTickets(formatted);
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      await fetchTickets();
    })();

    // live refresh on price/qty/status changes
    const channel = supabase
      .channel("tickets-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        () => {
          if (active) fetchTickets();
        }
      )
      .subscribe();

    const eventsChannel = supabase
      .channel("events-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        () => fetchTickets()
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
      supabase.removeChannel(eventsChannel);
    };
  }, []);

  return { tickets, loading };
};
