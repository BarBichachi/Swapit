import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseKey = Constants.expoConfig?.extra?.supabaseKey;

if (!supabaseKey) {
  throw new Error("Supabase key is missing! (Check app.config.ts)");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
