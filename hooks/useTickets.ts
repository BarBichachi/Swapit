import { supabase } from "@/lib/supabase";
import { Ticket } from "@/types/ticket";
import { useEffect, useState } from "react";

export const useTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [userName, setUserName] = useState("Bar");

  useEffect(() => {
    const fetchTickets = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserName(user?.user_metadata?.first_name ?? "Bar");

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
          imageUrl: event?.image_url
            ? supabase.storage
                .from("event-images")
                .getPublicUrl(event.image_url).data.publicUrl
            : undefined,
        };
      });

      setTickets(formatted);
    };

    fetchTickets();
  }, []);

  return { tickets, userName };
};
