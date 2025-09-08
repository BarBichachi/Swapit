"use client";

import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { EventForm, UnitForm } from "@/types/forms";
import { useIsFocused } from "@react-navigation/native";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView } from "react-native";

// Resolve defaults once per runtime
const DEFAULTS = (() => {
  const eventImg = supabase.storage
    .from("event-images")
    .getPublicUrl("defaults/default-event.png").data.publicUrl;

  const ticketPdf = supabase.storage
    .from("ticket-pdfs")
    .getPublicUrl("defaults/default-ticket.pdf").data.publicUrl;

  return {
    EVENT_IMAGE_URL: eventImg,
    TICKET_PDF_URL: ticketPdf,
  };
})();

export default function AddTicketPage() {
  // ============================================================
  // ROUTER + AUTH STATE (declare hooks FIRST, no early returns)
  // ============================================================
  const router = useRouter();
  const pathname = usePathname();
  const isFocused = useIsFocused();
  const {
    currentUser,
    loading: authLoading,
    waitForSignedIn,
  } = useAuthContext();
  const [redirectingOut, setRedirectingOut] = useState(false);

  // ============================================================
  // EVENT FORM STATE
  // ============================================================
  const [eventForm, setEventForm] = useState<EventForm>({
    name: "",
    venue: "",
    city: "",
    datetime: "",
    imageFile: undefined,
  });

  // ============================================================
  // TICKET UNITS STATE (quantity + per-unit forms)
  // ============================================================
  const [quantity, setQuantity] = useState<number>(1);
  const [units, setUnits] = useState<UnitForm[]>([
    {
      is_seated: false,
      area_type: "",
      section: "",
      row: "",
      seat_number: "",
      original_price: "",
      file: undefined,
    },
  ]);

  // ============================================================
  // VALIDATION + UI STATE
  // ============================================================
  const [error, setError] = useState("");
  const [emptyFields, setEmptyFields] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  // ============================================================
  // AUTH GUARD EFFECT (runs once; no early return above)
  // ============================================================
  useEffect(() => {
    if (!isFocused) return; // wait for focus
    if (authLoading) return; // wait for provider bootstrap
    if (!currentUser.isLoggedIn) {
      // redirect guests to login and stop rendering this page
      setRedirectingOut(true);
      router.replace({
        pathname: "/(auth)/login",
        params: { redirect: pathname, source: "guard" },
      } as any);
      return;
    }
    // logged in - ensure flag is cleared (in case we returned from /login without unmount)
    setRedirectingOut(false);
  }, [isFocused, authLoading, currentUser.isLoggedIn, pathname, router]);

  // ============================================================
  // HANDLERS: quantity & unit updates
  // ============================================================
  const handleQuantityChange = (q: number) => {
    setQuantity(q);
    setUnits((prev) => {
      const next = [...prev];
      if (q > prev.length) {
        for (let i = prev.length; i < q; i++) {
          next.push({
            is_seated: false,
            area_type: "",
            section: "",
            row: "",
            seat_number: "",
            original_price: "",
            file: undefined,
          });
        }
      } else if (q < prev.length) {
        next.length = q;
      }
      return next;
    });
  };

  const updateUnit = (idx: number, patch: Partial<UnitForm>) => {
    setUnits((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      if (patch.is_seated === false) {
        next[idx].section = "";
        next[idx].row = "";
        next[idx].seat_number = "";
      }
      return next;
    });
  };

  // ============================================================
  // VALIDATION
  // ============================================================
  const markEmpty = (name: string) =>
    setEmptyFields((prev) => new Set(prev).add(name));

  const validate = (): string => {
    let msg = "";

    // Event
    if (!eventForm.name) {
      msg ||= "Event: name is required.";
      markEmpty("event_name");
    }
    if (!eventForm.venue) {
      msg ||= "Event: venue is required.";
      markEmpty("event_venue");
    }
    if (!eventForm.city) {
      msg ||= "Event: city is required.";
      markEmpty("event_city");
    }
    if (!eventForm.datetime) {
      msg ||= "Event: date & time are required.";
      markEmpty("event_datetime");
    }

    // Units
    const seenSeats = new Set<string>();
    units.forEach((u, i) => {
      const idx = i + 1;
      if (!u.area_type) {
        msg ||= `Ticket #${idx}: area type is required.`;
        markEmpty(`unit_${i}_area_type`);
      }
      if (u.is_seated) {
        if (!u.section) {
          msg ||= `Ticket #${idx}: section is required.`;
          markEmpty(`unit_${i}_section`);
        }
        if (!u.row) {
          msg ||= `Ticket #${idx}: row is required.`;
          markEmpty(`unit_${i}_row`);
        }
        if (!u.seat_number) {
          msg ||= `Ticket #${idx}: seat number is required.`;
          markEmpty(`unit_${i}_seat`);
        }
        const key = `${u.section}__${u.row}__${u.seat_number}`.toLowerCase();
        if (u.section && u.row && u.seat_number) {
          if (seenSeats.has(key)) {
            msg ||= `Duplicate seat: Ticket #${idx} repeats a previous Section/Row/Seat.`;
          } else {
            seenSeats.add(key);
          }
        }
      }
      if (!u.original_price || isNaN(Number(u.original_price))) {
        msg ||= `Ticket #${idx}: original price must be a number.`;
        markEmpty(`unit_${i}_op`);
      }
    });

    return msg;
  };

  // ============================================================
  // SUBMIT: create event → listing → units (+uploads)
  // ============================================================
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setError("");
    setEmptyFields(new Set());

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setSubmitting(true);
    try {
      // Re-check auth defensively
      const { data: ures } = await supabase.auth.getUser();
      const uid = ures?.user?.id;
      if (!uid) throw new Error("Not logged in.");

      // 1) Upsert/find "General" category
      const { data: catRow, error: catErr } = await supabase
        .from("event_categories")
        .upsert([{ name: "General" }], { onConflict: "name" })
        .select("id")
        .single();
      if (catErr) throw catErr;
      const categoryId = catRow!.id as string;

      // 2) Insert Event (no image first)
      const { data: evt, error: evtErr } = await supabase
        .from("events")
        .insert([
          {
            name: eventForm.name,
            venue: eventForm.venue,
            city: eventForm.city,
            datetime: new Date(eventForm.datetime).toISOString(),
            status: "active",
            category_id: categoryId,
            created_by: uid,
          },
        ])
        .select("id")
        .single();
      if (evtErr) throw evtErr;
      const eventId = evt!.id as string;

      // 3) Event image upload to 'event-images' + patch image_url
      if (eventForm.imageFile) {
        const imgExt = (
          eventForm.imageFile.name.split(".").pop() || "jpg"
        ).toLowerCase();
        const imgPath = `${uid}/${eventId}/cover.${imgExt}`;
        const { error: upImgErr } = await supabase.storage
          .from("event-images")
          .upload(imgPath, eventForm.imageFile, { upsert: true });
        if (upImgErr) throw upImgErr;

        const { data: pub } = supabase.storage
          .from("event-images")
          .getPublicUrl(imgPath);
        const image_url = pub.publicUrl;

        const { error: patchErr } = await supabase
          .from("events")
          .update({ image_url })
          .eq("id", eventId);
        if (patchErr) throw patchErr;
      } else {
        // default placeholder
        const { error: patchDefaultErr } = await supabase
          .from("events")
          .update({ image_url: DEFAULTS.EVENT_IMAGE_URL })
          .eq("id", eventId);
        if (patchDefaultErr) throw patchDefaultErr;
      }

      // 4) Insert Listing (tickets)
      const { data: tRow, error: tErr } = await supabase
        .from("tickets")
        .insert([{ user_id: uid, event_id: eventId, status: "active" }])
        .select("id")
        .single();
      if (tErr) throw tErr;
      const ticketId = tRow!.id as string;

      // 5) Upload PDFs to 'ticket-pdfs' + insert ticket_units
      const now = Date.now();
      const payload: any[] = [];

      for (let i = 0; i < units.length; i++) {
        const u = units[i];

        let ticket_pdf_url = DEFAULTS.TICKET_PDF_URL; // default if none provided

        // PDF upload
        if (u.file) {
          const ext = (u.file.name?.split(".").pop() || "pdf").toLowerCase();
          const pdfPath = `${uid}/${eventId}/${ticketId}/${now}-${
            i + 1
          }.${ext}`;
          const { error: upPdfErr } = await supabase.storage
            .from("ticket-pdfs")
            .upload(pdfPath, u.file, { upsert: false });
          if (upPdfErr) throw upPdfErr;

          const { data: pubPdf } = supabase.storage
            .from("ticket-pdfs")
            .getPublicUrl(pdfPath);
          ticket_pdf_url = pubPdf.publicUrl;
        }

        // Build unit row
        payload.push({
          ticket_id: ticketId,
          event_id: eventId,
          owner_user_id: uid,
          is_seated: u.is_seated,
          area_type: u.area_type,
          section: u.is_seated ? u.section : null,
          row: u.is_seated ? u.row : null,
          seat_number: u.is_seated ? u.seat_number : null,
          ticket_pdf_url,
          original_price: Number(u.original_price),
          current_price: Number(u.original_price),
          status: "active",
        });
      }

      const { error: insUnitsErr } = await supabase
        .from("ticket_units")
        .insert(payload);
      if (insUnitsErr) throw insUnitsErr;

      router.push({ pathname: "/", params: { refresh: "tickets" } } as any);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to add tickets.");
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // RENDER (matches Login form classes)
  // ============================================================
  if (authLoading) {
    return (
      <div className="form-container">
        <h1 className="form-title">Loading…</h1>
      </div>
    );
  }

  // If we're actively redirecting to /login, don't render the page UI.
  if (redirectingOut) return null;

  return (
    <ScrollView>
      <div className="form-container">
        {/* Title */}
        <h1 className="form-title">Add a Ticket</h1>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <h2 className="form-title">Event Details</h2>
          <hr />
          {/* --- Event Details --- */}
          <div className="form-group">
            <label className="form-label">Event Name</label>
            <input
              className={
                emptyFields.has("event_name")
                  ? "form-input-error"
                  : "form-input"
              }
              value={eventForm.name}
              onChange={(e) =>
                setEventForm({ ...eventForm, name: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">Venue</label>
            <input
              className={
                emptyFields.has("event_venue")
                  ? "form-input-error"
                  : "form-input"
              }
              value={eventForm.venue}
              onChange={(e) =>
                setEventForm({ ...eventForm, venue: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">City</label>
            <input
              className={
                emptyFields.has("event_city")
                  ? "form-input-error"
                  : "form-input"
              }
              value={eventForm.city}
              onChange={(e) =>
                setEventForm({ ...eventForm, city: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">Date &amp; Time</label>
            <input
              type="datetime-local"
              className={
                emptyFields.has("event_datetime")
                  ? "form-input-error"
                  : "form-input"
              }
              value={eventForm.datetime}
              onChange={(e) =>
                setEventForm({ ...eventForm, datetime: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">Event Image</label>
            <input
              type="file"
              accept="image/*"
              className={
                emptyFields.has("event_image")
                  ? "form-input-error"
                  : "form-input"
              }
              onChange={(e) =>
                setEventForm({ ...eventForm, imageFile: e.target.files?.[0] })
              }
            />
          </div>

          {/* --- Separator --- */}
          <h2 className="form-title">Ticket Details</h2>
          <hr />

          {/* --- Ticket Details --- */}
          <div className="form-group">
            <label className="form-label">Quantity</label>
            <select
              className="form-input"
              value={quantity}
              onChange={(e) => handleQuantityChange(Number(e.target.value))}
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>

          {units.map((u, idx) => (
            <div key={idx}>
              {idx > 0 && <hr />}
              <h3 className="form-title">Ticket #{idx + 1}</h3>
              <div className="form-group">
                <label className="form-label form-label--center">
                  Is Seated?
                </label>
                <input
                  type="checkbox"
                  className="form-input"
                  checked={u.is_seated}
                  onChange={(e) =>
                    updateUnit(idx, { is_seated: e.target.checked })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Area Type</label>
                <input
                  className={
                    emptyFields.has(`unit_${idx}_area_type`)
                      ? "form-input-error"
                      : "form-input"
                  }
                  value={u.area_type}
                  onChange={(e) =>
                    updateUnit(idx, { area_type: e.target.value })
                  }
                />
              </div>

              {u.is_seated && (
                <>
                  <div className="form-group">
                    <label className="form-label">Section</label>
                    <input
                      className={
                        emptyFields.has(`unit_${idx}_section`)
                          ? "form-input-error"
                          : "form-input"
                      }
                      value={u.section || ""}
                      onChange={(e) =>
                        updateUnit(idx, { section: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Row</label>
                    <input
                      className={
                        emptyFields.has(`unit_${idx}_row`)
                          ? "form-input-error"
                          : "form-input"
                      }
                      value={u.row || ""}
                      onChange={(e) => updateUnit(idx, { row: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Seat Number</label>
                    <input
                      className={
                        emptyFields.has(`unit_${idx}_seat`)
                          ? "form-input-error"
                          : "form-input"
                      }
                      value={u.seat_number || ""}
                      onChange={(e) =>
                        updateUnit(idx, { seat_number: e.target.value })
                      }
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label className="form-label">Price</label>
                <input
                  inputMode="decimal"
                  className={
                    emptyFields.has(`unit_${idx}_op`)
                      ? "form-input-error"
                      : "form-input"
                  }
                  value={u.original_price}
                  onChange={(e) =>
                    updateUnit(idx, { original_price: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ticket PDF</label>
                <input
                  type="file"
                  accept="application/pdf"
                  className={
                    emptyFields.has(`unit_${idx}_pdf`)
                      ? "form-input-error"
                      : "form-input"
                  }
                  onChange={(e) =>
                    updateUnit(idx, { file: e.target.files?.[0] })
                  }
                />
              </div>
            </div>
          ))}

          {/* Error */}
          {error && <p className="form-error">{error}</p>}

          {/* Submit */}
          <button type="submit" className="form-button" disabled={submitting}>
            {submitting ? "Saving…" : "Create Listing"}
          </button>
        </form>
      </div>
    </ScrollView>
  );
}
