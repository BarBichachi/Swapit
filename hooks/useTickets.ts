import { supabase } from "@/lib/supabase";
import { Ticket } from "@/types/ticket";
import { useCallback, useEffect, useRef, useState } from "react";

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

  // Re-entrancy control for realtime bursts
  const fetchingRef = useRef(false);
  const pendingRef = useRef(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    let cancelled = false;

    // allow callers to cancel via returned function
    const cancel = () => {
      cancelled = true;
    };

    try {
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

      if (cancelled) return;

      if (error) {
        setTickets([]);
        setGroups([]);
        setTicketIdMap(new Map());
        return;
      }

      const rows = (data ?? []) as UnitRow[];

      // group by ticket_id
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

      const nextTickets: Ticket[] = rows.map((u) => {
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

      const nextGroups: Ticket[] = Array.from(grouped.values()).map((g) => ({
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

      const nextMap = new Map<string, string[]>();
      for (const g of grouped.values()) nextMap.set(g.ticket_id, g.unit_ids);

      setTickets(nextTickets);
      setGroups(nextGroups);
      setTicketIdMap(nextMap);
    } finally {
      if (!cancelled) setLoading(false);
    }

    return cancel;
  }, []);

  // helper to avoid concurrent refetch storms from realtime
  const safeRefetch = useCallback(async () => {
    if (fetchingRef.current) {
      pendingRef.current = true;
      return;
    }
    fetchingRef.current = true;
    await fetchTickets();
    fetchingRef.current = false;
    if (pendingRef.current) {
      pendingRef.current = false;
      await safeRefetch();
    }
  }, [fetchTickets]);

  useEffect(() => {
    let disposed = false;

    // initial fetch
    (async () => {
      if (disposed) return;
      await fetchTickets();
    })();

    // realtime subscriptions
    const channelTickets = supabase
      .channel("tickets-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ticket_units" },
        () => {
          if (!disposed) safeRefetch();
        }
      )
      .subscribe();

    const channelEvents = supabase
      .channel("events-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        () => {
          if (!disposed) safeRefetch();
        }
      )
      .subscribe();

    return () => {
      disposed = true;
      supabase.removeChannel(channelTickets);
      supabase.removeChannel(channelEvents);
    };
  }, [fetchTickets, safeRefetch]);

  return { tickets, groups, loading, refetch: safeRefetch, ticketIdMap };
};
