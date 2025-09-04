import { supabase } from "@/lib/supabase";

export async function purchaseTicketNaive(
  ticketUnitId: string,
  quantity = 1,
  idempotencyKey?: string,
  buyerId?: string
) {
  // 1. בדיקות תקינות
  const { data: unit, error: unitErr } = await supabase
    .from("ticket_units")
    .select("id, ticket_id, owner_user_id, status, current_price")
    .eq("id", ticketUnitId)
    .maybeSingle();

  if (unitErr) throw unitErr;
  if (!unit) throw new Error("Ticket unit not found.");
  if (unit.owner_user_id === buyerId)
    throw new Error("You can’t buy your own ticket.");
  if (unit.status !== "active") throw new Error("Ticket is not active.");

  const unitPrice = Number(unit.current_price ?? 0);
  const total = unitPrice * quantity;
  const key =
    idempotencyKey ??
    (globalThis as any)?.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  // 2. בדיקת יתרה
  const { data: buyerProf, error: bErr } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", buyerId)
    .maybeSingle();

  if (bErr) throw bErr;
  if (!buyerProf) throw new Error("Your profile was not found.");
  const buyerBalance = Number(buyerProf?.balance ?? 0);
  if (buyerBalance < total) throw new Error("Insufficient balance.");

  // 3. ביצוע העברת כספים ורישום טרנזקציה
  // Deduct buyer balance
  const { error: dedErr } = await supabase
    .from("profiles")
    .update({ balance: buyerBalance - total })
    .eq("id", buyerId);
  if (dedErr) throw dedErr;

  // Credit seller
  const { error: credErr } = await supabase.rpc("credit_seller_balance", {
    p_seller_id: unit.owner_user_id,
    p_amount: total,
  });
  if (credErr) throw credErr;

  // Record the transaction
  let tx: any;
  {
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        ticket_id: unit.id,
        buyer_id: buyerId,
        seller_id: unit.owner_user_id,
        unit_price: unitPrice,
        quantity,
        total_price: total,
        idempotency_key: key,
      })
      .select("*")
      .single();

    if (error && (error as any).code === "23505") {
      const existing = await supabase
        .from("transactions")
        .select("*")
        .eq("idempotency_key", key)
        .maybeSingle();
      tx = existing.data;
    } else {
      if (error) throw error;
      tx = data;
    }
  }

  // עדכון סטטוס ל-sold ועדכון transaction_id לאחר רכישה
  await supabase
    .from("ticket_units")
    .update({ status: "sold", transaction_id: tx.id })
    .eq("id", ticketUnitId);

  replaceQr(ticketUnitId);
  return tx;
}

async function replaceQr(ticketId: string) {
  const url = "https://qr-replacer.onrender.com/replace_qr";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ticket_id: ticketId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log("Response:", data);
    return data;
  } catch (error) {
    console.error("Error:", error);
  }
}
