import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import { Platform } from "react-native";

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl as string;
const supabaseKey = Constants.expoConfig?.extra?.supabaseKey as string;

if (!supabaseUrl || !supabaseKey) throw new Error("Supabase URL/Key missing!");

const globalForSupabase = globalThis as unknown as {
  supabase?: SupabaseClient;
};
const isWeb = Platform.OS === "web";

export const supabase =
  globalForSupabase.supabase ??
  createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: "pkce",
      storage: isWeb ? window.localStorage : AsyncStorage,
    },
  });

if (!globalForSupabase.supabase) globalForSupabase.supabase = supabase;
