import { Verse } from "../types";
import { 
  chapter1Data,
  chapter2Data,
  chapter3Data,
  chapter4Data,
  chapter5Data,
  chapter6Data,
  chapter7Data,
  chapter8Data,
  chapter9Data,
  chapter10Data,
  chapter11Data,
  chapter12Data,
  chapter13Data,
  chapter14Data,
  chapter15Data,
  chapter16Data,
  chapter17Data,
  chapter18Data
} from "./gitaVerses";

// Re-export all chapter datasets representing the full Gita
export {
  chapter1Data,
  chapter2Data,
  chapter3Data,
  chapter4Data,
  chapter5Data,
  chapter6Data,
  chapter7Data,
  chapter8Data,
  chapter9Data,
  chapter10Data,
  chapter11Data,
  chapter12Data,
  chapter13Data,
  chapter14Data,
  chapter15Data,
  chapter16Data,
  chapter17Data,
  chapter18Data
};

// Combine all loaded arrays into a convenient dictionary map:
export const chaptersCollection: Record<number, Verse[]> = {
  1: chapter1Data,
  2: chapter2Data,
  3: chapter3Data,
  4: chapter4Data,
  5: chapter5Data,
  6: chapter6Data,
  7: chapter7Data,
  8: chapter8Data,
  9: chapter9Data,
  10: chapter10Data,
  11: chapter11Data,
  12: chapter12Data,
  13: chapter13Data,
  14: chapter14Data,
  15: chapter15Data,
  16: chapter16Data,
  17: chapter17Data,
  18: chapter18Data
};
