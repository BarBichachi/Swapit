import { Ticket } from "@/types/ticket";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";

import placeholder from "@/assets/images/placeholder.png";

const screenWidth = Dimensions.get("window").width;
const cardMargin = 12;
const cardsPerRow = screenWidth < 500 ? 2 : screenWidth < 900 ? 3 : 4;
const cardWidth = (screenWidth - (cardsPerRow + 1) * cardMargin) / cardsPerRow;

interface TicketCardProps extends Ticket {
  onPress: () => void;
}

export default function TicketCard({
  eventTitle,
  date,
  price,
  quantity,
  imageUrl,
  onPress,
}: TicketCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getBackgroundColor = () => {
    if (isPressed) return "#e0f0ff";
    if (isHovered) return "#f0f8ff";
    return "#f9f9f9";
  };

  // Animated shadow
  const animatedShadow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const toValue = isPressed || isHovered ? 1 : 0;

    Animated.timing(animatedShadow, {
      toValue,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [isPressed, isHovered]);

  const animatedStyle = {
    shadowOpacity: animatedShadow.interpolate({
      inputRange: [0, 1],
      outputRange: [0.05, 0.2],
    }),
    shadowRadius: animatedShadow.interpolate({
      inputRange: [0, 1],
      outputRange: [3, 10],
    }),
    elevation: animatedShadow.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 5],
    }),
  };

  return (
    <Animated.View
      style={{
        width: cardWidth,
        backgroundColor: getBackgroundColor(),
        borderRadius: 10,
        overflow: "hidden",
        marginBottom: cardMargin,
        cursor: "pointer",
        ...animatedStyle,
        ...(isPressed && {
          transform: [{ scale: 0.99 }],
        }),
      }}
    >
      <Pressable
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        onHoverIn={() => setIsHovered(true)}
        onHoverOut={() => setIsHovered(false)}
        onPress={onPress}
        style={{ flex: 1 }}
      >
        {/* Square image */}
        <View style={{ padding: 8 }}>
          <Image
            source={
              typeof imageUrl === "string" && imageUrl.trim().length > 0
                ? { uri: imageUrl }
                : placeholder
            }
            style={{
              width: "100%",
              height: cardWidth * 0.9,
              resizeMode: "cover",
              borderRadius: 10,
            }}
          />
        </View>

        <View style={{ paddingBottom: 8, alignItems: "center" }}>
          <Text style={{ fontWeight: "bold", fontSize: 18 }}>{eventTitle}</Text>
          <Text style={{ fontSize: 14 }}>{date}</Text>
          <Text style={{ fontSize: 14 }}>Starting from {price}₪</Text>
          <Text style={{ fontSize: 14, color: "crimson" }}>
            {quantity} tickets
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
