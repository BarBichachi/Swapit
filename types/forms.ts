/**
 * EventForm: used by the Event Details section on Add Ticket page.
 * `datetime` is bound to an <input type="datetime-local"> value.
 * `imageFile` is an optional event cover image.
 */
export type EventForm = {
  name: string;
  venue: string;
  city: string;
  datetime: string;
  imageFile?: File | null;
};

/**
 * UnitForm: one per ticket unit (seat/GA entry).
 * If `is_seated` is true, section/row/seat_number must be provided.
 * `file` is the per-unit ticket PDF.
 */
export type UnitForm = {
  is_seated: boolean;
  area_type: string;
  section?: string;
  row?: string;
  seat_number?: string;
  original_price: string; // keep as string in form, cast to number on submit
  current_price: string;
  file?: File | null; // PDF per unit
};
