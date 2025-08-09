import React from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

type AnchorRef = React.RefObject<View>;

interface DropdownProps {
  visible: boolean;
  options: { value: string; label: string }[];
  selected?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  anchorRef: AnchorRef;
  placement?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
  offset?: number;
  matchTriggerWidth?: boolean;
  maxHeight?: number;
}

export default function Dropdown({
  visible,
  options,
  selected,
  onSelect,
  onClose,
  anchorRef,
  placement = "bottom-start",
  offset = 8,
  matchTriggerWidth = true,
  maxHeight = 260,
}: DropdownProps) {
  const screen = Dimensions.get("window");
  const [pos, setPos] = React.useState({
    top: 0,
    left: 0,
    width: 180,
    height: 0,
  });

  // Measure anchor on open / resize / scroll
  React.useEffect(() => {
    if (!visible || !anchorRef?.current) return;

    const measure = () => {
      const node: any = anchorRef.current as unknown as HTMLElement | null;

      if (Platform.OS === "web") {
        if (!node || !node.getBoundingClientRect) return;

        const r = node.getBoundingClientRect();
        const width = matchTriggerWidth ? r.width : 180;
        const top = r.bottom + offset;
        const left = placement.endsWith("end") ? r.right - width : r.left;

        setPos({ top, left, width, height: r.height });
        return;
      }

      // iOS/Android
      node?.measureInWindow?.((x: number, y: number, w: number, h: number) => {
        const top = placement.startsWith("bottom")
          ? y + h + offset
          : y - offset;
        const left = placement.endsWith("end") ? x + w : x;
        setPos({ top, left, width: matchTriggerWidth ? w : 180, height: h });
      });
    };

    measure();
    const id = requestAnimationFrame(measure);

    const onResize = () => measure();
    if (Platform.OS === "web") {
      window.addEventListener("resize", onResize);
      window.addEventListener("scroll", onResize, true);
    }
    return () => {
      cancelAnimationFrame(id);
      if (Platform.OS === "web") {
        window.removeEventListener("resize", onResize);
        window.removeEventListener("scroll", onResize, true);
      }
    };
  }, [visible, anchorRef, placement, offset, matchTriggerWidth]);

  // Outside click (web only)
  React.useEffect(() => {
    if (!visible || Platform.OS !== "web") return;
    const handle = () => onClose();
    document.addEventListener("click", handle);
    return () => document.removeEventListener("click", handle);
  }, [visible, onClose]);

  if (!visible || !options?.length) return null;

  // Keep inside viewport & align end if needed
  const padding = 8;
  let left = pos.left;
  let top = pos.top;

  if (placement.endsWith("end")) {
    left = left - (matchTriggerWidth ? pos.width : 180);
  }

  const width = matchTriggerWidth ? pos.width : 180;
  left = Math.max(padding, Math.min(left, screen.width - padding - width));
  top = Math.max(padding, Math.min(top, screen.height - padding));

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View
        style={[
          styles.backdrop,
          Platform.OS === "web" ? ({ position: "fixed" } as any) : null, // web override
          { width: screen.width, height: screen.height },
        ]}
      >
        <View style={[styles.dropdown, { top, left, width, maxHeight }]}>
          <View style={{ maxHeight, overflow: "hidden" as const }}>
            {options.map((o) => {
              const active = o.value === selected;
              return (
                <Pressable
                  key={o.value}
                  onPress={() => onSelect(o.value)}
                  style={[styles.option, active && styles.active]}
                >
                  <Text>{o.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: "absolute", top: 0, left: 0, zIndex: 9999 },
  dropdown: {
    position: "absolute",
    backgroundColor: "white",
    borderRadius: 8,
    paddingVertical: 6,
    minWidth: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
  },
  option: { paddingVertical: 10, paddingHorizontal: 12 },
  active: { backgroundColor: "#f1f5f9" },
});
