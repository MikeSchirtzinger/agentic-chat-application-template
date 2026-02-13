export interface PresetLens {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  prompt: string;
}

export interface CustomLens {
  id: string;
  name: string;
  description: string;
  prompt: string;
  icon: string;
  originalInput: string;
  createdAt: string;
}

export type Lens = PresetLens | CustomLens;

export function isCustomLens(lens: Lens): lens is CustomLens {
  return "originalInput" in lens;
}
