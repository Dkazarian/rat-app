import type { CapturedExpenseCandidate } from "./use-page-session";

const phaseFourDemoBatch: ReadonlyArray<CapturedExpenseCandidate> = [
  { description: "Lunch", amountMinor: 1_800, categoryId: "food" },
  { description: "Coffee", amountMinor: 450, categoryId: "food" },
  { description: "Taxi", amountMinor: 1_200, categoryId: "transport" },
];

export function producePhaseFourDemoBatch(
  inputValue: string,
): ReadonlyArray<CapturedExpenseCandidate> {
  void inputValue;
  return phaseFourDemoBatch;
}
