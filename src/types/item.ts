import type { Effect, Trigger } from "./card";

export interface RelicData {
  id: string;
  name: string;
  description: string;
  trigger?: Trigger;
  effects: Effect[];
}

export interface PotionData {
  id: string;
  name: string;
  description: string;
  targeted: boolean;
  effects: Effect[];
}
