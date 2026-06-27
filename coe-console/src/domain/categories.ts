// ---------------------------------------------------------------------------
// 19 procurement categories with fixed brand colors, base spend ($M) and
// subcategory lists. Subcategories follow the two anchors given in the brief
// (Resins, Logistics) and are derived sensibly for the remaining categories.
// ---------------------------------------------------------------------------

export interface Category {
  id: string; // '01'..'19'
  name: string;
  color: string;
  baseSpend: number; // $M
  subcategories: string[];
}

export const CATEGORIES: Category[] = [
  {
    id: '01',
    name: 'Resins',
    color: '#4f46e5',
    baseSpend: 920,
    subcategories: ['PE', 'PP', 'PET', 'PVC', 'EVOH & Barrier', 'Masterbatch & Additives'],
  },
  {
    id: '02',
    name: 'Film',
    color: '#4338ca',
    baseSpend: 540,
    subcategories: ['BOPP', 'BOPET', 'Cast PP', 'Blown PE', 'Metallized Film', 'Specialty Barrier'],
  },
  {
    id: '03',
    name: 'Aluminium',
    color: '#6366f1',
    baseSpend: 480,
    subcategories: ['Aluminium Foil', 'Coil & Sheet', 'Lidding Foil', 'Laminated Foil', 'Container Stock'],
  },
  {
    id: '04',
    name: 'Liquids',
    color: '#7c3aed',
    baseSpend: 165,
    subcategories: ['Solvents', 'Lacquers', 'Resin Solutions', 'Water-based Liquids', 'Specialty Fluids'],
  },
  {
    id: '05',
    name: 'Paper',
    color: '#0891b2',
    baseSpend: 300,
    subcategories: ['Kraft Paper', 'Coated Paper', 'Label Paper', 'Tissue & Specialty', 'Recycled Paper'],
  },
  {
    id: '06',
    name: 'Board',
    color: '#0e7490',
    baseSpend: 380,
    subcategories: ['Folding Boxboard', 'Corrugated Board', 'Solid Bleached Board', 'Liner & Fluting', 'Cartonboard'],
  },
  {
    id: '07',
    name: 'Semi-Finished Goods',
    color: '#0f766e',
    baseSpend: 210,
    subcategories: ['Preforms', 'Laminates', 'Coated Substrates', 'Extruded Sheets', 'Converted Rolls'],
  },
  {
    id: '08',
    name: 'Other Direct',
    color: '#0d9488',
    baseSpend: 140,
    subcategories: ['Additives', 'Pigments & Colorants', 'Sealants', 'Tapes & Films', 'Misc Direct'],
  },
  {
    id: '09',
    name: 'IT & Telecom',
    color: '#2563eb',
    baseSpend: 225,
    subcategories: ['Software & SaaS', 'Hardware & Devices', 'Cloud & Hosting', 'Telecom & Connectivity', 'IT Services', 'Cybersecurity'],
  },
  {
    id: '10',
    name: 'Professional Services',
    color: '#db2777',
    baseSpend: 130,
    subcategories: ['Consulting', 'Legal', 'Audit & Tax', 'Marketing Agencies', 'Engineering Services'],
  },
  {
    id: '11',
    name: 'HR Services',
    color: '#e11d48',
    baseSpend: 90,
    subcategories: ['Recruitment', 'Training & Development', 'Payroll Services', 'Benefits & Insurance', 'Temp Labour'],
  },
  {
    id: '12',
    name: 'Travel & Entertainment',
    color: '#ea580c',
    baseSpend: 70,
    subcategories: ['Air Travel', 'Lodging', 'Ground Transport', 'Meetings & Events', 'Corporate Cards'],
  },
  {
    id: '13',
    name: 'Packaging',
    color: '#d97706',
    baseSpend: 185,
    subcategories: ['Cartons & Boxes', 'Labels', 'Flexible Packaging', 'Rigid Packaging', 'Protective Packaging'],
  },
  {
    id: '14',
    name: 'Logistics',
    color: '#ca8a04',
    baseSpend: 350,
    subcategories: ['Ocean Freight', 'Air Freight', 'Road & LTL', 'Warehousing', 'Customs & Brokerage'],
  },
  {
    id: '15',
    name: 'MRO',
    color: '#65a30d',
    baseSpend: 110,
    subcategories: ['Spare Parts', 'Tooling', 'Consumables', 'Safety Supplies', 'Lubricants'],
  },
  {
    id: '16',
    name: 'Facilities Management',
    color: '#16a34a',
    baseSpend: 95,
    subcategories: ['Cleaning & Janitorial', 'Security Services', 'Catering', 'Building Maintenance', 'Waste Management'],
  },
  {
    id: '17',
    name: 'Prepress',
    color: '#9333ea',
    baseSpend: 45,
    subcategories: ['Plate Making', 'Color Management', 'Proofing', 'Cylinder Engraving', 'Artwork Services'],
  },
  {
    id: '18',
    name: 'Energy & Utility',
    color: '#0284c7',
    baseSpend: 240,
    subcategories: ['Electricity', 'Natural Gas', 'Water & Wastewater', 'Renewable Energy', 'Steam & Heating'],
  },
  {
    id: '19',
    name: 'Equipment & Machinery',
    color: '#be123c',
    baseSpend: 160,
    subcategories: ['Production Lines', 'Packaging Machines', 'Material Handling', 'Lab Equipment', 'Spare Capital Parts'],
  },
];

export const CATEGORY_BY_NAME: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.name, c]),
);

export const BASE_SPEND: Record<string, number> = Object.fromEntries(
  CATEGORIES.map((c) => [c.name, c.baseSpend]),
);
