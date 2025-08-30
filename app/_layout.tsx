import { AuthProvider, useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { DrawerToggleButton } from "@react-navigation/drawer";
import { useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import Head from "expo-router/head";
import { useEffect } from "react";
import {
  Platform,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import "./styles.css";

export default function RootLayout() {
  useEffect(() => {
    const onVis = () => {
      if (typeof document === "undefined") return;
      if (document.visibilityState === "visible") {
        // resume token refresh when user returns
        supabase.auth.startAutoRefresh();
      } else {
        // pause to avoid timers being throttled in background tabs
        supabase.auth.stopAutoRefresh();
      }
    };

    // run once on mount to set correct state
    onVis();

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVis);
    }
    return () => {
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVis);
      }
    };
  }, []);

  return (
    <>
      <Head>
        <title>Swapit</title>
        <link rel="icon" href="/favicon.png" />
      </Head>

      <AuthProvider>
        <AppDrawer />
      </AuthProvider>
    </>
  );
}

function HeaderLeftButton({
  isCompact,
  slotWidth,
}: {
  isCompact: boolean;
  slotWidth: number;
}) {
  const router = useRouter();
  const { currentUser, loading } = useAuthContext();

  const isLoggedIn = currentUser.isLoggedIn;
  const label = loading
    ? "…"
    : isLoggedIn
    ? currentUser.fullName || "User"
    : "Guest";

  // icon sizes & font sizes scale down on compact
  const iconSize = isCompact ? 22 : 26;
  const walletIcon = isCompact ? 20 : 22;
  const textSize = isCompact ? 14 : 16;

  return (
    <TouchableOpacity
      onPress={() =>
        router.push(isLoggedIn ? "/(user)/profile" : "/(auth)/login")
      }
      style={{
        flexDirection: "row",
        alignItems: "center",
        width: slotWidth,
        paddingLeft: 8,
      }}
      disabled={loading}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <View
        style={{
          flexDirection: isCompact ? "column" : "row",
          alignItems: isCompact ? "flex-start" : "center",
          justifyContent: "center",
          marginLeft: 6,
          maxWidth: slotWidth,
          gap: isCompact ? 2 : 0, // tiny vertical gap on compact
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginLeft: isCompact ? 0 : 12,
            maxWidth: slotWidth,
          }}
        >
          {/* Name */}
          <Ionicons
            name="person-circle-outline"
            size={iconSize}
            color="black"
          />
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{
              marginLeft: 4,
              fontSize: textSize,
              lineHeight: textSize + 2,
            }}
          >
            {label}
          </Text>
        </View>
        {/* Balance */}
        {isLoggedIn && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginLeft: isCompact ? 0 : 12,
              maxWidth: isCompact ? slotWidth : slotWidth * 0.35,
            }}
          >
            <Ionicons name="wallet-outline" size={walletIcon} color="black" />
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                marginLeft: 4,
                fontSize: textSize,
                lineHeight: textSize + 2,
              }}
            >
              {currentUser.balance.toLocaleString()}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function AppDrawer() {
  const router = useRouter();
  const { currentUser, loading } = useAuthContext();
  const isLoggedIn = currentUser.isLoggedIn;

  // --- responsive breakpoints (live update on resize) ---
  const { width } = useWindowDimensions();
  const isCompact = width < 480;

  // keep left/right header areas same width so the title stays centered
  const preferredSlot = isCompact ? 200 : 340;
  // reserve some minimum space for the title between the two slots
  const minTitleSpace = 120;
  // don't let L/R slots be so wide that they overlap the title area
  const slotWidth = Math.max(
    120, // lower bound so the left contents don't get too cramped
    Math.min(preferredSlot, Math.floor((width - minTitleSpace) / 2))
  );

  // fonts
  const titleFont = isCompact ? 16 : 18;
  const nameFont = isCompact ? 14 : 16;

  // hairline for border
  const hairline = Platform.OS === "web" ? 1 : 0.5;

  // Drawer target width
  const drawerWidth = isCompact
    ? Math.min(300, Math.floor(width * 0.86))
    : Math.min(360, Math.floor(width * 0.4));

  return (
    <Drawer
      screenOptions={{
        // ---- header look & feel ----
        headerStyle: {
          height: Platform.OS === "web" ? 64 : 56,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: hairline,
          borderBottomColor: "#eaeaea",
          backgroundColor: "#fff",
        },
        headerTitleAlign: "center",
        headerLeftContainerStyle: { width: slotWidth },
        headerRightContainerStyle: {
          width: slotWidth,
        },
        headerTitleContainerStyle: { flex: 1, alignItems: "center" },

        // ---- title (responsive, clickable) ----
        headerTitle: () => (
          <TouchableOpacity
            onPress={() => router.replace("/")}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text
              numberOfLines={1}
              style={{
                fontWeight: "700",
                fontSize: titleFont,
                letterSpacing: 0.2,
              }}
            >
              Swapit
            </Text>
          </TouchableOpacity>
        ),

        // ---- left & right ----
        headerLeft: () => (
          <HeaderLeftButton isCompact={isCompact} slotWidth={slotWidth} />
        ),
        headerRight: () => (
          <View style={{ marginRight: isCompact ? 0 : 3 }}>
            <DrawerToggleButton tintColor="#111" />
          </View>
        ),

        // ---- drawer behavior (responsive) ----
        drawerPosition: "right",
        drawerType: isCompact ? "front" : "slide",
        swipeEdgeWidth: isCompact ? 24 : 60,
        drawerStyle: {
          width: drawerWidth,
        },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: "Home",
          drawerLabel: "Home",
          drawerIcon: ({ size, color }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="(user)/profile"
        options={{
          title: "My Profile",
          drawerLabel: "My Profile",
          drawerIcon: ({ size, color }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Show these only when logged OUT */}
      <Drawer.Screen
        name="(auth)/signup"
        options={{
          title: "Sign Up",
          drawerLabel: "Sign Up",
          drawerIcon: ({ size, color }) => (
            <Ionicons name="person-add-outline" size={size} color={color} />
          ),
          drawerItemStyle: loading || isLoggedIn ? { display: "none" } : {},
        }}
      />
      <Drawer.Screen
        name="(auth)/login"
        options={{
          title: "Login",
          drawerLabel: "Login",
          drawerIcon: ({ size, color }) => (
            <Ionicons name="log-in-outline" size={size} color={color} />
          ),
          drawerItemStyle: loading || isLoggedIn ? { display: "none" } : {},
        }}
      />

      {/* Show this only when logged IN */}
      <Drawer.Screen
        name="(auth)/logout"
        options={{
          title: "Logout",
          drawerLabel: "Logout",
          drawerIcon: ({ size, color }) => (
            <Ionicons name="log-out-outline" size={size} color={color} />
          ),
          drawerItemStyle: loading || !isLoggedIn ? { display: "none" } : {},
        }}
      />

      {/* Always hidden from drawer */}
      <Drawer.Screen
        name="(auth)/callback"
        options={{ drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="(tickets)/add-ticket"
        options={{ drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="(user)/updatedetails"
        options={{ drawerItemStyle: { display: "none" } }}
      />
    </Drawer>
  );
}
