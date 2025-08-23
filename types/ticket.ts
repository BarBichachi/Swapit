export interface Ticket {
  eventTitle: string;
  date: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  id?: string;
  status: "active" | "sold" | "expired" | "removed";
}
