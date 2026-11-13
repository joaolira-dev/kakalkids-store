"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { signIn, type LoginState } from "@/lib/admin/auth-actions";

const initial: LoginState = { error: null, email: "" };

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, initial);

  return (
    <form action={action} className="flex flex-col gap-4 rounded-[2rem] bg-white p-7 ring-2 ring-marinho/5">
      <div>
        <label htmlFor="email" className="mb-1.5 block font-semibold">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.email}
          required
          className="h-12 w-full rounded-2xl border-2 border-marinho/15 bg-creme/50 px-4 focus:border-marinho focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block font-semibold">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-12 w-full rounded-2xl border-2 border-marinho/15 bg-creme/50 px-4 focus:border-marinho focus:outline-none"
        />
      </div>
      {state.error && (
        <p role="alert" className="rounded-2xl bg-coral/15 p-3 text-sm font-semibold">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 flex h-12 items-center justify-center gap-2 rounded-full bg-marinho font-display text-lg font-semibold text-creme hover:bg-cobalto disabled:opacity-70"
      >
        {pending && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
