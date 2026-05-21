import type {Coordinates} from './location';

export type MapMarkerKind = 'you' | 'friend' | 'place';

export type GooglePlaceMetadata = {
  placeId: string;
  name: string;
  address?: string;
  rating?: number;
  userRatingsTotal?: number;
  types?: string[];
  openNow?: boolean;
};

export type MapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  kind: MapMarkerKind;
  title?: string;
  description?: string;
  place?: GooglePlaceMetadata;
  sharedBy?: string;
  coordinates?: Coordinates;
};
