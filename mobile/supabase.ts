
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  "https://wnjxfwqvxwxnksbyvvug.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_weQHFJ5OcI1YB0Xc04ubsg_F_8AMzoS";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
