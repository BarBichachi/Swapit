import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export const usePurchasedTickets = (userId: string | null) => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setTickets([]);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          ticket_unit:ticket_id (
            *,
            events:events (
              name,
              datetime,
              image_url
            )
          )
        `)
        .eq("buyer_id", userId);

      if (error) {
        setTickets([]);
        setLoading(false);
        return;
      }

      setTickets(data ?? []);
      setLoading(false);
    };

    fetch();
  }, [userId]);

  return { tickets, loading };
};