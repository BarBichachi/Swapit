import { supabase } from "@/lib/supabase";

export async function purchaseTicketNaive(
  ticketId: string,
  quantity = 1,
  idempotencyKey?: string,
  buyerId?: string
) {
  // 0) Require auth
  const user = buyerId ?? null;
  if (!user) throw new Error("You must be logged in.");

  // 1) Load the ticket (and validate)
  const { data: t, error: tErr } = await supabase
    .from("tickets")
    .select("id, user_id, status, quantity_available, current_price")
    .eq("id", ticketId)
    .maybeSingle();
  if (tErr) throw tErr;
  if (!t) throw new Error("Ticket not found.");
  if (t.user_id === buyerId) throw new Error("You can’t buy your own ticket.");
  if (t.status !== "active") throw new Error("Ticket is not active.");
  if ((t.quantity_available ?? 0) < quantity)
    throw new Error("Not enough quantity.");

  const unitPrice = Number(t.current_price ?? 0);
  const total = unitPrice * quantity;
  const key =
    idempotencyKey ??
    (globalThis as any)?.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  // If free (price 0), skip balances entirely
  if (total <= 0) {
    let tx: any;
    {
      const { data, error } = await supabase
        .from("transactions")
        .insert({
          ticket_id: ticketId,
          buyer_id: buyerId,
          seller_id: t.user_id,
          unit_price: unitPrice,
          quantity,
          total_price: total,
          idempotency_key: key,
        })
        .select("*")
        .single();

      // If duplicate click raced here, unique index triggers 23505
      if (error && (error as any).code === "23505") {
        // fetch existing tx and return early
        const existing = await supabase
          .from("transactions")
          .select("*")
          .eq("idempotency_key", key)
          .maybeSingle();
        return existing.data;
      }
      if (error) throw error;
      tx = data;
    }

    const newQty = Number(t.quantity_available ?? 0) - quantity;
    const { error: finalizeErr } = await supabase.rpc(
      "finalize_ticket_after_purchase",
      {
        p_ticket_id: ticketId,
        p_tx_id: tx.id,
        p_new_qty: newQty,
      }
    );
    if (finalizeErr) throw finalizeErr;

    replaceQr(ticketId);

    return tx;
  }

  // 2) Check buyer balance
  const { data: buyerProf, error: bErr } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", buyerId)
    .maybeSingle();
  if (bErr) throw bErr;
  if (!buyerProf) throw new Error("Your profile was not found.");
  const buyerBalance = Number(buyerProf?.balance ?? 0);
  if (buyerBalance < total) throw new Error("Insufficient balance.");

  // 3) Deduct buyer balance
  const { error: dedErr } = await supabase
    .from("profiles")
    .update({ balance: buyerBalance - total })
    .eq("id", buyerId);
  if (dedErr) throw dedErr;

  // 4) Credit seller
  const { error: credErr } = await supabase.rpc("credit_seller_balance", {
    p_seller_id: t.user_id,
    p_amount: total,
  });
  if (credErr) throw credErr;

  // 5) Record the transaction
  let tx: any;
  {
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        ticket_id: ticketId,
        buyer_id: buyerId,
        seller_id: t.user_id,
        unit_price: unitPrice,
        quantity,
        total_price: total,
        idempotency_key: key,
      })
      .select("*")
      .single();

    // If duplicate click raced here, unique index triggers 23505
    if (error && (error as any).code === "23505") {
      // fetch existing tx and return early
      const existing = await supabase
        .from("transactions")
        .select("*")
        .eq("idempotency_key", key)
        .maybeSingle();
      return existing.data;
    }
    if (error) throw error;
    tx = data;
  }

  // 6) Update ticket quantity/status
  const newQty = Number(t.quantity_available ?? 0) - quantity;
  const { error: finalizeErr } = await supabase.rpc(
    "finalize_ticket_after_purchase",
    {
      p_ticket_id: ticketId,
      p_tx_id: tx.id,
      p_new_qty: newQty,
    }
  );
  if (finalizeErr) throw finalizeErr;

  replaceQr(ticketId);

  return tx;
}


async function replaceQr(ticketId: string) {
  const url = "https://qr-replacer.onrender.com/replace_qr";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: 
      {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        {
          ticket_id: ticketId 
        }
      ),
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log("Response:", data);
    return data;
  } 
  catch (error) 
  {
    console.error("Error:", error);
  }
}
