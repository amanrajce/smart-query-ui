export interface ClinicalData {
  clinical_reasoning_scratchpad?: string;
  normalized_symptoms: string[];
  conditions: {
    name: string;
    confidence: number;
    reason: string;
  }[];
  red_flags: string[];
  urgency: 'low' | 'medium' | 'high';
  next_steps: {
    consult: string;
    tests: string[];
    advice: string[];
  };
  sources?: string[]; // 🧰 ADD THIS LINE!
  disclaimer: string;
}