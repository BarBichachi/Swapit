import { AuthProvider, useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { DrawerToggleButton } from "@react-navigation/drawer";
import { useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import Head from "expo-router/head";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import "./styles.css";

export default function RootLayout() {
  const router = useRouter();

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
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("balance")
          .eq("id", user.id)
          .single();
        setBalance(data?.balance ?? 0);
      } else {
        setBalance(null);
      }
    };
    fetchBalance();
  }, [user]);

  return (
    <TouchableOpacity
      onPress={() => router.push(user ? "/(user)/profile" : "/(auth)/login")}
      style={{ flexDirection: "row", alignItems: "center", marginLeft: 15 }}
      disabled={loading}
    >
      <Ionicons name="person-circle-outline" size={28} color="black" />
      <Text style={{ marginLeft: 6, fontSize: 16 }}>
        {loading ? "…" : userName}
        {user && balance !== null && (
          <Text style={{ marginLeft: 8, fontSize: 12}}>
            {" | Balance: " + balance.toLocaleString() + " coins"}
          </Text>
        )}
      </Text>
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
    </Drawer>
  );
}