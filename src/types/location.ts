export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type SharedLocation = Coordinates & {
  label: string;
  sharedAt: string;
};

export type LocationHistoryItem = {
  id: string;
  label: string;
  city?: string;
  coordinates: Coordinates;
  visitedAt: string;
};
