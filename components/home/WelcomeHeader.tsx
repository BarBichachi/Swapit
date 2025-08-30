import { StyleSheet, Text, useWindowDimensions, View } from "react-native";

interface WelcomeHeaderProps {
  userName?: string | null;
}

export default function WelcomeHeader({ userName }: WelcomeHeaderProps) {
  const { width } = useWindowDimensions();
  const isCompact = width < 480;

  const titleFont = isCompact ? 18 : 22;
  const subFont = isCompact ? 14 : 16;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { fontSize: titleFont }]}>
        Hi {userName ?? "there"} 👋
      </Text>
      <Text style={[styles.sub, { fontSize: subFont }]}>
        Ready to sell or buy a ticket?
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "600" },
  sub: { fontSize: 16 },
});
