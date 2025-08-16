// app/tickets/add-ticket.tsx
"use client";

import Input from "@/components/global/Input";
import { cities } from "@/lib/constants/registration";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView } from "react-native";
import Select from "react-select";
import "../styles.css";

type Category = { id: string; name: string };

export default function AddTicketPage() {
  const router = useRouter();

  // -------- form state (mirrors signup.tsx style) --------
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emptyFields, setEmptyFields] = useState<Set<string>>(new Set());

  // Event fields
  const [eventForm, setEventForm] = useState({
    name: "",
    venue: "",
    city: "",
    datetime: "", // HTML datetime-local
    categoryId: "",
    imageUrl: "", // optional static URL for now
  });

  // Ticket fields
  const [ticketForm, setTicketForm] = useState({
    originalPrice: "",
    quantityTotal: "1",
    areaType: "",
    isSeated: false,
    section: "",
    row: "",
    seatNumbers: "" as string, // comma-separated, will split -> string[]
    description: "",
  });

  const [barcodeFile, setBarcodeFile] = useState<File | null>(null);
  const [eventImageFile, setEventImageFile] = useState<File | null>(null);

  // -------- categories (react-select) --------
  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("event_categories")
        .select("id,name")
        .order("name", { ascending: true });
      if (!error && data) setCategories(data as Category[]);
    })();
  }, []);

  const categoryOptions = useMemo(
    () => categories.map((c) => ({ value: c.id, label: c.name })),
    [categories]
  );

  // -------- helpers --------
  const markMissing = (keys: string[]) => {
    const s = new Set<string>(keys);
    setEmptyFields(s);
    return s;
  };

  const clearFieldError = (name: string) =>
    setEmptyFields((prev) => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });

  // -------- submit --------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Required checks (both event + ticket)
    const required: string[] = [];
    const eF = eventForm;
    const tF = ticketForm;

    if (!eF.name.trim()) required.push("event.name");
    if (!eF.venue.trim()) required.push("event.venue");
    if (!eF.city.trim()) required.push("event.city");
    if (!eF.datetime.trim()) required.push("event.datetime");
    if (!eF.categoryId.trim()) required.push("event.categoryId");

    if (!tF.originalPrice.trim()) required.push("ticket.originalPrice");
    if (!tF.quantityTotal.trim()) required.push("ticket.quantityTotal");
    if (!tF.areaType.trim()) required.push("ticket.areaType");

    if (required.length) {
      markMissing(required);
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    try {
      // Get current user (profiles.id == auth.user.id)
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) throw new Error("Not authenticated.");
      const userId = userData.user.id;

      // 1) Create event
      const eventInsert = {
        name: eF.name.trim(),
        venue: eF.venue.trim(),
        city: eF.city.trim(),
        // convert datetime-local to timestamp string
        datetime: new Date(eF.datetime).toISOString().replace("Z", ""),
        category_id: eF.categoryId,
        created_by: userId,
        image_url: eF.imageUrl?.trim() || null,
        status: "pending",
      };

      const { data: eventRes, error: eventErr } = await supabase
        .from("events")
        .insert([eventInsert])
        .select("id")
        .single();

      if (eventErr || !eventRes?.id)
        throw new Error(eventErr?.message || "Failed creating event.");

      const eventId = eventRes.id as string;

      // 2) Upload barcode (optional)
      let barcode_url: string | null = null;
      if (barcodeFile) {
        const path = `${userId}/${crypto.randomUUID()}_${barcodeFile.name}`;
        const { error: upErr } = await supabase.storage
          .from("barcodes")
          .upload(path, barcodeFile, {
            cacheControl: "3600",
            upsert: false,
          });
        if (upErr) throw new Error(upErr.message);

        const { data: pub } = supabase.storage
          .from("barcodes")
          .getPublicUrl(path);
        barcode_url = pub.publicUrl;
      }

      // 3) Insert ticket
      const seatNumbersArray =
        tF.seatNumbers
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean) || [];

      const ticketInsert = {
        user_id: userId,
        event_id: eventId,
        original_price: Number(tF.originalPrice),
        quantity_total: Number(tF.quantityTotal),
        area_type: tF.areaType.trim(),
        is_seated: !!tF.isSeated,
        section: tF.section?.trim() || null,
        row: tF.row?.trim() || null,
        seat_numbers: seatNumbersArray.length ? seatNumbersArray : null,
        status: "active",
        barcode_url: barcode_url ?? "", // schema says NOT NULL; require upload later if you prefer
        transaction_id: null,
        sold_at: null,
        description: tF.description?.trim() || null,
      };

      const { error: ticketErr } = await supabase
        .from("tickets")
        .insert([ticketInsert]);
      if (ticketErr) throw new Error(ticketErr.message);

      // Done
      router.replace("/");
    } catch (err: any) {
      setError(err.message || "Unable to add ticket.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <div className="form-container">
        <h1 className="form-title">Add a Ticket</h1>

        <form onSubmit={handleSubmit}>
          {/* EVENT SECTION */}
          <h3 style={{ marginTop: 8, marginBottom: 6 }}>Event Details</h3>

          <Input
            name="event.name"
            placeholder="Event Name"
            value={eventForm.name}
            onChange={(e: any) => {
              setEventForm({ ...eventForm, name: e.target.value });
              clearFieldError("event.name");
            }}
            className={`form-input ${
              emptyFields.has("event.name") ? "form-input-error" : ""
            }`}
          />
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Input
              name="event.venue"
              placeholder="Venue"
              value={eventForm.venue}
              onChange={(e: any) => {
                setEventForm({ ...eventForm, venue: e.target.value });
                clearFieldError("event.venue");
              }}
              className={`form-input ${
                emptyFields.has("event.venue") ? "form-input-error" : ""
              }`}
            />
            <div className="form-group">
              <Select
                options={cities.map((c) => ({ label: c, value: c }))}
                placeholder="City"
                onChange={(opt) => {
                  setEventForm({ ...eventForm, city: opt?.value || "" });
                  clearFieldError("event.city");
                }}
                value={
                  eventForm.city
                    ? { label: eventForm.city, value: eventForm.city }
                    : null
                }
                isSearchable
              />
              {emptyFields.has("event.city") && (
                <div className="form-error">City is required</div>
              )}
            </div>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Input
              name="event.datetime"
              type="datetime-local"
              value={eventForm.datetime}
              onChange={(e: any) => {
                setEventForm({ ...eventForm, datetime: e.target.value });
                clearFieldError("event.datetime");
              }}
              className={`form-input ${
                emptyFields.has("event.datetime") ? "form-input-error" : ""
              }`}
            />
            <div className="form-group">
              <Select
                options={categoryOptions}
                placeholder="Category"
                onChange={(opt) => {
                  setEventForm({ ...eventForm, categoryId: opt?.value || "" });
                  clearFieldError("event.categoryId");
                }}
                value={
                  eventForm.categoryId
                    ? categoryOptions.find(
                        (o) => o.value === eventForm.categoryId
                      ) || null
                    : null
                }
                isSearchable
              />
              {emptyFields.has("event.categoryId") && (
                <div className="form-error">Category is required</div>
              )}
            </div>
          </div>

          <label className="form-label" style={{ marginTop: 8 }}>
            Event Image (PNG/JPG)
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setEventImageFile(e.target.files?.[0] ?? null)}
              style={{ display: "block", width: "100%", marginTop: 6 }}
            />
          </label>

          {/* TICKET SECTION */}
          <h3 style={{ marginTop: 18, marginBottom: 6 }}>Ticket Details</h3>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Input
              name="ticket.originalPrice"
              type="number"
              placeholder="Original Price (₪)"
              value={ticketForm.originalPrice}
              onChange={(e: any) => {
                setTicketForm({ ...ticketForm, originalPrice: e.target.value });
                clearFieldError("ticket.originalPrice");
              }}
              className={`form-input ${
                emptyFields.has("ticket.originalPrice")
                  ? "form-input-error"
                  : ""
              }`}
            />
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Input
              name="ticket.quantityTotal"
              type="number"
              placeholder="Total Quantity"
              value={ticketForm.quantityTotal}
              onChange={(e: any) => {
                setTicketForm({ ...ticketForm, quantityTotal: e.target.value });
                clearFieldError("ticket.quantityTotal");
              }}
              className={`form-input ${
                emptyFields.has("ticket.quantityTotal")
                  ? "form-input-error"
                  : ""
              }`}
            />
          </div>

          <Input
            name="ticket.areaType"
            placeholder="Area Type (e.g., Floor, Stand, VIP)"
            value={ticketForm.areaType}
            onChange={(e: any) => {
              setTicketForm({ ...ticketForm, areaType: e.target.value });
              clearFieldError("ticket.areaType");
            }}
            className={`form-input ${
              emptyFields.has("ticket.areaType") ? "form-input-error" : ""
            }`}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12,
            }}
          >
            <Input
              name="ticket.section"
              placeholder="Section (optional)"
              value={ticketForm.section}
              onChange={(e: any) =>
                setTicketForm({ ...ticketForm, section: e.target.value })
              }
              className="form-input"
            />
            <Input
              name="ticket.row"
              placeholder="Row (optional)"
              value={ticketForm.row}
              onChange={(e: any) =>
                setTicketForm({ ...ticketForm, row: e.target.value })
              }
              className="form-input"
            />
            <Input
              name="ticket.seatNumbers"
              placeholder="Seat Numbers (comma separated)"
              value={ticketForm.seatNumbers}
              onChange={(e: any) =>
                setTicketForm({ ...ticketForm, seatNumbers: e.target.value })
              }
              className="form-input"
            />
          </div>

          <label className="form-label" style={{ marginTop: 8 }}>
            Is Seated?
            <input
              type="checkbox"
              checked={ticketForm.isSeated}
              onChange={(e) =>
                setTicketForm({ ...ticketForm, isSeated: e.target.checked })
              }
            />
          </label>

          <label className="form-label" style={{ marginTop: 8 }}>
            Upload Barcode (PDF/Image)
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setBarcodeFile(e.target.files?.[0] ?? null)}
              style={{ display: "block", width: "100%", marginTop: 6 }}
            />
          </label>

          <label className="form-label" style={{ marginTop: 8 }}>
            Description (optional)
          </label>
          <textarea
            value={ticketForm.description}
            onChange={(e) =>
              setTicketForm({ ...ticketForm, description: e.target.value })
            }
            style={{ width: "100%", minHeight: 80, marginBottom: 12 }}
          />

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="form-button" disabled={loading}>
            {loading ? "Adding Ticket..." : "Add Ticket"}
          </button>

          <div style={{ height: 16 }} />
          <button type="button" onClick={() => router.back()}>
            Cancel
          </button>
        </form>
      </div>
    </ScrollView>
  );
}
