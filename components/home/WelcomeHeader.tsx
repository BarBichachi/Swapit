import { StyleSheet, Text, View } from "react-native";

interface WelcomeHeaderProps {
  userName?: string | null;
}

export default function WelcomeHeader({ userName }: WelcomeHeaderProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Hi {userName ?? "there"} 👋</Text>
      <Text style={styles.sub}>Ready to sell or buy a ticket?</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "600" },
  sub: { fontSize: 16 },
});
