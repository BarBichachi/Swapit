import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useRef, useState } from "react";

export const usePurchasedTickets = (userId: string | null) => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchingRef = useRef(false);
  const pendingRef = useRef(false);

  const fetchOnce = useCallback(async () => {
    if (!userId) {
      setTickets([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(
          `
          *,
          ticket_unit:ticket_id (
            *,
            events:events ( name, datetime, image_url )
          )
        `
        )
        .eq("buyer_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets(data ?? []);
    } catch (e: any) {
      setTickets([]);
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Safe refetch to coalesce bursts (e.g., realtime)
  const refetch = useCallback(async () => {
    if (fetchingRef.current) {
      pendingRef.current = true;
      return;
    }
    fetchingRef.current = true;
    await fetchOnce();
    fetchingRef.current = false;
    if (pendingRef.current) {
      pendingRef.current = false;
      await refetch();
    }
  }, [fetchOnce]);

  useEffect(() => {
    let disposed = false;
    (async () => {
      if (!disposed) await refetch();
    })();
    if (!userId) return;
    const ch = supabase
      .channel(`purchases-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `buyer_id=eq.${userId}`,
        },
        () => {
          if (!disposed) refetch();
        }
      )
      .subscribe();
    return () => {
      disposed = true;
      supabase.removeChannel(ch);
    };
  }, [userId, refetch]);

  return { tickets, loading, error, refetch };
};
