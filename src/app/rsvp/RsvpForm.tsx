"use client";

import { useState, useTransition } from "react";
import { searchAction, submitRsvpAction } from "./actions";
import type { SubmitResult } from "@/lib/rsvp/submit";

interface Match {
  id: string;
  firstName: string;
  lastName: string;
  plusOnesAllowed: number;
}

export function RsvpForm({ mode }: { mode: "closed" | "open" }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [matched, setMatched] = useState<Match | null>(null);
  const [attending, setAttending] = useState<"yes" | "no" | null>(null);
  const [plusOnes, setPlusOnes] = useState<string[]>([]);
  const [observation, setObservation] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allowed = mode === "closed" ? matched?.plusOnesAllowed ?? 0 : 0;

  async function onPrefix(value: string) {
    setFirstName(value);
    if (mode === "closed" && value.length >= 2) {
      const results = await searchAction(value);
      setMatches(results);
    } else {
      setMatches([]);
    }
  }

  function pickMatch(m: Match) {
    setMatched(m);
    setFirstName(m.firstName);
    setLastName(m.lastName);
    setMatches([]);
  }

  function addPlusOne() {
    if (plusOnes.length < allowed) setPlusOnes([...plusOnes, ""]);
  }
  function removePlusOne(i: number) {
    setPlusOnes(plusOnes.filter((_, j) => j !== i));
  }
  function setPlusOne(i: number, value: string) {
    setPlusOnes(plusOnes.map((v, j) => (j === i ? value : v)));
  }

  function handleSubmit(form: HTMLFormElement) {
    setError(null);
    const fd = new FormData(form);
    plusOnes.forEach((v, i) => fd.set(`plusOneName-${i}`, v));
    fd.set("attending", attending ?? "");
    startTransition(async () => {
      const r = await submitRsvpAction(fd);
      setResult(r as SubmitResult);
      if (!r.ok) {
        if (r.error.kind === "validation") setError("Verifique os campos preenchidos.");
        else if (r.error.kind === "guestNotInList")
          setError("Não encontramos esse nome. Confira a grafia ou fale com os noivos.");
        else if (r.error.kind === "alreadySubmitted")
          setError(`Já registramos sua resposta como ${r.error.status === "confirmed" ? "Confirmada" : "Recusada"}. Para alterar, fale com os noivos.`);
        else if (r.error.kind === "plusOnesExceedAllowance")
          setError(`Você pode incluir no máximo ${r.error.allowed} acompanhante(s).`);
        else if (r.error.kind === "duplicateOpenSubmission")
          setError("Já registramos essa resposta.");
        else if (r.error.kind === "rateLimited")
          setError("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
      }
    });
  }

  if (result?.ok) {
    return (
      <div className="text-center py-12 space-y-4">
        <h1 className="text-4xl" style={{ fontFamily: "var(--font-display)", color: "var(--color-primary)" }}>
          Recebemos sua resposta!
        </h1>
        <p>Obrigada pela confirmação. Esperamos vocês 🤍</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(e.currentTarget);
      }}
      className="mx-auto max-w-md space-y-6"
    >
      <h1
        className="text-4xl text-center"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-primary)" }}
      >
        Confirme sua presença
      </h1>

      <div className="space-y-1">
        <label className="text-sm font-medium">Nome</label>
        <input
          name="firstName"
          required
          value={firstName}
          onChange={(e) => onPrefix(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />
        {mode === "closed" && matches.length > 0 && !matched ? (
          <ul className="border rounded mt-1 max-h-48 overflow-y-auto">
            {matches.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => pickMatch(m)}
                  className="w-full text-left px-3 py-2 hover:bg-black/5"
                >
                  {m.firstName} {m.lastName}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Sobrenome</label>
        <input
          name="lastName"
          required
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />
      </div>

      <fieldset className="space-y-1">
        <legend className="text-sm font-medium">Você poderá comparecer?</legend>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="attending"
              checked={attending === "yes"}
              onChange={() => setAttending("yes")}
            />
            Sim
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="attending"
              checked={attending === "no"}
              onChange={() => setAttending("no")}
            />
            Não
          </label>
        </div>
      </fieldset>

      {attending === "yes" && allowed > 0 ? (
        <div className="space-y-2">
          <p className="text-sm">
            Você pode trazer até {allowed} acompanhante{allowed === 1 ? "" : "s"}.
          </p>
          {plusOnes.map((name, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setPlusOne(i, e.target.value)}
                placeholder="Nome do acompanhante"
                className="flex-1 rounded border px-3 py-2"
              />
              <button
                type="button"
                onClick={() => removePlusOne(i)}
                className="rounded border px-3 text-sm"
              >
                Remover
              </button>
            </div>
          ))}
          {plusOnes.length < allowed ? (
            <button
              type="button"
              onClick={addPlusOne}
              className="rounded border px-3 py-2 text-sm"
            >
              Adicionar acompanhante
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-1">
        <label className="text-sm font-medium">Observação (opcional)</label>
        <textarea
          name="observation"
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
          rows={3}
          maxLength={500}
          className="w-full rounded border px-3 py-2"
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm" style={{ color: "var(--color-accent)" }}>
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || !attending}
        className="w-full rounded border px-4 py-2 text-sm uppercase tracking-wider"
        style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
      >
        {pending ? "Enviando..." : "Confirmar"}
      </button>
    </form>
  );
}
