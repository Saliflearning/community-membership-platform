"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function MemberLoginForm({
  locale,
  initialEmail = "",
  nextPath = "/portal"
}: {
  locale: "fr" | "en";
  initialEmail?: string;
  nextPath?: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const appOrigin = getConfiguredAppOrigin();
      const redirectTo = `${appOrigin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true
        }
      });

      if (error) {
        throw error;
      }

      setStatus("sent");
      setMessage(
        locale === "fr"
          ? "Lien securise envoye. Ouvrez votre email sur cet appareil pour acceder a votre portail."
          : "Secure link sent. Open your email on this device to access your portal."
      );
    } catch {
      setStatus("error");
      setMessage(locale === "fr" ? "Connexion impossible." : "Unable to sign in.");
    }
  }

  return (
    <form className="mt-5 grid gap-3 rounded-md border border-slate-200 bg-hub-mist/50 p-4" onSubmit={onSubmit}>
      <div>
        <p className="text-sm font-bold text-hub-ink">
          {locale === "fr" ? "Recevoir un lien de connexion" : "Receive a sign-in link"}
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-600">
          {locale === "fr"
            ? "Utilisez le meme email que pendant l'inscription."
            : "Use the same email you used during registration."}
        </p>
      </div>
      <label className="grid gap-2 text-sm font-bold text-hub-ink">
        Email
        <input
          className="min-h-12 rounded-md border border-slate-300 bg-white px-3 text-base"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      {message ? (
        <p className={`rounded-md p-3 text-sm font-semibold ${status === "error" ? "bg-hub-red/10 text-hub-red" : "bg-hub-green/10 text-hub-green"}`}>
          {message}
        </p>
      ) : null}
      <button
        className="min-h-12 rounded-md bg-hub-green px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={status === "loading"}
        type="submit"
      >
        {status === "loading"
          ? locale === "fr"
            ? "Envoi..."
            : "Sending..."
          : locale === "fr"
            ? "Envoyer le lien securise"
            : "Send secure link"}
      </button>
    </form>
  );
}

function getConfiguredAppOrigin() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  return window.location.origin;
}
