// ── Clarifying Questions Types ───────────────────────────────────────────

export interface Refinement {
  label: string;                       // "Style", "Budget", "Size"
  options: string[];                    // ["Sneakers", "Casual", "Formal"]
  type?: "buttons" | "spectrum";        // default "buttons"
  spectrumRange?: [number, number];     // for budget: [0, 500]
  /** Full question text from the refiner. When present, QuestionCard uses
   *  this directly instead of generating "What {label} are you looking for?" */
  questionText?: string;
}

export interface ClarifyResponse {
  ready: boolean;
  query?: string;
  productName?: string;
  refinements?: Refinement[];
}

export interface ClarifyAnswer {
  label: string;
  value: string;
}

export type ClarifyPhase = "loading" | "asking" | "reviewing" | "completing" | "done";
