import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

interface FloatingAddButtonProps {
  onPress: () => void;
}

export default function FloatingAddButton({ onPress }: FloatingAddButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onPress}
        onHoverIn={() => setIsHovered(true)}
        onHoverOut={() => setIsHovered(false)}
        style={[
          styles.fab,
          {
            backgroundColor: isHovered ? "#0277BD" : "#0288D1",
            transform: [{ scale: isHovered ? 1.12 : 1 }],
          },
        ]}
      >
        <Ionicons name="add" size={36} color="white" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    bottom: 40,
    left: "50%",
    transform: [{ translateX: -30 }],
    zIndex: 100,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0288D1",
    shadowOpacity: 0.5,
    shadowRadius: 50,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
    cursor: "pointer",
  },
});
