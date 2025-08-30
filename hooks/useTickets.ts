import { supabase } from "@/lib/supabase";
import { Ticket } from "@/types/ticket";
import { useEffect, useState } from "react";

type UnitRow = {
  id: string;
  ticket_id: string;
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

export const useTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [groups, setGroups] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketIdMap, setTicketIdMap] = useState<Map<string, string[]>>(
    new Map()
  );

  const fetchTickets = async () => {
    const { data, error } = await supabase
      .from("ticket_units")
      .select(
        `
        id,
        ticket_id,
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
      setTickets([]);
      setGroups([]);
      setLoading(false);
      setTicketIdMap(new Map());
      return;
    }

    const rows = (data ?? []) as UnitRow[];

    // קיבוץ לפי ticket_id
    const grouped = new Map<
      string,
      {
        unit_ids: string[];
        ticket_id: string;
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
      const key = u.ticket_id;
      const price = Number(u.current_price ?? 0);

      if (!grouped.has(key)) {
        grouped.set(key, {
          unit_ids: [u.id],
          ticket_id: u.ticket_id,
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
        g.unit_ids.push(u.id);
      }
    }

    // מערך tickets: כל יחידת כרטיס בנפרד
    const tickets: Ticket[] = rows.map((u) => {
      const ev = Array.isArray(u.events) ? u.events[0] : u.events;
      return {
        id: u.id,
        ticket_id: u.ticket_id,
        event_id: u.event_id,
        sellerId: u.owner_user_id,
        eventTitle: ev?.name ?? "Unknown",
        date: ev?.datetime
          ? new Date(ev.datetime).toLocaleDateString("en-GB")
          : "TBD",
        price: Number(u.current_price ?? 0),
        quantity: 1,
        imageUrl:
          typeof ev?.image_url === "string" &&
          /^https?:\/\//i.test(ev.image_url!)
            ? ev.image_url
            : undefined,
        status: "active" as const,
      };
    });

    // מערך groups: להצגה במסך הראשי
    const groups: Ticket[] = Array.from(grouped.values()).map((g) => ({
      id: g.ticket_id,
      ticket_id: g.ticket_id,
      event_id: g.event_id,
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
          ? g.ev.image_url
          : undefined,
      status: "active" as const,
    }));

    // ticketIdMap: מיפוי ticket_id לכל unit_ids
    const ticketIdMap = new Map<string, string[]>();
    for (const g of grouped.values()) {
      ticketIdMap.set(g.ticket_id, g.unit_ids);
    }

    setTickets(tickets);
    setGroups(groups);
    setTicketIdMap(ticketIdMap);
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
        { event: "*", schema: "public", table: "ticket_units" },
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

  // groups - להצגה במסך הראשי, tickets - לדפדוף במודל
  return { tickets, groups, loading, refetch: fetchTickets, ticketIdMap };
};
