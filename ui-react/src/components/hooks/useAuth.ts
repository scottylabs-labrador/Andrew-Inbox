import { supabase } from "@/supabaseClient";
import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";

export interface Profile {
  userId: string;
  username: string;
  hasCanvasToken: boolean;
}

// Supabase Auth signs people in by email, so each Andrew ID maps to its
// @andrew.cmu.edu address. With "Confirm email" turned off in Supabase, no
// email is ever sent; it's just the account's identifier.
const toEmail = (andrewId: string) =>
  `${andrewId.trim().toLowerCase()}@andrew.cmu.edu`;

const friendlyAuthError = (message: string) => {
  if (/invalid login credentials/i.test(message))
    return "Wrong Andrew ID or password.";
  if (/already registered|already exists/i.test(message))
    return "An account with that Andrew ID already exists. Try signing in.";
  if (/same as the old|different from the old/i.test(message))
    return "Pick a password different from your old one.";
  if (/email not confirmed/i.test(message))
    return "Email confirmation is on in Supabase. Turn off \"Confirm email\" (see README).";
  return message;
};

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState(false);

  const loadProfile = useCallback(async (s: Session | null) => {
    if (!s) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("username, has_canvas_token")
      .eq("id", s.user.id)
      .maybeSingle();

    if (error) console.error("Profile error:", error);
    setProfile({
      userId: s.user.id,
      username: data?.username ?? s.user.email?.split("@")[0] ?? "",
      hasCanvasToken: data?.has_canvas_token ?? false,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    // Fires once on startup with the saved session (INITIAL_SESSION), then on
    // every sign-in / sign-out.
    const { data: listener } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      // Token refreshes don't change who's signed in, so skip the extra fetch.
      if (event === "TOKEN_REFRESHED") return;
      // Supabase calls made directly inside this callback can deadlock.
      setTimeout(() => loadProfile(s), 0);
    });
    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = async (andrewId: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: toEmail(andrewId),
      password,
    });
    return error ? friendlyAuthError(error.message) : null;
  };

  const signUp = async (andrewId: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: toEmail(andrewId),
      password,
      options: { data: { username: andrewId.trim().toLowerCase() } },
    });
    if (error) return friendlyAuthError(error.message);
    // With email confirmation on, Supabase creates the user but no session.
    if (!data.session)
      return "Account created, but Supabase wants email confirmation. Turn off \"Confirm email\" (see README).";
    return null;
  };

  // Forgot password, step 1: Supabase emails a one-time code to the Andrew ID's
  // address. A code (not a link) is used because a reset link can't open back
  // into the extension popup.
  const sendPasswordResetCode = async (andrewId: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(
      toEmail(andrewId),
    );
    if (error && /rate limit/i.test(error.message))
      return "Too many reset emails. Wait a few minutes and try again.";
    return error ? friendlyAuthError(error.message) : null;
  };

  // Step 2: the code signs the user in, then the new password is set. App keeps
  // showing the reset form while `recovering` is true, so the inbox doesn't
  // flash open before the password has actually changed.
  const resetPassword = async (
    andrewId: string,
    code: string,
    newPassword: string,
  ) => {
    setRecovering(true);
    try {
      const { error: codeError } = await supabase.auth.verifyOtp({
        email: toEmail(andrewId),
        token: code.trim(),
        type: "recovery",
      });
      if (codeError) return "That code is wrong or has expired. Request a new one.";

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        await supabase.auth.signOut();
        return friendlyAuthError(updateError.message);
      }
      return null;
    } finally {
      setRecovering(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const saveCanvasToken = async (token: string) => {
    if (!session) return "You're signed out. Sign in again.";
    const { error } = await supabase
      .from("profiles")
      .update({ canvas_token: token.trim() })
      .eq("id", session.user.id);
    if (error) return "Couldn't save your token. Please try again.";
    setProfile((p) => (p ? { ...p, hasCanvasToken: true } : p));
    return null;
  };

  return {
    session,
    profile,
    loading,
    recovering,
    signIn,
    signUp,
    sendPasswordResetCode,
    resetPassword,
    signOut,
    saveCanvasToken,
  };
};
