/**
 * Renders the per-phase status copy with a pulsing indicator. The copy
 * rotates every ``ROTATION_MS`` so the operator sees fresh copy while
 * the agent is mid-flight (Pinecone retrieval typically lands in 2-6
 * s; the underlying phase stays ``searching`` the whole time). On a
 * phase change, the rotation jumps to a fresh index inside the new
 * phase's message set.
 *
 * This component is the single source of truth for the user-facing
 * status line — it covers tools, reasoning, cold-start, connecting,
 * etc. via the ``agentPhase`` / ``effectiveAgentPhase`` layer. There is
 * no longer a separate ``ToolProgressLine`` overlay.
 */

import { useEffect, useState } from "react";

import { useSmoothStreamingText } from "@/hooks/useSmoothStreamingText";
import type { AgentPhase } from "../_lib/message-parts";

type AgentStatusProps = {
  phase: AgentPhase;
};

type ActivePhase = Exclude<AgentPhase, "idle">;

const STATUS_COPY: Record<ActivePhase, readonly string[]> = {
  thinking: [
    "Analyse de votre question…",
    "Examen de votre demande…",
    "Préparation de la recherche…",
  ],
  // Pinecone retrieval on the Modal backend typically lands in 2-6 s,
  // and the agent stays in the ``searching`` phase the whole time. The
  // richer copy (5 messages instead of 3) keeps the operator's eye
  // moving until ``output-available`` lands.
  searching: [
    "Recherche dans la documentation BRH en cours…",
    "Compilation des extraits récupérés…",
    "Analyse des passages les plus pertinents…",
    "Préparation des sources pour la réponse…",
    "Tri des documents les plus utiles…",
  ],
  reading: [
    "Lecture des documents pertinents…",
    "Analyse des passages retrouvés…",
    "Examen des sources sélectionnées…",
  ],
  rethinking: [
    "Réévaluation des informations trouvées…",
    "Mise en perspective des résultats…",
    "Vérification des éléments recueillis…",
  ],
  // Multi-tool case: copy focuses on parallel retrieval rather than
  // the single-corpus flow above.
  researching: [
    "Plusieurs outils s'exécutent en parallèle…",
    "Compilation des résultats partiels…",
    "Mise en commun des sources récupérées…",
  ],
  writing: [
    "Rédaction de la réponse…",
    "Synthèse des informations recueillies…",
    "Mise en forme de votre réponse…",
  ],
  connecting: [
    "Connexion à l'agent BRH…",
    "Établissement de la liaison avec le serveur…",
    "L'agent se prépare à répondre…",
  ],
  "cold-start": [
    "Le serveur démarre après une période d'inactivité…",
    "Réveil du serveur en cours (hébergement gratuit, jusqu'à 60 secondes)…",
    "Initialisation de l'agent BRH, merci de patienter…",
  ],
  "patient-waiting": [
    "Encore quelques instants, l'agent finalise son démarrage…",
    "Le serveur termine sa mise en route, presque prêt…",
    "Patience, la réponse arrive d'ici quelques secondes…",
  ],
  unreachable: [
    "En attente de la réponse du serveur…",
    "Le serveur traite votre demande…",
    "Réponse du serveur imminente…",
  ],
};

const ROTATION_MS = 5800;

function AnimatedStatusText({ text }: { text: string }) {
  const [target, setTarget] = useState("");
  const visible = useSmoothStreamingText(target, true, {
    baseCps: 90,
    maxCps: 180,
    minCps: 36,
    lagChars: 30,
  });

  useEffect(() => setTarget(text), [text]);

  return <span>{visible}</span>;
}

export function AgentStatus({ phase }: AgentStatusProps) {
  const messages =
    phase === "idle" ? ([] as readonly string[]) : STATUS_COPY[phase];
  const [idx, setIdx] = useState(0);

  // On phase change, jump to a fresh index inside the new phase's set
  // so we don't carry over the previous phase's index.
  useEffect(() => {
    if (phase === "idle" || messages.length === 0) return;
    setIdx(Math.floor(Math.random() * messages.length));
  }, [phase, messages.length]);

  // Within the same phase, cycle the message every ROTATION_MS so the
  // user sees fresh copy while the agent is mid-flight (Pinecone
  // retrieval, multi-tool reasoning, cold start, etc.).
  useEffect(() => {
    if (phase === "idle" || messages.length <= 1) return;
    const id = setInterval(() => {
      setIdx((current) => (current + 1) % messages.length);
    }, ROTATION_MS);
    return () => clearInterval(id);
  }, [phase, messages.length]);

  if (phase === "idle" || messages.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="flex items-center gap-2 text-sm text-muted-foreground"
      role="status"
    >
      <span aria-hidden="true" className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/50 motion-reduce:hidden" />
        <span className="relative inline-flex size-2 rounded-full bg-primary" />
      </span>
      <AnimatedStatusText key={`${phase}-${idx}`} text={messages[idx]} />
    </div>
  );
}
