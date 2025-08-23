import TicketCard from "@/components/tickets/TicketCard";
import { Ticket } from "@/types/ticket";
import { View } from "react-native";

interface TicketGridProps {
  tickets: Ticket[];
  onSelect: (ticket: Ticket) => void;
}

export default function TicketGrid({ tickets, onSelect }: TicketGridProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        columnGap: 12,
        marginTop: 12,
      }}
    >
      {tickets.map((ticket, index) => (
        <TicketCard
          key={ticket.id ?? index}
          {...ticket}
          onPress={() => onSelect(ticket)}
        />
      ))}
    </View>
  );
}
