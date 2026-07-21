/* ---------------------------------------------------------------------------
 * Static copy: RDDCF-grounded suggestion chips and composer placeholders.
 * The chip questions reference real article themes from the four corpus
 * volumes (Vol. I/III/IV/V); see data/processed/*.md.
 * ------------------------------------------------------------------------- */

export const SUGGESTIONS = [
  "Quels sont les objectifs de la RDCCF ?",
  "Que retenir sur la protection des consommateurs financiers ?",
  "Comment le mouvement coopératif est-il organisé en Haïti ?",
  "Comment prévenir le surendettement selon la BRH ?",
] as const;

export const PLACEHOLDER_PROMPTS = [
  "Posez une question sur la RDDCF…",
  "Demandez un résumé d'un article…",
  "Interrogez la revue sur l'inclusion financière…",
] as const;
