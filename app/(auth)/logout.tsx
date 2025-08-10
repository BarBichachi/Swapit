import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";

export default function LogoutScreen() {
  const router = useRouter();

  useEffect(() => {
    const signOut = async () => {
      await supabase.auth.signOut();
      router.replace("/"); // Redirect to home after logout
    };
    signOut();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
      <Text>Logging out...</Text>
    </View>
  );
}