import { Ionicons } from "@expo/vector-icons";
import { DrawerToggleButton } from "@react-navigation/drawer";
import { useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import Head from "expo-router/head";
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

      <Drawer
        screenOptions={{
          headerTitle: () => (
            <TouchableOpacity onPress={() => router.push("/")}>
              <Text style={{ fontSize: 18, fontWeight: "bold" }}>Swapit</Text>
            </TouchableOpacity>
          ),
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.push("/(user)/profile")}
              style={{ marginLeft: 15 }}
            >
              <Ionicons name="person-circle-outline" size={28} color="black" />
            </TouchableOpacity>
          ),
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
            drawerIcon: ({ size, color }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="(user)/profile"
          options={{
            title: "My Profile",
            drawerIcon: ({ size, color }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="(settings)/index"
          options={{
            title: "Settings",
            drawerIcon: ({ size, color }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
      </Drawer>
    </>
  );
}
