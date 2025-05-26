export type PlantImage = {
  url: string;
  date: string; 
  notes?: string;
};

export type Plant = {
  id: string;
  name: string;
  type: string;
  images: PlantImage[];
  description: string;
};