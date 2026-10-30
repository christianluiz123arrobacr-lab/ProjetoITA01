import { z } from "zod";

export const publicRankingInputSchema = z
  .object({
    period: z.enum(["24h", "season", "7d", "30d", "all"]).default("season"),
    subject: z.enum(["all", "matematica", "fisica", "quimica"]).default("all"),
    timeZone: z
      .string()
      .max(80)
      .default("America/Sao_Paulo")
      .refine(value => {
        try {
          new Intl.DateTimeFormat("en", { timeZone: value });
          return true;
        } catch {
          return false;
        }
      }, "Fuso horário inválido."),
  })
  .default({ period: "season", subject: "all", timeZone: "America/Sao_Paulo" });

export type PublicRankingInput = z.infer<typeof publicRankingInputSchema>;
export type PublicRankingRow = {
  userId: string;
  nome: string;
  avatarKey: string;
  score: number;
  correctCount: number;
  correctAttempts: number;
  totalAttempts: number;
  accuracy: number;
  avgTimeSeconds: number;
  easyCorrect: number;
  mediumCorrect: number;
  hardCorrect: number;
  veryHardCorrect: number;
  topStreak: number;
  // Coarse calendar date only: no individual answer timestamp is public.
  lastActivityDay: string | null;
  positionDelta: number | null;
};
export type PublicRankingDto = {
  ranking: PublicRankingRow[];
  seasonRanking: PublicRankingRow[];
};
