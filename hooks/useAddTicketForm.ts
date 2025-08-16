import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";

const MAX_PDF_MB = 10;
const MAX_IMG_MB = 10;
const MB = 1024 * 1024;

const imageMimeTypes = ["image/png", "image/jpeg", "image/webp"];

export const addTicketSchema = z.object({
  // Event
  eventTitle: z.string().min(2, "Event name is too short").max(120, "Too long"),
  eventDate: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date/time")
    .refine(
      (v) => new Date(v).getTime() > Date.now(),
      "Date/time must be in the future"
    ),
  venue: z.string().min(2, "Venue is required"),
  city: z.string().min(2, "City is required"),
  categoryId: z.string().min(1, "Category is required"),

  // Optional event image (PNG/JPG/WEBP ≤ 10MB)
  eventImageFile: z
    .instanceof(File)
    .optional()
    .refine(
      (f) => !f || imageMimeTypes.includes(f.type),
      "Image must be PNG/JPG/WEBP"
    )
    .refine(
      (f) => !f || f.size <= MAX_IMG_MB * MB,
      `Image must be ≤ ${MAX_IMG_MB}MB`
    ),

  // Ticket core
  price: z.coerce.number().positive("Price must be > 0").max(1_000_000),
  quantity: z.coerce.number().int("Whole number").min(1).max(100),

  // Seating / area
  areaType: z.string().min(2, "Area type is required"), // e.g., Floor, VIP
  isSeated: z.boolean().default(false),
  section: z.string().optional(),
  row: z.string().optional(),

  // Seat numbers entered as CSV -> keep as string in the form; split in submit
  seatNumbersCsv: z.string().optional(),

  // Description
  description: z.string().max(1000, "Max 1000 chars").optional(),

  // Barcode (PDF only)
  ticketPdf: z
    .instanceof(File, { message: "Attach your ticket PDF" })
    .refine((f) => f.type === "application/pdf", "File must be a PDF")
    .refine((f) => f.size <= MAX_PDF_MB * MB, `PDF must be ≤ ${MAX_PDF_MB}MB`),
});

export type AddTicketForm = z.infer<typeof addTicketSchema>;

export function useAddTicketForm() {
  const resolver = zodResolver(addTicketSchema) as Resolver<AddTicketForm>;

  return useForm<AddTicketForm>({
    resolver,
    mode: "onSubmit",
    defaultValues: {
      eventTitle: "",
      eventDate: "",
      venue: "",
      city: "",
      categoryId: "",
      eventImageFile: undefined,
      price: undefined as unknown as number,
      quantity: undefined as unknown as number,
      areaType: "",
      isSeated: false,
      section: "",
      row: "",
      seatNumbersCsv: "",
      description: "",
      ticketPdf: undefined as unknown as File,
    } as Partial<AddTicketForm>,
  });
}
