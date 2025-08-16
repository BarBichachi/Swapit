import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

export default function LogoutScreen() {
  const [error, setError] = useState("");

  useEffect(() => {
    const logout = async () => {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setError(error.message || "Logout failed. Please try again.");
      }
    };
    logout();
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
      <Text>Logging out...</Text>
    </View>
  );
}