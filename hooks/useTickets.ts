import { supabase } from "@/lib/supabase";
import { Ticket } from "@/types/ticket";
import { useEffect, useState } from "react";

type TicketRow = {
  id: string;
  current_price: number | null;
  quantity_available: number | null;
  event_id: string;
  // Supabase nested returns either a single row or array depending on relation config
  events:
    | { name: string | null; datetime: string | null; image_url: string | null }
    | {
        name: string | null;
        datetime: string | null;
        image_url: string | null;
      }[]
    | null;
};

export const useTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    const { data, error } = await supabase
      .from("ticket_units")
      .select(
        `
    event_id,
    owner_user_id,
    current_price,
    events:events (
      name,
      datetime,
      image_url
    )
  `
      )
      .eq("status", "active");

    if (error) {
      console.error("[useTickets] fetch error:", error);
      setTickets([]);
      setLoading(false);
      return;
    }

    type UnitRow = {
      event_id: string;
      owner_user_id: string;
      current_price: number | null;
      events:
        | {
            name?: string | null;
            datetime?: string | null;
            image_url?: string | null;
          }
        | Array<{
            name?: string | null;
            datetime?: string | null;
            image_url?: string | null;
          }>;
    };

    const rows = (data ?? []) as UnitRow[];

    // Group units by (event_id + owner_user_id)
    const grouped = new Map<
      string,
      {
        event_id: string;
        owner_user_id: string;
        minPrice: number;
        count: number;
        ev: {
          name?: string | null;
          datetime?: string | null;
          image_url?: string | null;
        } | null;
      }
    >();

    for (const u of rows) {
      const ev = Array.isArray(u.events) ? u.events[0] : u.events;
      const key = `${u.event_id}:${u.owner_user_id}`;
      const price = Number(u.current_price ?? 0);

      if (!grouped.has(key)) {
        grouped.set(key, {
          event_id: u.event_id,
          owner_user_id: u.owner_user_id,
          minPrice: price,
          count: 1,
          ev: ev ?? null,
        });
      } else {
        const g = grouped.get(key)!;
        g.minPrice = Math.min(g.minPrice, price);
        g.count += 1;
      }
    }

    const formatted: Ticket[] = Array.from(grouped.values()).map(
      (g): Ticket => ({
        id: `${g.event_id}:${g.owner_user_id}`,
        sellerId: g.owner_user_id,
        eventTitle: g.ev?.name ?? "Unknown",
        date: g.ev?.datetime
          ? new Date(g.ev.datetime).toLocaleDateString("en-GB")
          : "TBD",
        price: g.minPrice,
        quantity: g.count,
        imageUrl:
          typeof g.ev?.image_url === "string" &&
          /^https?:\/\//i.test(g.ev.image_url!)
            ? (g.ev!.image_url as string)
            : undefined,
        status: "active" as const, // <- key change
      })
    );

    formatted.sort((a, b) => {
      const da =
        a.date === "TBD"
          ? Infinity
          : new Date(a.date.split("/").reverse().join("-")).getTime();
      const db =
        b.date === "TBD"
          ? Infinity
          : new Date(b.date.split("/").reverse().join("-")).getTime();
      return da - db;
    });

    setTickets(formatted);
    setLoading(false);
  };

  useEffect(() => {
    let active = true;

    fetchTickets();

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

  return { tickets, loading, refetch: fetchTickets };
};
