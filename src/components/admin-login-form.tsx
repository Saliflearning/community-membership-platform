"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AdminLoginForm({ locale }: { locale: "fr" | "en" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      router.push(`/admin?lang=${locale}`);
      router.refresh();
    } catch {
      setStatus("error");
      setMessage(locale === "fr" ? "Connexion impossible." : "Unable to sign in.");
    }
  }

  return (
    <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
      <label className="grid gap-2 text-sm font-bold text-hub-ink">
        Email
        <input
          className="min-h-12 rounded-md border border-slate-300 px-3 text-base"
          autoComplete="email"
          inputMode="email"
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label className="grid gap-2 text-sm font-bold text-hub-ink">
        {locale === "fr" ? "Mot de passe" : "Password"}
        <input
          className="min-h-12 rounded-md border border-slate-300 px-3 text-base"
          autoComplete="current-password"
          required
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {message ? (
        <p className="rounded-md border border-hub-red/30 bg-hub-red/10 p-3 text-sm font-semibold text-hub-red">
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
            ? "Connexion..."
            : "Signing in..."
          : locale === "fr"
            ? "Acceder a l'administration"
            : "Access admin"}
      </button>
    </form>
  );
}
