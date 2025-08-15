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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string>("Guest");

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      setIsLoggedIn(!!user);

      if (user) {
        // נשלוף את השם מהפרופיל
        const { data: profileData } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", user.id)
          .single();
        if (profileData) {
          setUserName(`${profileData.first_name} ${profileData.last_name}`);
        } else {
          setUserName("User");
        }
      } else {
        setUserName("Guest");
      }
    };
    checkUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
      if (session?.user) {
        supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", session.user.id)
          .single()
          .then(({ data: profileData }) => {
            if (profileData) {
              setUserName(`${profileData.first_name} ${profileData.last_name}`);
            } else {
              setUserName("User");
            }
          });
      } else {
        setUserName("Guest");
      }
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const handleProfilePress = () => {
    if (isLoggedIn) {
      router.push("/(user)/profile");
    } else {
      router.push("/(auth)/login");
    }
  };

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
              onPress={handleProfilePress}
              style={{ flexDirection: "row", alignItems: "center", marginLeft: 15 }}
            >
              <Ionicons name="person-circle-outline" size={28} color="black" />
              <Text style={{ marginLeft: 6, fontSize: 16 }}>
                {userName}
              </Text>
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
        <Drawer.Screen
          name="(auth)/signup"
          options={{
            title: "Sign Up",
            drawerIcon: ({ size, color }) => (
              <Ionicons name="person-add-outline" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="(auth)/login"
          options={{
            title: "Login",
            drawerIcon: ({ size, color }) => (
              <Ionicons name="log-in-outline" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="(auth)/logout"
          options={{
            title: "Logout",
            drawerIcon: ({ size, color }) => (
              <Ionicons name="log-out-outline" size={size} color={color} />
            ),
            drawerItemStyle: !isLoggedIn ? { display: "none" } : {},
          }}
        />
        <Drawer.Screen
          name="(auth)/callback"
          options={{
            drawerItemStyle: { display: "none" },
          }}
        />
      </Drawer>
    </>
  );
}