import { useEffect, useState } from "react";

import { useSmoothStreamingText } from "@/hooks/useSmoothStreamingText";
import type { AgentPhase } from "../_lib/message-parts";

type AgentStatusProps = {
  phase: AgentPhase;
};

type ActivePhase = Exclude<AgentPhase, "idle">;

const STATUS_COPY: Record<ActivePhase, readonly [string, string, string]> = {
  thinking: [
    "Analyse de votre question…",
    "Examen de votre demande…",
    "Préparation de la recherche…",
  ],
  searching: [
    "Recherche dans la documentation BRH…",
    "Exploration des ressources de la BRH…",
    "Recherche des passages pertinents…",
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
  researching: [
    "Recherche complémentaire dans la documentation BRH…",
    "Approfondissement de la recherche…",
    "Vérification d’autres sources pertinentes…",
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
    "Serveur momentanément inaccessible, nouvelle tentative…",
    "Connexion au serveur impossible pour l'instant…",
    "Impossible de joindre le serveur BRH, merci de patienter…",
  ],
};

function randomStatus(phase: ActivePhase): string {
  const messages = STATUS_COPY[phase];
  return messages[Math.floor(Math.random() * messages.length)];
}

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
  const [statusText, setStatusText] = useState<string>(() =>
    phase === "idle" ? "" : STATUS_COPY[phase][0]
  );

  useEffect(() => {
    if (phase !== "idle") setStatusText(randomStatus(phase));
  }, [phase]);

  if (phase === "idle") return null;

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
      <AnimatedStatusText key={statusText} text={statusText} />
    </div>
  );
}
