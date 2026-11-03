import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { activatePreferenceAccount, flushPreferences } from "@/lib/astra/prefs";
import { Button } from "@/components/ui/button";

type AuthState = { session: Session | null; user: User | null; loading: boolean; guest: boolean };
type AuthCtx = AuthState & { enterGuest: () => void; exitGuest: () => void };
const GUEST_KEY = "birch-guest-mode";
const AuthContext = createContext<AuthCtx>({ session: null, user: null, loading: true, guest: false, enterGuest: () => {}, exitGuest: () => {} });

export function readGuest() {
  try { return window.sessionStorage.getItem(GUEST_KEY) === "1"; } catch { return false; }
}
function writeGuest(on: boolean) {
  try { if (on) window.sessionStorage.setItem(GUEST_KEY, "1"); else window.sessionStorage.removeItem(GUEST_KEY); } catch { /* storage unavailable */ }
}

/** Guest mode shows the same signed-in layouts with no session: nothing can be saved because the database only accepts signed-in users. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, user: null, loading: true, guest: false });
  const [startupError, setStartupError] = useState(false);
  useEffect(() => {
    let transition = 0; let live = true;
    const apply = (session: Session | null) => {
      if (session) writeGuest(false);
      const current = ++transition;
      setState(s => ({ ...s, loading: true }));
      // Leave Auth's callback before calling the Data API.
      setTimeout(() => { void activatePreferenceAccount(session?.user.id ?? null).finally(() => {
        if (live && current === transition) setState({ session, user: session?.user ?? null, loading: false, guest: !session && readGuest() });
      }).catch(() => {}); }, 0);
    };
    let unsubscribe: (() => void) | undefined;
    const failed = () => { if (live) { setStartupError(true); setState(s => ({ ...s, loading: false })); } };
    try {
      const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => apply(session));
      unsubscribe = () => sub.subscription.unsubscribe();
      void supabase.auth.getSession().then(({ data, error }) => { if (error) failed(); else apply(data.session); }).catch(failed);
    } catch { failed(); }
    const onExit = () => setState(s => ({ ...s, guest: false }));
    window.addEventListener(GUEST_KEY, onExit);
    return () => { live = false; unsubscribe?.(); window.removeEventListener(GUEST_KEY, onExit); };
  }, []);
  const enterGuest = () => { writeGuest(true); setState(s => ({ ...s, session: null, user: null, guest: true })); };
  const exitGuest = () => { writeGuest(false); setState(s => ({ ...s, guest: false })); };
  if (startupError) return <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background p-6 text-foreground"><h1 className="text-2xl font-semibold">Birch OS</h1><p role="alert">Account connection could not start. Please check the app configuration or connection and retry.</p><Button onClick={() => window.location.reload()}>Retry</Button></main>;
  return <AuthContext.Provider value={{ ...state, enterGuest, exitGuest }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/** Signs out of an account or leaves guest mode. */
export async function signOutAll() {
  await flushPreferences().catch(() => {});
  writeGuest(false); window.dispatchEvent(new Event(GUEST_KEY));
  await supabase.auth.signOut();
}
