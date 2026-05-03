export type GalleryItem = {
  id: number;
  title: string;
  collection: string;
  tag: string;
  date: string;
  size: string;
  aspectRatio: number; // height / width
  placeholderColor: string;
  svgPattern: 'circles' | 'lines' | 'grid' | 'noise' | 'arcs' | 'dots';
  // Always undefined here — gallery uses generated SVG placeholders so we
  // skip bundling 11 image assets. Field is kept for component compatibility.
  image?: string;
};

export const COLLECTIONS = [
  { label: 'All Works', count: 48, color: '#555' },
  { label: 'Architecture', count: 12, color: '#7c6fcd' },
  { label: 'Abstract', count: 9, color: '#5c9eb8' },
  { label: 'Portraiture', count: 7, color: '#b87a5c' },
  { label: 'Still Life', count: 11, color: '#5cb87a' },
  { label: 'Landscape', count: 9, color: '#b8b05c' },
];

export const ITEMS: GalleryItem[] = [
  {
    id: 1,
    title: 'Linear Study No. 1',
    collection: 'Architecture',
    tag: 'RAW',
    date: 'Mar 2024',
    size: '48 MB',
    aspectRatio: 1.25,
    placeholderColor: '#1a1a2e',
    svgPattern: 'lines',
  },
  {
    id: 2,
    title: 'Concentric Drift',
    collection: 'Abstract',
    tag: 'TIFF',
    date: 'Feb 2024',
    size: '22 MB',
    aspectRatio: 0.75,
    placeholderColor: '#1e2a1e',
    svgPattern: 'circles',
  },
  {
    id: 3,
    title: 'Lattice Form',
    collection: 'Abstract',
    tag: 'RAW',
    date: 'Mar 2024',
    size: '51 MB',
    aspectRatio: 1.0,
    placeholderColor: '#2a1e1e',
    svgPattern: 'grid',
  },
  {
    id: 4,
    title: 'Field of Points',
    collection: 'Still Life',
    tag: 'JPEG',
    date: 'Jan 2024',
    size: '8 MB',
    aspectRatio: 0.8,
    placeholderColor: '#1e1e2a',
    svgPattern: 'dots',
  },
  {
    id: 6,
    title: 'Diamond Field',
    collection: 'Portraiture',
    tag: 'TIFF',
    date: 'Nov 2023',
    size: '31 MB',
    aspectRatio: 1.4,
    placeholderColor: '#1a1a2e',
    svgPattern: 'arcs',
  },
  {
    id: 7,
    title: 'Diagonal Hatch',
    collection: 'Abstract',
    tag: 'RAW',
    date: 'Mar 2024',
    size: '47 MB',
    aspectRatio: 1.0,
    placeholderColor: '#251e2a',
    svgPattern: 'noise',
  },
  {
    id: 8,
    title: 'Grid Variation II',
    collection: 'Abstract',
    tag: 'JPEG',
    date: 'Feb 2024',
    size: '12 MB',
    aspectRatio: 1.6,
    placeholderColor: '#1e2025',
    svgPattern: 'grid',
  },
  {
    id: 9,
    title: 'Stippled Plane',
    collection: 'Still Life',
    tag: 'RAW',
    date: 'Jan 2024',
    size: '39 MB',
    aspectRatio: 0.9,
    placeholderColor: '#201e1a',
    svgPattern: 'dots',
  },
  {
    id: 11,
    title: 'Concentric Form',
    collection: 'Still Life',
    tag: 'RAW',
    date: 'Dec 2023',
    size: '52 MB',
    aspectRatio: 1.2,
    placeholderColor: '#201e25',
    svgPattern: 'circles',
  },
  {
    id: 12,
    title: 'Curvature Study',
    collection: 'Abstract',
    tag: 'TIFF',
    date: 'Nov 2023',
    size: '19 MB',
    aspectRatio: 1.0,
    placeholderColor: '#1a1e2a',
    svgPattern: 'arcs',
  },
];
