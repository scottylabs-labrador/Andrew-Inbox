import { useState } from "react";
import { BACKEND_URL } from "@/config";
import { supabase } from "@/supabaseClient";

export const useBackend = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeSync = async () => {
    setLoading(true);
    setError(null);

    try {
      // The backend works out who you are from your sign-in session.
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) throw new Error("Please sign in again.");

      const response = await fetch(`${BACKEND_URL}/sync`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Sync failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { executeSync, loading, error };
};
