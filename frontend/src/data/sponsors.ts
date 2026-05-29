// Curated database of major Private Equity sponsors active in European LL&PD market.
// Data sourced from public information (PitchBook, Preqin, sponsor websites, press releases).
// Last updated: 2026-Q1

export type SponsorTier = 'Mega' | 'Large' | 'Mid-cap' | 'Lower-mid'
export type SponsorRegion = 'US' | 'Europe' | 'UK' | 'Nordic' | 'France' | 'Global'

export interface SponsorDeal {
  company: string
  year: number
  sector: string
  ev?: number              // €M
  evMultiple?: number      // x EBITDA at entry
  leverage?: number        // x Net Debt/EBITDA at close
  status: 'active' | 'exited' | 'partial-exit' | 'distressed' | 'default'
  notes?: string
}

export interface Sponsor {
  id: string
  name: string
  shortName?: string
  hq: string                      // city
  region: SponsorRegion
  tier: SponsorTier
  aum: number                     // €Bn
  fundedYear: number
  latestFund?: { name: string; size: number; vintage: number }  // size in €Bn
  sectors: string[]               // primary sectors of focus
  strategy: string[]              // ['LBO', 'Growth', 'Distressed', 'Infrastructure', 'Credit']
  europeFocus: boolean
  recentDeals: SponsorDeal[]
  trackRecord: {
    avgIRR?: number               // % gross IRR (estimated, public)
    avgMOIC?: number              // x
    knownDefaults?: number        // count of bankruptcies / restructurings
  }
  notableExits?: string[]
  description: string
  website?: string
}

// ─── Sponsors ─────────────────────────────────────────────────────────────────

export const SPONSORS: Sponsor[] = [
  {
    id: 'kkr',
    name: 'KKR & Co.',
    shortName: 'KKR',
    hq: 'New York',
    region: 'US',
    tier: 'Mega',
    aum: 600,
    fundedYear: 1976,
    latestFund: { name: 'European Fund VI', size: 8.0, vintage: 2024 },
    sectors: ['Industrials', 'Healthcare', 'Tech', 'Consumer', 'Financial Services', 'Infrastructure'],
    strategy: ['LBO', 'Growth', 'Infrastructure', 'Credit', 'Real Estate'],
    europeFocus: true,
    recentDeals: [
      { company: 'OHB SE', year: 2023, sector: 'Aerospace', ev: 600, evMultiple: 9.5, status: 'active' },
      { company: 'Telecom Italia (NetCo)', year: 2024, sector: 'Telecom', ev: 22000, status: 'active', notes: 'Network infrastructure carve-out' },
      { company: 'Encavis AG', year: 2024, sector: 'Renewables', ev: 2800, status: 'active' },
      { company: 'Bridge Industrial', year: 2023, sector: 'Logistics', ev: 1800, status: 'active' },
      { company: 'Q-Park', year: 2017, sector: 'Parking', ev: 2950, status: 'exited', notes: 'Sold to Hellman & Friedman 2024' },
    ],
    trackRecord: { avgIRR: 18, avgMOIC: 2.1, knownDefaults: 2 },
    notableExits: ['Q-Park (2024)', 'Hilton Worldwide', 'PetSmart'],
    description: 'Pioneer of the LBO industry. Multi-strategy global PE with strong European presence. Known for taking large stakes in industrials and infrastructure.',
    website: 'kkr.com',
  },
  {
    id: 'cvc',
    name: 'CVC Capital Partners',
    shortName: 'CVC',
    hq: 'Luxembourg',
    region: 'Europe',
    tier: 'Mega',
    aum: 200,
    fundedYear: 1981,
    latestFund: { name: 'Capital Partners IX', size: 26.0, vintage: 2023 },
    sectors: ['Consumer', 'Healthcare', 'Tech', 'Sports & Media', 'Financial Services'],
    strategy: ['LBO', 'Growth', 'Credit', 'Secondaries'],
    europeFocus: true,
    recentDeals: [
      { company: 'Naturgy (stake)', year: 2023, sector: 'Utilities', ev: 4500, status: 'active' },
      { company: 'WGSN', year: 2023, sector: 'Tech/Media', ev: 800, evMultiple: 14, status: 'active' },
      { company: 'La Liga', year: 2021, sector: 'Sports', ev: 2700, status: 'active', notes: '50-year media rights deal' },
      { company: 'Université DCC', year: 2024, sector: 'Education', ev: 600, status: 'active' },
      { company: 'Quironsalud', year: 2014, sector: 'Healthcare', ev: 5800, status: 'exited', notes: 'Sold to Fresenius 2017, ~3.5x MOIC' },
    ],
    trackRecord: { avgIRR: 17, avgMOIC: 2.4, knownDefaults: 3 },
    notableExits: ['Quironsalud (2017)', 'Petco', 'Avast'],
    description: 'European PE leader, IPO\'d in 2024. Strong in consumer, healthcare, and recently sports & media (F1, La Liga, Six Nations rugby).',
    website: 'cvc.com',
  },
  {
    id: 'eqt',
    name: 'EQT AB',
    shortName: 'EQT',
    hq: 'Stockholm',
    region: 'Nordic',
    tier: 'Mega',
    aum: 250,
    fundedYear: 1994,
    latestFund: { name: 'Fund X', size: 22.0, vintage: 2023 },
    sectors: ['Healthcare', 'Tech', 'Industrials', 'Services', 'Infrastructure'],
    strategy: ['LBO', 'Growth', 'Infrastructure', 'Real Estate', 'Public Equity'],
    europeFocus: true,
    recentDeals: [
      { company: 'Nord Anglia Education', year: 2024, sector: 'Education', ev: 14500, evMultiple: 18, status: 'active' },
      { company: 'IFS', year: 2022, sector: 'Software', ev: 10000, evMultiple: 22, status: 'active', notes: 'Together with Hg' },
      { company: 'Schülke', year: 2024, sector: 'Healthcare', ev: 1200, status: 'active' },
      { company: 'Galderma', year: 2019, sector: 'Pharma', ev: 10000, status: 'partial-exit', notes: 'IPO 2024' },
      { company: 'IVI-RMA', year: 2022, sector: 'Healthcare', ev: 3000, status: 'active', notes: 'Fertility clinics' },
    ],
    trackRecord: { avgIRR: 19, avgMOIC: 2.5, knownDefaults: 1 },
    notableExits: ['Galderma IPO (2024)', 'Husqvarna', 'AVRO Energy'],
    description: 'Nordic PE leader, listed on Nasdaq Stockholm. Best-in-class operating model with industrial advisors. Strong digital and healthcare focus.',
    website: 'eqtgroup.com',
  },
  {
    id: 'apollo',
    name: 'Apollo Global Management',
    shortName: 'Apollo',
    hq: 'New York',
    region: 'US',
    tier: 'Mega',
    aum: 700,
    fundedYear: 1990,
    latestFund: { name: 'Fund X', size: 20.0, vintage: 2023 },
    sectors: ['Financial Services', 'Industrials', 'Consumer', 'Telecom', 'Real Estate'],
    strategy: ['LBO', 'Distressed', 'Credit', 'Yield', 'Hybrid Capital'],
    europeFocus: true,
    recentDeals: [
      { company: 'Atlas Air Worldwide', year: 2023, sector: 'Aviation', ev: 5200, status: 'active' },
      { company: 'Yahoo!', year: 2021, sector: 'Tech/Media', ev: 5000, status: 'active' },
      { company: 'Univar Solutions', year: 2023, sector: 'Chemicals', ev: 8100, status: 'active' },
      { company: 'Tessellis (formerly Tiscali)', year: 2024, sector: 'Telecom', ev: 800, status: 'active' },
      { company: 'Aspen Pharmacare (stake)', year: 2024, sector: 'Pharma', ev: 1200, status: 'active' },
    ],
    trackRecord: { avgIRR: 22, avgMOIC: 2.2, knownDefaults: 5 },
    notableExits: ['ADT Security', 'Caesars Entertainment'],
    description: 'Largest credit-PE platform globally. Known for complex distressed and value plays. Athene insurance subsidiary funds large deals.',
    website: 'apollo.com',
  },
  {
    id: 'blackstone',
    name: 'Blackstone Inc.',
    shortName: 'Blackstone',
    hq: 'New York',
    region: 'US',
    tier: 'Mega',
    aum: 1100,
    fundedYear: 1985,
    latestFund: { name: 'Capital Partners IX', size: 25.0, vintage: 2023 },
    sectors: ['Real Estate', 'Tech', 'Healthcare', 'Industrials', 'Energy'],
    strategy: ['LBO', 'Real Estate', 'Credit', 'Infrastructure', 'Tactical Opportunities'],
    europeFocus: true,
    recentDeals: [
      { company: 'Hipgnosis Songs Fund', year: 2024, sector: 'Music IP', ev: 1700, status: 'active' },
      { company: 'Adevinta', year: 2023, sector: 'Tech/Marketplaces', ev: 14000, status: 'active', notes: 'With Permira, take-private' },
      { company: 'Refinitiv', year: 2018, sector: 'FinTech', ev: 20000, status: 'exited', notes: 'Sold to LSEG 2021, ~3x MOIC' },
      { company: 'Mileway', year: 2019, sector: 'Real Estate', ev: 21000, status: 'active', notes: 'Largest European RE deal' },
      { company: 'Esdec', year: 2022, sector: 'Solar mounting', ev: 1800, status: 'active' },
    ],
    trackRecord: { avgIRR: 16, avgMOIC: 2.0, knownDefaults: 2 },
    notableExits: ['Refinitiv (2021)', 'Hilton (2007 LBO, post-IPO exit)', 'Stearns Lending'],
    description: 'World\'s largest alternative asset manager. Dominant in Real Estate (BREIT) and credit. Selective in PE with mega-deal capability.',
    website: 'blackstone.com',
  },
  {
    id: 'carlyle',
    name: 'The Carlyle Group',
    shortName: 'Carlyle',
    hq: 'Washington DC',
    region: 'US',
    tier: 'Mega',
    aum: 425,
    fundedYear: 1987,
    latestFund: { name: 'Europe Partners V', size: 6.4, vintage: 2022 },
    sectors: ['Industrials', 'Aerospace & Defense', 'Healthcare', 'Tech', 'Financial Services'],
    strategy: ['LBO', 'Growth', 'Credit', 'Real Assets'],
    europeFocus: true,
    recentDeals: [
      { company: 'Praesidiad (Betafence)', year: 2018, sector: 'Industrial', ev: 950, status: 'distressed', notes: 'Restructured 2023' },
      { company: 'NMC Health (post-fraud)', year: 2024, sector: 'Healthcare', ev: 1500, status: 'active' },
      { company: 'CommScope', year: 2024, sector: 'Telecom equip.', ev: 4000, status: 'active' },
      { company: 'Forgital Italy', year: 2024, sector: 'Aerospace', ev: 1200, status: 'active' },
    ],
    trackRecord: { avgIRR: 14, avgMOIC: 1.8, knownDefaults: 4 },
    notableExits: ['Booz Allen', 'Hertz (pre-2020 BK)'],
    description: 'Defense and aerospace specialist with strong global LP base. Recently restructured leadership and refocused on core PE.',
    website: 'carlyle.com',
  },
  {
    id: 'permira',
    name: 'Permira',
    hq: 'London',
    region: 'UK',
    tier: 'Large',
    aum: 80,
    fundedYear: 1985,
    latestFund: { name: 'Fund VIII', size: 16.7, vintage: 2023 },
    sectors: ['Tech', 'Consumer', 'Healthcare', 'Services', 'Financial Services'],
    strategy: ['LBO', 'Growth'],
    europeFocus: true,
    recentDeals: [
      { company: 'Adevinta', year: 2023, sector: 'Tech/Marketplaces', ev: 14000, status: 'active', notes: 'With Blackstone' },
      { company: 'Ergomed', year: 2023, sector: 'Healthcare CRO', ev: 800, status: 'active' },
      { company: 'Reorg', year: 2022, sector: 'Tech/Data', ev: 1200, status: 'active' },
      { company: 'Mimecast', year: 2022, sector: 'Cybersecurity', ev: 5800, status: 'active' },
      { company: 'Allegro', year: 2017, sector: 'Tech/E-commerce', ev: 3250, status: 'partial-exit', notes: 'IPO 2020, exited 2022' },
    ],
    trackRecord: { avgIRR: 18, avgMOIC: 2.3, knownDefaults: 1 },
    notableExits: ['Allegro IPO', 'Iglo Foods', 'Hugo Boss'],
    description: 'Top European PE firm with a strong tech track record. Known for its operational expertise.',
    website: 'permira.com',
  },
  {
    id: 'bridgepoint',
    name: 'Bridgepoint Group',
    shortName: 'Bridgepoint',
    hq: 'London',
    region: 'UK',
    tier: 'Large',
    aum: 60,
    fundedYear: 1984,
    latestFund: { name: 'Europe VII', size: 7.0, vintage: 2022 },
    sectors: ['Healthcare', 'Consumer', 'Services', 'Financial Services', 'Tech'],
    strategy: ['LBO', 'Growth', 'Credit'],
    europeFocus: true,
    recentDeals: [
      { company: 'Achilles Information', year: 2023, sector: 'Tech/Compliance', ev: 600, status: 'active' },
      { company: 'PEI Group', year: 2024, sector: 'Media/Data', ev: 800, status: 'active' },
      { company: 'Dorna Sports (MotoGP)', year: 2024, sector: 'Sports', ev: 4200, status: 'partial-exit', notes: 'Liberty Media acquisition pending' },
      { company: 'Diaverum', year: 2021, sector: 'Healthcare', ev: 2500, status: 'active' },
    ],
    trackRecord: { avgIRR: 20, avgMOIC: 2.4, knownDefaults: 1 },
    notableExits: ['MotoGP (2024 announced)', 'Pret A Manger', 'Element Materials'],
    description: 'Mid-market European PE leader, IPO\'d in 2021. Strong in services, healthcare, and consumer.',
    website: 'bridgepoint.eu',
  },
  {
    id: 'pai',
    name: 'PAI Partners',
    shortName: 'PAI',
    hq: 'Paris',
    region: 'France',
    tier: 'Large',
    aum: 27,
    fundedYear: 1872,
    latestFund: { name: 'Europe VIII', size: 7.1, vintage: 2023 },
    sectors: ['Consumer', 'Food & Beverage', 'Industrials', 'Healthcare', 'Services'],
    strategy: ['LBO', 'Mid-Market'],
    europeFocus: true,
    recentDeals: [
      { company: 'Compleat Food Group', year: 2021, sector: 'Food', ev: 950, status: 'active' },
      { company: 'Looping', year: 2021, sector: 'Leisure parks', ev: 800, status: 'active' },
      { company: 'Apleona', year: 2023, sector: 'Facility Services', ev: 4000, status: 'active' },
      { company: 'NovaTaste', year: 2024, sector: 'Food ingredients', ev: 2200, status: 'active' },
      { company: 'Areas (HMSHost intl.)', year: 2023, sector: 'Travel F&B', ev: 1800, status: 'active' },
    ],
    trackRecord: { avgIRR: 17, avgMOIC: 2.1, knownDefaults: 2 },
    notableExits: ['Yoplait', 'Atos (partial)', 'Albéa'],
    description: 'Historic French PE firm (originally Paribas Affaires Industrielles). Strong food/consumer focus, mid-market deal sizes €1-3Bn typical.',
    website: 'paipartners.com',
  },
  {
    id: 'ardian',
    name: 'Ardian',
    hq: 'Paris',
    region: 'France',
    tier: 'Large',
    aum: 165,
    fundedYear: 1996,
    latestFund: { name: 'Buyout Fund VIII', size: 7.0, vintage: 2023 },
    sectors: ['Industrials', 'Healthcare', 'Tech', 'Infrastructure', 'Real Estate'],
    strategy: ['LBO', 'Secondaries', 'Infrastructure', 'Credit', 'Real Assets'],
    europeFocus: true,
    recentDeals: [
      { company: 'Florac Investissements', year: 2024, sector: 'Diversified', ev: 1500, status: 'active' },
      { company: 'GBA Group', year: 2024, sector: 'Testing services', ev: 1100, status: 'active' },
      { company: 'Vista Global', year: 2023, sector: 'Aviation', ev: 4500, status: 'active' },
      { company: 'Audiotonix', year: 2022, sector: 'Pro audio', ev: 2200, status: 'active' },
    ],
    trackRecord: { avgIRR: 16, avgMOIC: 2.0, knownDefaults: 1 },
    notableExits: ['Trescal', 'INSEEC U.', 'Indigo Group'],
    description: 'European PE & secondaries leader, originally AXA Private Equity. Largest LP-led secondaries platform globally.',
    website: 'ardian.com',
  },
  {
    id: 'eurazeo',
    name: 'Eurazeo',
    hq: 'Paris',
    region: 'France',
    tier: 'Large',
    aum: 35,
    fundedYear: 1969,
    latestFund: { name: 'Mid-Large Buyout V', size: 4.0, vintage: 2022 },
    sectors: ['Consumer', 'Tech', 'Healthcare', 'Financial Services', 'SMID-cap'],
    strategy: ['LBO', 'Growth', 'Venture', 'Real Estate', 'Private Debt'],
    europeFocus: true,
    recentDeals: [
      { company: 'Sommet Education', year: 2023, sector: 'Education', ev: 700, status: 'active' },
      { company: 'CPK', year: 2024, sector: 'Industrial parts', ev: 600, status: 'active' },
      { company: 'Hammerson (stake)', year: 2024, sector: 'Real Estate', ev: 800, status: 'active' },
      { company: 'Trader Interactive', year: 2022, sector: 'Tech/Marketplaces', ev: 1700, status: 'active' },
    ],
    trackRecord: { avgIRR: 14, avgMOIC: 1.9, knownDefaults: 0 },
    notableExits: ['Iberchem (sold to Croda)', 'Asmodee', 'Idinvest (merger)'],
    description: 'Listed PE platform with multi-strategy approach (large LBO, mid-cap, growth, venture, debt). Strong consumer expertise.',
    website: 'eurazeo.com',
  },
  {
    id: 'tikehau',
    name: 'Tikehau Capital',
    shortName: 'Tikehau',
    hq: 'Paris',
    region: 'France',
    tier: 'Mid-cap',
    aum: 47,
    fundedYear: 2004,
    latestFund: { name: 'Direct Lending V', size: 3.5, vintage: 2023 },
    sectors: ['Industrials', 'Healthcare', 'Tech', 'Aerospace & Defense', 'Energy Transition'],
    strategy: ['Private Debt', 'LBO', 'Real Assets', 'Capital Markets'],
    europeFocus: true,
    recentDeals: [
      { company: 'Egis Group', year: 2023, sector: 'Engineering', ev: 1500, status: 'active' },
      { company: 'EuroAtlantic Airways', year: 2024, sector: 'Aviation', ev: 400, status: 'active' },
      { company: 'Aerospace Defense fund', year: 2024, sector: 'Aerospace', ev: 800, status: 'active', notes: 'Thematic fund launched 2023' },
    ],
    trackRecord: { avgIRR: 15, avgMOIC: 1.8, knownDefaults: 1 },
    notableExits: ['Preligens (sold to Safran 2024)', 'Asia Power'],
    description: 'Listed alternative asset manager, dominant European direct lender. Strong aerospace & defense thematic.',
    website: 'tikehaucapital.com',
  },
  {
    id: 'antin',
    name: 'Antin Infrastructure Partners',
    shortName: 'Antin',
    hq: 'Paris',
    region: 'France',
    tier: 'Large',
    aum: 32,
    fundedYear: 2007,
    latestFund: { name: 'Fund V', size: 10.2, vintage: 2023 },
    sectors: ['Infrastructure', 'Telecom', 'Energy Transition', 'Transport', 'Social'],
    strategy: ['Infrastructure'],
    europeFocus: true,
    recentDeals: [
      { company: 'Babilou', year: 2023, sector: 'Childcare', ev: 1700, status: 'active' },
      { company: 'OPDEnergy', year: 2024, sector: 'Renewables', ev: 850, status: 'active' },
      { company: 'GTT (Gazprom Transit)', year: 2024, sector: 'Energy', ev: 600, status: 'active' },
    ],
    trackRecord: { avgIRR: 13, avgMOIC: 1.7, knownDefaults: 0 },
    notableExits: ['Eurofiber (partial)', 'ASTM Toll Roads'],
    description: 'Pure-play European infrastructure investor. Listed in 2021. Focus on essential services and energy transition.',
    website: 'antin-ip.com',
  },
  {
    id: 'apax',
    name: 'Apax Partners',
    shortName: 'Apax',
    hq: 'London',
    region: 'UK',
    tier: 'Large',
    aum: 65,
    fundedYear: 1972,
    latestFund: { name: 'Apax XI', size: 12.0, vintage: 2024 },
    sectors: ['Tech', 'Healthcare', 'Services', 'Internet/Consumer'],
    strategy: ['LBO', 'Growth'],
    europeFocus: true,
    recentDeals: [
      { company: 'Thoughtworks', year: 2024, sector: 'Tech/Consulting', ev: 1750, status: 'active', notes: 'Take-private' },
      { company: 'Bushu Pharmaceuticals', year: 2023, sector: 'Pharma CDMO', ev: 700, status: 'active' },
      { company: 'PIB Group', year: 2021, sector: 'Insurance broker', ev: 1500, status: 'active' },
    ],
    trackRecord: { avgIRR: 18, avgMOIC: 2.2, knownDefaults: 2 },
    notableExits: ['Idealista', 'Trader Interactive', 'Kinaxis'],
    description: 'Tech-focused PE with strong sector verticalization. Known for software and digital services investments.',
    website: 'apax.com',
  },
  {
    id: 'partners-group',
    name: 'Partners Group',
    shortName: 'Partners Group',
    hq: 'Zug',
    region: 'Europe',
    tier: 'Large',
    aum: 150,
    fundedYear: 1996,
    latestFund: { name: 'Direct Equity 2024', size: 15.0, vintage: 2024 },
    sectors: ['Healthcare', 'Goods & Services', 'Tech', 'Industrials'],
    strategy: ['LBO', 'Growth', 'Real Assets', 'Private Debt', 'Royalties'],
    europeFocus: true,
    recentDeals: [
      { company: 'Civica', year: 2023, sector: 'GovTech', ev: 1500, status: 'active' },
      { company: 'Reedy Industries', year: 2023, sector: 'HVAC services', ev: 1100, status: 'active' },
      { company: 'Velvet CARE', year: 2024, sector: 'Hygiene products', ev: 800, status: 'active' },
    ],
    trackRecord: { avgIRR: 15, avgMOIC: 1.9, knownDefaults: 0 },
    notableExits: ['Foncia (2021)', 'Action (partial 2020)'],
    description: 'Listed Swiss alternative asset manager. Diversified across PE, real assets, debt. Mid-market focus with global footprint.',
    website: 'partnersgroup.com',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getSponsorById(id: string): Sponsor | undefined {
  return SPONSORS.find(s => s.id === id)
}

export function getSponsorsBySector(sector: string): Sponsor[] {
  const s = sector.toLowerCase()
  return SPONSORS.filter(sp => sp.sectors.some(x => x.toLowerCase().includes(s)))
}

export function getSponsorsByRegion(region: SponsorRegion): Sponsor[] {
  return SPONSORS.filter(s => s.region === region)
}

// Sector benchmarks derived from recent deals (median EV/EBITDA per sector)
export function getSectorBenchmarks(): Record<string, {
  medianEvMultiple: number | null
  dealCount: number
  recentDeals: SponsorDeal[]
}> {
  const map: Record<string, SponsorDeal[]> = {}
  SPONSORS.forEach(sp => {
    sp.recentDeals.forEach(d => {
      const key = d.sector
      if (!map[key]) map[key] = []
      map[key].push(d)
    })
  })

  const benchmarks: Record<string, { medianEvMultiple: number | null; dealCount: number; recentDeals: SponsorDeal[] }> = {}
  Object.entries(map).forEach(([sector, deals]) => {
    const multiples = deals.map(d => d.evMultiple).filter((x): x is number => x != null && !isNaN(x))
    multiples.sort((a, b) => a - b)
    const median = multiples.length === 0 ? null : multiples.length % 2 === 1
      ? multiples[Math.floor(multiples.length / 2)]
      : (multiples[multiples.length / 2 - 1] + multiples[multiples.length / 2]) / 2
    benchmarks[sector] = {
      medianEvMultiple: median,
      dealCount: deals.length,
      recentDeals: deals.sort((a, b) => b.year - a.year).slice(0, 5),
    }
  })
  return benchmarks
}
