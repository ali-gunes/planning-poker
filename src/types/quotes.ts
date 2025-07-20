export type QuoteType = 'medianLow' | 'medianHigh' | 'general' | 'consensus' | 'hugeDifference';

export interface QuoteSettings {
  showOnGeneral: boolean;
  showOnMedianLow: boolean;
  showOnMedianHigh: boolean;
  showOnConsensus: boolean;
  showOnHugeDifference: boolean;
  quoteProbability: number;
}

export interface QuoteItem {
  id: string;
  name: string;
  role: string;
  quote: string;
  /**
   * Short punchline or context shown above the main quote, e.g. "Sprint 42" or "PR #123".
   * Optional for backward-compatibility with existing packs.
   */
  phrase?: string;
  animation: string;
  color: string;
}

export interface QuoteSystem {
  teamName: string;
  teamDescription: string;
  settings: QuoteSettings;
  medianLowQuotes: QuoteItem[];
  medianHighQuotes: QuoteItem[];
  generalQuotes: QuoteItem[];
  consensusQuotes: QuoteItem[];
  hugeDifferenceQuotes: QuoteItem[];
}

export type QuoteSystemType = 'none' | 'ci-team' | 'custom';