"use client";

import Input from "@/components/global/Input";
import { cities } from "@/lib/constants/registration";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView } from "react-native";
import Select from "react-select";
import "../styles.css";

import { useAddTicketForm, type AddTicketForm } from "@/hooks/useAddTicketForm";
import { Controller } from "react-hook-form";

type Category = { id: string; name: string };

export default function AddTicketPage() {
  const router = useRouter();

  // ---------- RHF ----------
  const {
    control,
    handleSubmit: rhfHandleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useAddTicketForm();

  // ---------- categories (react-select) ----------
  const [loading, setLoading] = useState(false);
  const [fatalError, setFatalError] = useState("");

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

  // ---------- Submit ----------
  const onSubmit = async (data: AddTicketForm) => {
    setFatalError("");
    setLoading(true);
    try {
      // 0) Auth
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) throw new Error("Not authenticated.");
      const userId = userData.user.id;

      // 1) Upload event image (if provided)
      let event_image_url: string | null = null;
      if (data.eventImageFile) {
        const eventImgPath = `${userId}/event_${crypto.randomUUID()}_${
          data.eventImageFile.name
        }`;
        const { error: eventImgErr } = await supabase.storage
          .from("event-images")
          .upload(eventImgPath, data.eventImageFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: data.eventImageFile.type,
          });
        if (eventImgErr) throw new Error(eventImgErr.message);
        const { data: pub } = supabase.storage
          .from("event-images")
          .getPublicUrl(eventImgPath);
        event_image_url = pub.publicUrl;
      }

      // 2) Create event
      const eventInsert = {
        name: data.eventTitle.trim(),
        venue: data.venue.trim(),
        city: data.city.trim(),
        datetime: new Date(data.eventDate).toISOString(), // keep UTC 'Z'
        category_id: data.categoryId,
        created_by: userId,
        image_url: event_image_url,
        status: "pending",
      };

      const { data: eData, error: eErr } = await supabase
        .from("events")
        .insert([eventInsert])
        .select("id, created_by")
        .single();

      console.log("[DEBUG] events insert/select", {
        eData,
        eErr,
        userId,
        eventInsert,
      });

      if (eErr) {
        setFatalError(`events insert/select failed: ${eErr.message}`);
        setLoading(false);
        return;
      }

      const eventId = eData!.id as string;

      // 3) Upload ticket barcode PDF
      let barcode_url: string | null = null;
      if (data.ticketPdf) {
        const path = `${userId}/${crypto.randomUUID()}_${data.ticketPdf.name}`;
        const { error: upErr } = await supabase.storage
          .from("event-tickets")
          .upload(path, data.ticketPdf, {
            cacheControl: "3600",
            upsert: false,
            contentType: data.ticketPdf.type,
          });
        if (upErr) throw new Error(upErr.message);
        const { data: pub } = supabase.storage
          .from("event-tickets")
          .getPublicUrl(path);
        barcode_url = pub.publicUrl;
      }

      // 4) Seat numbers CSV -> array
      const seatNumbersArray =
        data.seatNumbersCsv
          ?.split(",")
          .map((s) => s.trim())
          .filter(Boolean) || [];

      // 5) Insert ticket
      const ticketInsert = {
        user_id: userId,
        event_id: eventId,
        original_price: data.price,
        current_price: data.price,
        quantity_total: data.quantity,
        quantity_available: data.quantity,
        area_type: data.areaType.trim(),
        is_seated: !!data.isSeated,
        section: data.section || null,
        row: data.row || null,
        seat_numbers: seatNumbersArray.length ? seatNumbersArray : null,
        status: "active",
        barcode_url: barcode_url ?? "",
        transaction_id: null,
        sold_at: null,
        description: data.description?.trim() || null,
      };

      const { error: tErr } = await supabase
        .from("tickets")
        .insert([ticketInsert]);

      console.log("[DEBUG] tickets insert", { tErr, userId, ticketInsert });

      if (tErr) {
        setFatalError(`tickets insert failed: ${tErr.message}`);
        setLoading(false);
        return;
      }

      router.replace("/");
    } catch (err: any) {
      setFatalError(err.message || "Unable to add ticket.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Render ----------
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <div className="form-container">
        <h1 className="form-title">Add a Ticket</h1>

        <form onSubmit={rhfHandleSubmit(onSubmit)}>
          {/* EVENT SECTION */}
          <h3 style={{ marginTop: 8, marginBottom: 6 }}>Event Details</h3>

          {/* Event title */}
          <Controller
            control={control}
            name="eventTitle"
            render={({ field }) => (
              <>
                <Input
                  placeholder="Event Name"
                  value={field.value}
                  onChange={(e: any) => field.onChange(e.target?.value ?? e)}
                  className="form-input"
                />
                {errors.eventTitle && (
                  <div className="form-error">{errors.eventTitle.message}</div>
                )}
              </>
            )}
          />

          {/* Venue + City */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Controller
              control={control}
              name="venue"
              render={({ field }) => (
                <>
                  <Input
                    placeholder="Venue"
                    value={field.value}
                    onChange={(e: any) => field.onChange(e.target?.value ?? e)}
                    className="form-input"
                  />
                  {errors.venue && (
                    <div className="form-error">{errors.venue.message}</div>
                  )}
                </>
              )}
            />

            <Controller
              control={control}
              name="city"
              render={({ field }) => (
                <div className="form-group">
                  <Select
                    options={cities.map((c) => ({ label: c, value: c }))}
                    placeholder="City"
                    onChange={(opt) => field.onChange(opt?.value || "")}
                    value={
                      field.value
                        ? { label: field.value, value: field.value }
                        : null
                    }
                    isSearchable
                  />
                  {errors.city && (
                    <div className="form-error">{errors.city.message}</div>
                  )}
                </div>
              )}
            />
          </div>

          {/* Date + Category */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Controller
              control={control}
              name="eventDate"
              render={({ field }) => (
                <>
                  <Input
                    type="datetime-local"
                    value={field.value}
                    onChange={(e: any) => field.onChange(e.target?.value ?? e)}
                    className="form-input"
                  />
                  {errors.eventDate && (
                    <div className="form-error">{errors.eventDate.message}</div>
                  )}
                </>
              )}
            />
            <Controller
              control={control}
              name="categoryId"
              render={({ field }) => (
                <div className="form-group">
                  <Select
                    options={categoryOptions}
                    placeholder="Category"
                    onChange={(opt) => field.onChange(opt?.value || "")}
                    value={
                      field.value
                        ? categoryOptions.find(
                            (o) => o.value === field.value
                          ) || null
                        : null
                    }
                    isSearchable
                  />
                  {errors.categoryId && (
                    <div className="form-error">
                      {errors.categoryId.message}
                    </div>
                  )}
                </div>
              )}
            />
          </div>

          {/* Event Image */}
          <label className="form-label" style={{ marginTop: 8 }}>
            Event Image (PNG/JPG/WEBP)
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setValue("eventImageFile", f, { shouldValidate: true });
              }}
              style={{ display: "block", width: "100%", marginTop: 6 }}
            />
          </label>
          {errors.eventImageFile && (
            <div className="form-error">{errors.eventImageFile.message}</div>
          )}

          {/* TICKET SECTION */}
          <h3 style={{ marginTop: 18, marginBottom: 6 }}>Ticket Details</h3>

          {/* Price + Quantity */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Controller
              control={control}
              name="price"
              render={({ field }) => (
                <>
                  <Input
                    type="number"
                    placeholder="Original Price (₪)"
                    value={field.value as any}
                    onChange={(e: any) => field.onChange(e.target?.value ?? e)}
                    className="form-input"
                  />
                  {errors.price && (
                    <div className="form-error">{errors.price.message}</div>
                  )}
                </>
              )}
            />
            <Controller
              control={control}
              name="quantity"
              render={({ field }) => (
                <>
                  <Input
                    type="number"
                    placeholder="Total Quantity"
                    value={field.value as any}
                    onChange={(e: any) => field.onChange(e.target?.value ?? e)}
                    className="form-input"
                  />
                  {errors.quantity && (
                    <div className="form-error">{errors.quantity.message}</div>
                  )}
                </>
              )}
            />
          </div>

          {/* Area type */}
          <Controller
            control={control}
            name="areaType"
            render={({ field }) => (
              <>
                <Input
                  placeholder="Area Type (e.g., Floor, VIP)"
                  value={field.value}
                  onChange={(e: any) => field.onChange(e.target?.value ?? e)}
                  className="form-input"
                />
                {errors.areaType && (
                  <div className="form-error">{errors.areaType.message}</div>
                )}
              </>
            )}
          />

          {/* Section / Row / SeatNumbers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12,
            }}
          >
            <Controller
              control={control}
              name="section"
              render={({ field }) => (
                <Input
                  placeholder="Section (optional)"
                  value={field.value ?? ""}
                  onChange={(e: any) => field.onChange(e.target?.value ?? e)}
                  className="form-input"
                />
              )}
            />
            <Controller
              control={control}
              name="row"
              render={({ field }) => (
                <Input
                  placeholder="Row (optional)"
                  value={field.value ?? ""}
                  onChange={(e: any) => field.onChange(e.target?.value ?? e)}
                  className="form-input"
                />
              )}
            />
            <Controller
              control={control}
              name="seatNumbersCsv"
              render={({ field }) => (
                <Input
                  placeholder="Seat Numbers (comma separated)"
                  value={field.value ?? ""}
                  onChange={(e: any) => field.onChange(e.target?.value ?? e)}
                  className="form-input"
                />
              )}
            />
          </div>

          {/* Is Seated */}
          <Controller
            control={control}
            name="isSeated"
            render={({ field }) => (
              <label className="form-label" style={{ marginTop: 8 }}>
                Is Seated?
                <input
                  type="checkbox"
                  checked={!!field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  style={{ marginLeft: 8 }}
                />
              </label>
            )}
          />

          {/* Barcode PDF (required) */}
          <label className="form-label" style={{ marginTop: 8 }}>
            Upload Ticket (PDF only)
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setValue("ticketPdf", f, { shouldValidate: true });
              }}
              style={{ display: "block", width: "100%", marginTop: 6 }}
            />
          </label>
          {errors.ticketPdf && (
            <div className="form-error">{errors.ticketPdf.message}</div>
          )}
          {watch("ticketPdf") && (
            <div style={{ marginTop: 4 }}>{watch("ticketPdf")?.name}</div>
          )}

          {/* Description */}
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <>
                <label className="form-label" style={{ marginTop: 8 }}>
                  Description (optional)
                </label>
                <textarea
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  style={{ width: "100%", minHeight: 80, marginBottom: 12 }}
                />
                {errors.description && (
                  <div className="form-error">{errors.description.message}</div>
                )}
              </>
            )}
          />

          {fatalError && <p className="form-error">{fatalError}</p>}

          <button
            type="submit"
            className="form-button"
            disabled={loading || isSubmitting}
          >
            {loading || isSubmitting ? "Adding Ticket..." : "Add Ticket"}
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
