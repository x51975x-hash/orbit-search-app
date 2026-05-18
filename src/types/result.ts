export interface Result {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  advertiser: string;
  url: string;
  displayUrl: string;
  tags: string[];
  image?: string;
  isVisual?: boolean;
  phone?: string;
  email?: string;
  mapsUrl?: string;
  twitter?: string;
  github?: string;
}
