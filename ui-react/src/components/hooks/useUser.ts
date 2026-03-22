import { supabase } from "@/supabaseClient";
import { useState } from "react";

export const useUser = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerUser = async (username: string, token: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data: existingUser, error: fetchError } = await supabase
        .from("user")
        .select("user_id, canvas_token")
        .eq("user_id", username)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingUser) {
        if (existingUser.canvas_token === token) {
          setLoading(false);
          return { success: true };
        } else {
          setError("Incorrect token for this username.");
          setLoading(false);
          return { success: false };
        }
      }

      const { error: insertError } = await supabase
        .from("user")
        .insert([{ user_id: username, canvas_token: token }]);

      if (insertError) throw insertError;

      setLoading(false);
      return { success: true };
    } catch (err: any) {
      setError("An error occurred. Please try again.");
      setLoading(false);
      return { success: false };
    }
  };

  return { registerUser, loading, error };
};
