import { AuthProvider, useAuthContext } from "@/contexts/AuthContext";
import useProfile from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { DrawerToggleButton } from "@react-navigation/drawer";
import { useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import Head from "expo-router/head";
import { useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";
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

function HeaderLeftButton() {
  const router = useRouter();
  const { userName, loading, user } = useAuthContext();
  const { balance, loading: profileLoading } = useProfile();

  return (
    <TouchableOpacity
      onPress={() => router.push(user ? "/(user)/profile" : "/(auth)/login")}
      style={{ flexDirection: "row", alignItems: "center", marginLeft: 15 }}
      disabled={loading || profileLoading}
    >
      {/* Profile Icon + Name */}
      <Ionicons name="person-circle-outline" size={28} color="black" />
      <Text style={{ marginLeft: 6, fontSize: 16 }}>
        {loading ? "…" : userName}
      </Text>

      {/* Balance Section */}
      {user && balance !== null && (
        <View
          style={{ flexDirection: "row", alignItems: "center", marginLeft: 24 }}
        >
          <Ionicons name="wallet-outline" size={28} color="black" />
          <Text style={{ marginLeft: 4, fontSize: 16 }}>
            {balance.toLocaleString()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function AppDrawer() {
  const router = useRouter();
  const { user, loading } = useAuthContext();
  const isLoggedIn = !!user;

  return (
    <Drawer
      screenOptions={{
        headerTitle: () => (
          <TouchableOpacity onPress={() => router.push("/")}>
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>Swapit</Text>
          </TouchableOpacity>
        ),
        headerLeft: () => <HeaderLeftButton />,
        headerRight: () => (
          <View style={{ marginRight: 15 }}>
            <DrawerToggleButton tintColor="black" />
          </View>
        ),
        drawerPosition: "right",
        headerTitleAlign: "center",
        drawerType: "slide",
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
          drawerItemStyle: isLoggedIn || loading ? { display: "none" } : {},
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
          drawerItemStyle: isLoggedIn || loading ? { display: "none" } : {},
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
          drawerItemStyle: !isLoggedIn || loading ? { display: "none" } : {},
        }}
      />

      {/* Always hidden */}
      <Drawer.Screen
        name="(auth)/callback"
        options={{ drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="(tickets)/add-ticket"
        options={{ drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="(auth)/updateDetails"
        options={{ drawerItemStyle: { display: "none" } }}
      />
    </Drawer>
  );
}
