import React, { useEffect, useRef } from "react";
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface DropdownProps {
  visible: boolean;
  options: { value: string; label: string }[];
  selected?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  anchor?: {
    top?: number;
    left?: number | string;
    right?: number | string;
  };
}

export default function Dropdown({
  visible,
  options,
  selected,
  onSelect,
  onClose,
  anchor = { top: 100, left: 100 },
}: DropdownProps) {
  const screen = Dimensions.get("window");

  const containerRef = useRef<View>(null);

  useEffect(() => {
    const handleClickOutside = (e: any) => {
      if (containerRef.current) {
        // Naively close dropdown on any touch for now
        onClose();
      }
    };

    if (visible) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View
        style={[
          styles.backdrop,
          {
            width: screen.width,
            height: screen.height,
          },
        ]}
      >
        <View
          ref={containerRef}
          style={[
            styles.dropdown,
            {
              top: anchor.top ?? 100,
              left: typeof anchor.left === "number" ? anchor.left : undefined,
              right:
                typeof anchor.right === "number" ? anchor.right : undefined,
              transform:
                typeof anchor.left === "string" &&
                (anchor.left as string).endsWith("%")
                  ? [{ translateX: -90 }]
                  : undefined,
            },
          ]}
        >
          {options.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => onSelect(option.value)}
              style={[
                styles.option,
                option.value === selected && { backgroundColor: "#eee" },
              ]}
            >
              <Text>{option.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 9999,
  },
  dropdown: {
    position: "absolute",
    backgroundColor: "white",
    borderRadius: 6,
    paddingVertical: 8,
    minWidth: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
  },
  option: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
});
