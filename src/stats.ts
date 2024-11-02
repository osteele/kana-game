export interface KanaStats {
  correct: number;
  wrong: number;
  lastSeen?: number;
}

export interface KanaStatsMap {
  [key: string]: KanaStats;
}
