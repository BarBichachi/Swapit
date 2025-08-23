import { supabase } from "@/lib/supabase";

export async function purchaseTicketNaive(ticketId: string, quantity = 1) {
  // 0) Require auth
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user) throw new Error("You must be logged in.");

  // 1) Load the ticket (and validate)
  const { data: t, error: tErr } = await supabase
    .from("tickets")
    .select("id, user_id, status, quantity_available, current_price")
    .eq("id", ticketId)
    .maybeSingle();
  if (tErr) throw tErr;
  if (!t) throw new Error("Ticket not found.");
  if (t.user_id === user.id) throw new Error("You can’t buy your own ticket.");
  if (t.status !== "active") throw new Error("Ticket is not active.");
  if ((t.quantity_available ?? 0) < quantity)
    throw new Error("Not enough quantity.");

  const unitPrice = Number(t.current_price ?? 0);
  const total = unitPrice * quantity;

  // 2) Check buyer balance
  const { data: buyerProf, error: bErr } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", user.id)
    .single();
  if (bErr) throw bErr;
  const buyerBalance = Number(buyerProf?.balance ?? 0);
  if (buyerBalance < total) throw new Error("Insufficient balance.");

  // 3) Deduct buyer balance
  const newBuyerBal = buyerBalance - total;
  const { error: dedErr } = await supabase
    .from("profiles")
    .update({ balance: newBuyerBal })
    .eq("id", user.id);
  if (dedErr) throw dedErr;

  // 4) Credit seller
  const { data: sellerProf, error: sErr } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", t.user_id)
    .single();
  if (sErr) throw sErr;
  const sellerBalance = Number(sellerProf?.balance ?? 0);
  const { error: credErr } = await supabase
    .from("profiles")
    .update({ balance: sellerBalance + total })
    .eq("id", t.user_id);
  if (credErr) throw credErr;

  // 5) Update ticket quantity/status
  const newQty = Number(t.quantity_available ?? 0) - quantity;
  const { error: tickErr } = await supabase
    .from("tickets")
    .update({
      quantity_available: newQty,
      status: newQty <= 0 ? "sold" : "active",
    })
    .eq("id", ticketId);
  if (tickErr) throw tickErr;

  // 6) Record the transaction
  const { data: tx, error: txErr } = await supabase
    .from("transactions")
    .insert({
      ticket_id: ticketId,
      buyer_id: user.id,
      seller_id: t.user_id,
      unit_price: unitPrice,
      quantity,
      total_price: total,
    })
    .select("*")
    .single();
  if (txErr) throw txErr;

  return tx;
}
