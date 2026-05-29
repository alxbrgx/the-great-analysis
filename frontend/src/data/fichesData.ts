// ── Fiche (flashcard) data ────────────────────────────────────────────────────

import type { TopicId } from './quizData'

export interface Fiche {
  id: string
  topic: TopicId
  front: string        // term / short question
  back: string         // definition / full answer
  formula?: string     // optional formula shown prominently on back
  tags?: string[]
}

export const FICHES: Fiche[] = [

  // ── TRAVAUX-1 : Environnement macro & sectoriel ─────────────────────────────
  {
    id: 'f-t1-01',
    topic: 'travaux-1',
    front: "Qu'est-ce que l'analyse PESTEL ?",
    back: "Cadre d'analyse de l'environnement externe d'une entreprise via 6 dimensions : Politique, Économique, Socioculturel, Technologique, Environnemental, Légal. Permet d'identifier les risques et opportunités macroéconomiques qui pèsent sur un secteur.",
    tags: ['macro', 'stratégie'],
  },
  {
    id: 'f-t1-02',
    topic: 'travaux-1',
    front: "Les 5 forces de Porter",
    back: "Cadre d'analyse de l'intensité concurrentielle d'un secteur :\n1. Rivalité entre concurrents existants\n2. Menace de nouveaux entrants\n3. Pouvoir de négociation des fournisseurs\n4. Pouvoir de négociation des clients\n5. Menace des produits / services de substitution\n\nPlus les forces sont intenses, plus la rentabilité sectorielle est comprimée.",
    tags: ['stratégie', 'secteur'],
  },
  {
    id: 'f-t1-03',
    topic: 'travaux-1',
    front: "Cycle économique et impact sur le crédit",
    back: "Phase d'expansion : EBITDA ↑, dette supportable, spreads resserrés.\nPhase de ralentissement : EBITDA ↓, couverture des intérêts détériorée, spreads élargis.\nPhase de récession : risque de défaut ↑, covenant breaches, restructurations.\n\nUn analyste LBO doit stresser le modèle sur un cycle entier (5–7 ans).",
    tags: ['macro', 'cycle', 'crédit'],
  },
  {
    id: 'f-t1-04',
    topic: 'travaux-1',
    front: "Différence entre risque systémique et risque idiosyncratique",
    back: "Risque systémique : affecte l'ensemble du marché (crise 2008, COVID-19). Non diversifiable.\nRisque idiosyncratique : propre à l'entreprise ou au secteur (perte d'un client clé, fraude). Diversifiable via un portefeuille.\n\nEn crédit privé, le risque idiosyncratique domine — d'où l'importance du due diligence.",
    tags: ['risque', 'crédit'],
  },

  // ── TRAVAUX-2 : Analyse du compte de résultat ───────────────────────────────
  {
    id: 'f-t2-01',
    topic: 'travaux-2',
    front: "Structure du compte de résultat (P&L)",
    back: "Chiffre d'affaires (CA)\n− Coût des biens vendus (COGS)\n= Marge brute\n− Charges opérationnelles (SG&A, R&D)\n= EBITDA\n− Amortissements (D&A)\n= EBIT\n− Intérêts nets\n= EBT\n− Impôts\n= Résultat net",
    tags: ['P&L', 'comptabilité'],
  },
  {
    id: 'f-t2-02',
    topic: 'travaux-2',
    front: "EBITDA",
    back: "Earnings Before Interest, Taxes, Depreciation and Amortization.\nProxy des flux opérationnels cash d'une entreprise avant structure financière et politique d'investissement.",
    formula: "EBITDA = EBIT + D&A  OU  Résultat net + Impôts + Intérêts + D&A",
    tags: ['EBITDA', 'rentabilité'],
  },
  {
    id: 'f-t2-03',
    topic: 'travaux-2',
    front: "EBITDA ajusté vs EBITDA reporté",
    back: "EBITDA ajusté = EBITDA reporté + retraitements (coûts exceptionnels, restructuration, frais M&A, SBC, synergies run-rate).\n\nÀ surveiller en LBO : les sponsors ajustent agressivement. Les prêteurs cherchent à limiter les add-backs à des éléments non récurrents et déjà matérialisés.",
    tags: ['EBITDA', 'LBO', 'ajustements'],
  },
  {
    id: 'f-t2-04',
    topic: 'travaux-2',
    front: "Marge brute vs marge EBITDA",
    back: "Marge brute = (CA − COGS) / CA. Mesure l'efficacité de production / pricing power.\nMarge EBITDA = EBITDA / CA. Mesure la rentabilité opérationnelle après SG&A.\n\nUne marge brute élevée mais marge EBITDA faible → structure de coûts fixes lourde (SG&A élevé).",
    formula: "Marge EBITDA = EBITDA / CA",
    tags: ['marges', 'rentabilité'],
  },

  // ── TRAVAUX-3 : Analyse du bilan ────────────────────────────────────────────
  {
    id: 'f-t3-01',
    topic: 'travaux-3',
    front: "Structure du bilan",
    back: "ACTIF :\n• Actifs non courants (immobilisations, goodwill, actifs incorporels)\n• Actifs courants (stocks, créances clients, trésorerie)\n\nPASSIF :\n• Capitaux propres (equity)\n• Dettes à long terme (obligations, prêts)\n• Dettes à court terme (fournisseurs, dette CT)\n\nIdentité comptable : Actif = Passif + Capitaux propres",
    tags: ['bilan', 'comptabilité'],
  },
  {
    id: 'f-t3-02',
    topic: 'travaux-3',
    front: "Besoin en Fonds de Roulement (BFR)",
    back: "Mesure le besoin de financement lié au cycle d'exploitation.",
    formula: "BFR = Stocks + Créances clients − Dettes fournisseurs",
    tags: ['BFR', 'liquidité'],
  },
  {
    id: 'f-t3-03',
    topic: 'travaux-3',
    front: "BFR en jours de CA",
    back: "Norme sectorielle :\n• Distribution : BFR négatif (clients payent comptant, fournisseurs à 60j)\n• Industrie : BFR 30–60j\n• Construction : BFR 60–90j\n\nUn BFR qui augmente → destruction de cash non visible dans l'EBITDA.",
    formula: "BFR jours = (BFR / CA) × 365",
    tags: ['BFR', 'liquidité'],
  },
  {
    id: 'f-t3-04',
    topic: 'travaux-3',
    front: "Gearing (ratio d'endettement)",
    back: "Mesure le poids de la dette par rapport aux capitaux propres.",
    formula: "Gearing = Dette nette / Capitaux propres",
    tags: ['levier', 'bilan'],
  },
  {
    id: 'f-t3-05',
    topic: 'travaux-3',
    front: "Goodwill au bilan — qu'est-ce que c'est et pourquoi est-il risqué ?",
    back: "Goodwill = surplus payé par rapport à la juste valeur des actifs nets lors d'une acquisition.\n\nRisque : si la performance de la cible déçoit, le goodwill peut faire l'objet d'une dépréciation (impairment), impactant le résultat net et les capitaux propres. En LBO, un goodwill élevé → fragilité du bilan en cas de stress.",
    tags: ['goodwill', 'M&A', 'bilan'],
  },

  // ── TRAVAUX-4 : Flux de trésorerie ──────────────────────────────────────────
  {
    id: 'f-t4-01',
    topic: 'travaux-4',
    front: "Les 3 sections du tableau de flux de trésorerie",
    back: "1. Flux opérationnels (CFO) : cash généré par l'activité principale\n2. Flux d'investissement (CFI) : capex, acquisitions, cessions\n3. Flux de financement (CFF) : emprunts, remboursements, dividendes, equity\n\nVariation de trésorerie = CFO + CFI + CFF",
    tags: ['cash-flow', 'comptabilité'],
  },
  {
    id: 'f-t4-02',
    topic: 'travaux-4',
    front: "Free Cash Flow (FCF)",
    back: "Cash disponible après investissements de maintien, avant remboursement de dette. Principal indicateur de capacité de désendettement en LBO.",
    formula: "FCF = EBITDA − Impôts cash − ΔBesoin en FR − Capex",
    tags: ['FCF', 'LBO', 'désendettement'],
  },
  {
    id: 'f-t4-03',
    topic: 'travaux-4',
    front: "Cash Conversion Rate (CCR)",
    back: "Mesure la qualité de la conversion de l'EBITDA en cash réel. Un CCR < 80% est un signal d'alerte (absorption BFR, capex élevé, qualité comptable douteuse).",
    formula: "CCR = FCF / EBITDA",
    tags: ['CCR', 'cash-flow', 'qualité'],
  },
  {
    id: 'f-t4-04',
    topic: 'travaux-4',
    front: "Capex de maintenance vs capex de croissance",
    back: "Capex maintenance (stay-in-business) : dépenses pour maintenir l'outil de production. Non négociable, récurrent.\nCapex croissance (growth capex) : investissements pour développer l'activité. Discrétionnaire.\n\nEn LBO, le sponsor réduira souvent le capex de croissance pour maximiser le FCF et accélérer le désendettement.",
    tags: ['capex', 'LBO', 'cash-flow'],
  },

  // ── TRAVAUX-5 : Rentabilité ─────────────────────────────────────────────────
  {
    id: 'f-t5-01',
    topic: 'travaux-5',
    front: "ROCE (Return on Capital Employed)",
    back: "Mesure la rentabilité du capital investi dans l'entreprise (dette + equity). Indicateur clé de création de valeur.",
    formula: "ROCE = EBIT / Capital Employé\nCapital Employé = Actifs totaux − Passifs courants",
    tags: ['ROCE', 'rentabilité'],
  },
  {
    id: 'f-t5-02',
    topic: 'travaux-5',
    front: "ROE (Return on Equity)",
    back: "Mesure la rentabilité des capitaux propres. En LBO, le ROE est artificiellement amplifié par le levier financier — un ROE élevé post-LBO ne reflète pas nécessairement une meilleure performance opérationnelle.",
    formula: "ROE = Résultat net / Capitaux propres",
    tags: ['ROE', 'rentabilité', 'LBO'],
  },
  {
    id: 'f-t5-03',
    topic: 'travaux-5',
    front: "NOPAT (Net Operating Profit After Tax)",
    back: "Résultat opérationnel après impôt, avant charges financières. Mesure la performance opérationnelle indépendamment de la structure de financement.",
    formula: "NOPAT = EBIT × (1 − Taux d'impôt)",
    tags: ['NOPAT', 'WACC', 'rentabilité'],
  },
  {
    id: 'f-t5-04',
    topic: 'travaux-5',
    front: "Point mort (seuil de rentabilité)",
    back: "Niveau de CA à partir duquel l'entreprise ne perd plus d'argent. Permet de mesurer la marge de sécurité.",
    formula: "Point mort = Charges fixes / Taux de marge sur coûts variables\nTaux MCV = (CA − Charges variables) / CA",
    tags: ['point-mort', 'rentabilité'],
  },

  // ── TRAVAUX-6 : Valorisation (multiples) ────────────────────────────────────
  {
    id: 'f-t6-01',
    topic: 'travaux-6',
    front: "EV/EBITDA — définition et utilisation",
    back: "Multiple d'Enterprise Value le plus utilisé en M&A et LBO. Compare la valeur d'entreprise totale à la génération de cash opérationnel.\nAvantage : neutre par rapport à la structure financière (contrairement au P/E).\nTypique LBO buyout : 8–12× selon le secteur.",
    formula: "EV/EBITDA = Enterprise Value / EBITDA",
    tags: ['valorisation', 'multiples', 'LBO'],
  },
  {
    id: 'f-t6-02',
    topic: 'travaux-6',
    front: "Enterprise Value (EV) — calcul",
    back: "Valeur totale de l'entreprise pour tous les apporteurs de capitaux (actionnaires + créanciers).",
    formula: "EV = Capitalisation boursière + Dette nette + Intérêts minoritaires − Participations",
    tags: ['EV', 'valorisation'],
  },
  {
    id: 'f-t6-03',
    topic: 'travaux-6',
    front: "DCF — principe et étapes clés",
    back: "Discounted Cash Flow : valorisation par actualisation des flux de trésorerie futurs.\n\nÉtapes :\n1. Projeter les FCFF sur 5–10 ans\n2. Calculer la valeur terminale (Gordon-Shapiro ou multiple de sortie)\n3. Actualiser à la WACC\n4. Soustraire la dette nette pour obtenir la valeur equity\n\nLimite : très sensible aux hypothèses de WACC et de croissance terminale.",
    tags: ['DCF', 'valorisation', 'WACC'],
  },
  {
    id: 'f-t6-04',
    topic: 'travaux-6',
    front: "WACC — formule",
    back: "Coût moyen pondéré du capital. Taux d'actualisation qui reflète le coût de chaque source de financement, pondéré par son poids dans la structure.",
    formula: "WACC = (E/(E+D)) × Ke + (D/(E+D)) × Kd × (1−T)\nKe = CAPM = Rf + β × Prime de risque\nKd = coût de la dette avant impôt",
    tags: ['WACC', 'coût du capital', 'DCF'],
  },

  // ── TRAVAUX-7 : Structure financière & levier ───────────────────────────────
  {
    id: 'f-t7-01',
    topic: 'travaux-7',
    front: "Théorème de Modigliani-Miller",
    back: "Sans fiscalité ni coûts de faillite, la valeur d'une entreprise est indépendante de sa structure financière.\nAvec impôts : la dette crée de la valeur via le bouclier fiscal (tax shield).\nAvec coûts de faillite : au-delà d'un seuil, le levier détruit de la valeur.\n→ La structure optimale arbitre entre bouclier fiscal et risque de défaut.",
    tags: ['structure financière', 'théorie'],
  },
  {
    id: 'f-t7-02',
    topic: 'travaux-7',
    front: "Bouclier fiscal (tax shield)",
    back: "Économie d'impôt générée par la déductibilité des charges d'intérêts. En LBO, c'est l'une des 3 sources de création de valeur pour le sponsor (avec l'amélioration opérationnelle et l'expansion de multiple).",
    formula: "Tax Shield = Intérêts × Taux d'impôt",
    tags: ['LBO', 'fiscalité', 'levier'],
  },
  {
    id: 'f-t7-03',
    topic: 'travaux-7',
    front: "Levier opérationnel",
    back: "Sensibilité de l'EBITDA à une variation du chiffre d'affaires. Une entreprise avec beaucoup de charges fixes a un levier opérationnel élevé → plus risquée en récession, mais plus profitable en croissance.",
    formula: "Levier opérationnel = Marge sur coûts variables / EBIT",
    tags: ['levier', 'risque', 'charges fixes'],
  },
  {
    id: 'f-t7-04',
    topic: 'travaux-7',
    front: "Levier financier",
    back: "Amplification du rendement pour l'actionnaire via l'endettement. Fonctionne tant que le ROCE > Kd (coût de la dette). Si ROCE < Kd, le levier détruit de la valeur equity.",
    formula: "ROE = ROCE + (ROCE − Kd) × D/E",
    tags: ['levier financier', 'ROE', 'LBO'],
  },

  // ── TRAVAUX-8 : Ratios de crédit ────────────────────────────────────────────
  {
    id: 'f-t8-01',
    topic: 'travaux-8',
    front: "Dette Nette / EBITDA",
    back: "Principal ratio de levier utilisé en leveraged finance. Mesure combien d'années d'EBITDA sont nécessaires pour rembourser la dette nette.\nSeuils LBO typiques : entrée 4–7×, sortie cible < 3–4×.",
    formula: "DN/EBITDA = (Dettes financières − Trésorerie) / EBITDA",
    tags: ['levier', 'LBO', 'covenants'],
  },
  {
    id: 'f-t8-02',
    topic: 'travaux-8',
    front: "ICR (Interest Coverage Ratio)",
    back: "Mesure la capacité à couvrir les charges d'intérêts avec l'EBITDA. Covenant fréquent dans les leveraged loans. Seuil minimum typique : 2.0–2.5×.",
    formula: "ICR = EBITDA / Charges financières nettes",
    tags: ['ICR', 'covenants', 'crédit'],
  },
  {
    id: 'f-t8-03',
    topic: 'travaux-8',
    front: "DSCR (Debt Service Coverage Ratio)",
    back: "Mesure la capacité à couvrir le service de la dette (intérêts + remboursements en principal). Plus conservateur que l'ICR. Un DSCR < 1× signifie que le cash ne suffit pas à rembourser la dette.",
    formula: "DSCR = EBITDA − Impôts − Capex / (Intérêts + Remboursements principal)",
    tags: ['DSCR', 'crédit', 'covenants'],
  },
  {
    id: 'f-t8-04',
    topic: 'travaux-8',
    front: "FCF Yield (Free Cash Flow Yield)",
    back: "Mesure la rentabilité en cash de l'investissement en equity.",
    formula: "FCF Yield = FCF / Enterprise Value",
    tags: ['FCF', 'rentabilité', 'valorisation'],
  },
  {
    id: 'f-t8-05',
    topic: 'travaux-8',
    front: "Levier senior vs levier total",
    back: "Levier senior = Dette senior / EBITDA (Term Loan A + Term Loan B + RCF drawn)\nLevier total = (Dette senior + Mezzanine + PIK) / EBITDA\n\nLes covenants portent souvent sur le levier senior (plus restrictif) pour protéger les prêteurs de premier rang.",
    tags: ['LBO', 'structure de dette', 'levier'],
  },

  // ── TRAVAUX-9 : Analyse sectorielle ────────────────────────────────────────
  {
    id: 'f-t9-01',
    topic: 'travaux-9',
    front: "Secteurs défensifs vs cycliques",
    back: "Défensifs (faible corrélation au cycle) : healthcare, utilities, consommation courante, télécoms.\nCycliques (forte corrélation au cycle) : automobile, acier, chimie, banques, luxe.\n\nEn LBO, les secteurs défensifs supportent davantage de levier (flux plus prévisibles). Les secteurs cycliques requièrent plus d'equity cushion.",
    tags: ['secteur', 'cycle', 'LBO'],
  },
  {
    id: 'f-t9-02',
    topic: 'travaux-9',
    front: "Pricing power — définition et indicateurs",
    back: "Capacité d'une entreprise à augmenter ses prix sans perdre de volumes.\n\nIndicateurs :\n• Évolution de la marge brute dans le temps\n• NPS / fidélité clients\n• Part de marché stable ou croissante malgré hausses tarifaires\n• Coûts de changement élevés pour les clients\n\nEn crédit : fort pricing power = flux d'EBITDA plus résilients en inflation.",
    tags: ['pricing power', 'marge', 'secteur'],
  },

  // ── TRAVAUX-10 : Risques ────────────────────────────────────────────────────
  {
    id: 'f-t10-01',
    topic: 'travaux-10',
    front: "Matrice de risques crédit",
    back: "Axes principaux :\n• Risque de liquidité : incapacité à honorer ses échéances CT\n• Risque de solvabilité : passif > actif, insolvabilité structurelle\n• Risque de marché : sensibilité aux taux, changes, matières premières\n• Risque opérationnel : fraude, sinistre, défaillance IT\n• Risque de concentration : client unique, fournisseur unique, géographie unique",
    tags: ['risque', 'crédit'],
  },
  {
    id: 'f-t10-02',
    topic: 'travaux-10',
    front: "LGD (Loss Given Default)",
    back: "Perte en cas de défaut, après récupération sur les actifs. Dépend du rang de la créance et de la qualité des actifs.",
    formula: "LGD = 1 − Taux de recouvrement\nPerte attendue = PD × LGD × EAD",
    tags: ['LGD', 'crédit', 'risque de défaut'],
  },
  {
    id: 'f-t10-03',
    topic: 'travaux-10',
    front: "Analyse de sensibilité vs stress test",
    back: "Analyse de sensibilité : variation d'un seul paramètre (ex : EBITDA −10%) → impact sur le ratio de levier.\nStress test : scénario adverse combinant plusieurs chocs simultanés (EBITDA −20%, taux +200 bps, BFR +15%).\n\nLes deux sont complémentaires. Le stress test est plus conservateur et exigé par les prêteurs en LBO.",
    tags: ['stress test', 'sensibilité', 'crédit'],
  },

  // ── TRAVAUX-11 : Croissance & création de valeur ────────────────────────────
  {
    id: 'f-t11-01',
    topic: 'travaux-11',
    front: "Sources de création de valeur en LBO",
    back: "1. Désendettement (debt paydown) : le FCF rembourse la dette, mécaniquement l'equity croît\n2. Amélioration opérationnelle (EBITDA growth) : croissance organique + synergies + efficacité\n3. Expansion de multiple (multiple expansion) : achat à 7× EBITDA, revente à 9× EBITDA\n\nHistoriquement : ~40% désendettement, ~40% croissance EBITDA, ~20% expansion multiple.",
    tags: ['LBO', 'création de valeur', 'PE'],
  },
  {
    id: 'f-t11-02',
    topic: 'travaux-11',
    front: "TRI (Taux de Rentabilité Interne) en LBO",
    back: "Taux qui annule la VAN d'un investissement. Cible PE buyout : 20–25%+ sur 5 ans.\nMultiple d'argent (MOIC) : complémentaire au TRI, mesure combien de fois l'investissement initial est multiplié.\nMOIC cible buyout : 2.0–3.0×.",
    formula: "TRI : résout ΣCFt/(1+TRI)^t = 0\nMOIC = Valeur de sortie / Mise de fonds initiale",
    tags: ['TRI', 'MOIC', 'LBO', 'PE'],
  },

  // ── TRAVAUX-12 : Rapport & recommandation ──────────────────────────────────
  {
    id: 'f-t12-01',
    topic: 'travaux-12',
    front: "Structure d'un Credit Memo (mémo de crédit)",
    back: "1. Executive Summary (résumé / verdict)\n2. Description de l'entreprise et du secteur\n3. Analyse financière (historique + projections)\n4. Ratios de crédit et covenants\n5. Structure de la transaction et waterfall\n6. Stress test\n7. Analyse des risques\n8. Conclusion et recommandation",
    tags: ['credit memo', 'analyse crédit'],
  },
  {
    id: 'f-t12-02',
    topic: 'travaux-12',
    front: "Les 4 C du crédit",
    back: "Cadre classique d'évaluation du risque crédit :\n1. Character : qualité du management, track record\n2. Capacity : capacité à rembourser (cash-flows, ratios)\n3. Capital : niveau d'equity, cushion pour les prêteurs\n4. Collateral : actifs donnés en garantie, taux de recouvrement\n\nParfois étendu à 5 C avec Conditions (environnement macro/sectoriel).",
    tags: ['crédit', 'analyse', 'framework'],
  },
  {
    id: 'f-t12-03',
    topic: 'travaux-12',
    front: "Rating implicite — correspondance ratios / notation",
    back: "Grille indicative S&P/Moody's en LBO :\n• B/B2 : DN/EBITDA 5–7×, ICR 1.5–2.5×\n• BB-/Ba3 : DN/EBITDA 3–5×, ICR 2.5–4×\n• BB/Ba2 : DN/EBITDA 2.5–3.5×, ICR 4–6×\n• BBB-/Baa3 : DN/EBITDA < 2.5×, ICR > 6×\n\nLes leveraged loans sont généralement notés B à BB (sub-investment grade).",
    tags: ['rating', 'notation', 'crédit'],
  },

  // ── LEVERAGED FINANCE ───────────────────────────────────────────────────────
  {
    id: 'f-lf-01',
    topic: 'leveraged-finance',
    front: "Structure de dette LBO typique",
    back: "Dette senior sécurisée (50–60% du financement) :\n• TLA (Term Loan A) : amorti, 5–6 ans\n• TLB (Term Loan B) : bullet, 7 ans, investisseurs institutionnels\n• RCF (Revolving Credit Facility) : ligne de liquidité, non tirée au closing\n\nDette junior (0–20%) : Mezzanine, High Yield, PIK\n\nEquity (30–40%) : apport du sponsor + management (sweet equity)",
    tags: ['LBO', 'structure dette', 'tranches'],
  },
  {
    id: 'f-lf-02',
    topic: 'leveraged-finance',
    front: "TLB (Term Loan B) — caractéristiques",
    back: "• Maturité : 7 ans\n• Remboursement : bullet (99% à maturité, 1% annuel)\n• Taux : EURIBOR + 350–550 bps (selon qualité crédit)\n• Investisseurs : CLOs, hedge funds, fonds de dettes\n• Flexibilité contractuelle : covenant-lite fréquent\n• Marché : plus liquide que la mezzanine, secondaire actif",
    tags: ['TLB', 'leveraged loan', 'structure'],
  },
  {
    id: 'f-lf-03',
    topic: 'leveraged-finance',
    front: "Covenant financier vs covenant de maintenance vs incurrence covenant",
    back: "Covenant de maintenance (maintenance covenant) : testé périodiquement (trimestriel), déclenche un défaut si le ratio sort des limites (ex: DN/EBITDA > 6×).\n\nIncurrence covenant : ne déclenche qu'au moment d'une action spécifique (nouvelle dette, acquisition). Moins protecteur pour les prêteurs.\n\nCovenants-lite = incurrence covenants uniquement. Standard sur le marché TLB européen depuis 2015.",
    tags: ['covenants', 'leveraged loan'],
  },
  {
    id: 'f-lf-04',
    topic: 'leveraged-finance',
    front: "PIK (Payment In Kind)",
    back: "Instrument où les intérêts ne sont pas payés en cash mais capitalisés (ajoutés au principal). Permet de préserver la liquidité court-terme mais augmente mécaniquement l'endettement.\nUtilisé en mezzanine, HY, ou en situation de stress.\nSignal négatif : une PIK toggle activée → l'entreprise ne peut plus servir ses intérêts en cash.",
    tags: ['PIK', 'mezzanine', 'dette'],
  },
  {
    id: 'f-lf-05',
    topic: 'leveraged-finance',
    front: "CLO (Collateralized Loan Obligation)",
    back: "Véhicule de titrisation qui achète un portefeuille de leveraged loans et émet des tranches notées à des investisseurs.\nTransformation de crédit : les tranches senior (AAA–A) sont protégées par la subordination des tranches junior.\nLes CLOs sont les plus gros acheteurs de TLBs — leur appétit conditionne fortement les conditions du marché leveraged loan.",
    tags: ['CLO', 'marché', 'titrisation'],
  },
  {
    id: 'f-lf-06',
    topic: 'leveraged-finance',
    front: "Waterfall de dette — ordre de priorité de remboursement",
    back: "En cas de liquidation ou de vente :\n1. Créanciers super-seniors (RCF, hedge instruments)\n2. Term Loan A & B (dette senior sécurisée 1er rang)\n3. Mezzanine / HY (dette junior)\n4. Actionnaires (equity — résidu)\n\nPlus on est haut dans la waterfall, plus on est protégé mais moins le rendement est élevé.",
    tags: ['waterfall', 'priorité', 'LBO', 'structure'],
  },
  {
    id: 'f-lf-07',
    topic: 'leveraged-finance',
    front: "EBITDA Covenant Headroom",
    back: "Marge de sécurité entre le ratio actuel et le seuil covenant. Exprimé en % ou en marge d'EBITDA disponible.\n\nEx : covenant DN/EBITDA max 6.5×, ratio actuel 5.5× → headroom 1.0× = l'EBITDA peut baisser de ~15% avant covenant breach.\n\nUn headroom < 15% est considéré comme fragile par les prêteurs.",
    formula: "Headroom = (Seuil covenant − Ratio actuel) / Seuil covenant",
    tags: ['covenants', 'headroom', 'risque'],
  },
  {
    id: 'f-lf-08',
    topic: 'leveraged-finance',
    front: "Amend & Extend vs Refinancement",
    back: "Amend & Extend (A&E) : modification des termes du crédit existant (extension maturité, ajustement covenants) sans remplacer le financement. Plus rapide et moins coûteux qu'un refi complet.\n\nRefinancement (refi) : remplacer la dette existante par un nouveau financement, généralement pour profiter de spreads plus bas ou d'un meilleur contexte de marché.",
    tags: ['restructuration', 'refinancement', 'leveraged loan'],
  },
  {
    id: 'f-lf-09',
    topic: 'leveraged-finance',
    front: "Dividend Recapitalization",
    back: "Opération par laquelle un sponsor lève de la dette additionnelle pour se verser un dividende avant la sortie. Augmente le levier mais permet au PE de récupérer du capital sans vendre.\n\nAvis des prêteurs : négatif (augmente le risque pour les créanciers existants, souvent limité par incurrence covenants).\nCondition de marché favorable : marché leveraged loan liquide + EBITDA en croissance.",
    tags: ['dividend recap', 'LBO', 'PE', 'sponsor'],
  },
  {
    id: 'f-lf-10',
    topic: 'leveraged-finance',
    front: "OID (Original Issue Discount)",
    back: "Décote à l'émission sur un leveraged loan. Exprimé en points (1 point = 1% du nominal).\nEx : OID 99 → le prêteur verse 99€ pour 100€ de nominal, recevant l'intégralité à maturité.\nL'OID augmente le rendement effectif pour l'investisseur et représente un coût additionnel pour l'emprunteur.",
    tags: ['OID', 'marché', 'leveraged loan'],
  },
  {
    id: 'f-lf-11',
    topic: 'leveraged-finance',
    front: "Management Package / Sweet Equity",
    back: "Mécanisme d'alignement d'intérêts entre le sponsor PE et l'équipe de management.\nLe management co-investit à un prix inférieur (actions ordinaires ou BSA) et bénéficie d'un levier sur la plus-value.\nEn France : souvent structuré via des BSPCE, AGA, ou actions de préférence.\nRatchet : mécanisme par lequel la part du management augmente si le TRI dépasse des seuils.",
    tags: ['management', 'LBO', 'alignement', 'sweet equity'],
  },
  {
    id: 'f-lf-12',
    topic: 'leveraged-finance',
    front: "Lender of Record vs Agent",
    back: "Agent : banque qui organise, documente et administre le crédit au nom du syndicat de prêteurs. Unique point de contact pour l'emprunteur.\nLenders of Record : ensemble des fonds/banques qui détiennent effectivement la dette (CLOs, fonds de dette directe, banques).\n\nEn cas d'amendment request, l'agent coordonne le vote du syndicat (seuil usuels : 50% pour modifications mineures, 100% pour modifications material adverse).",
    tags: ['marché', 'syndicaison', 'agent'],
  },

  // ── ACTUALITÉ ───────────────────────────────────────────────────────────────
  {
    id: 'f-ac-01',
    topic: 'actualite',
    front: "BCE — cycle de taux 2022–2024",
    back: "La BCE a relevé ses taux de 0% à 4.5% entre juillet 2022 et septembre 2023 (10 hausses consécutives), pour lutter contre une inflation atteignant 10.6% en octobre 2022.\nPremière baisse en juin 2024 (−25 bps → 4.25%), puis cycle d'assouplissement progressif en H2 2024.\n\nImpact sur le crédit privé : coût de la dette floating rate (EURIBOR) multiplié par >4, pression sur les ICR et DSCR des portefeuilles LBO à fort levier.",
    tags: ['BCE', 'taux', 'macro', '2024'],
  },
  {
    id: 'f-ac-02',
    topic: 'actualite',
    front: "Private Credit — essor 2020–2025",
    back: "Le marché du direct lending et private credit a atteint ~$1,700 Md d'AUM en 2024 (vs ~$500 Md en 2017). Porteurs :\n• Retrait des banques post-Bâle III (contraintes prudentielles)\n• Appétit des institutionnels pour le rendement (taux zéro → alternative premium)\n• Flexibilité (covenant customisés, exécution rapide)\n\nActeurs clés : Apollo, Ares, Blackstone Credit, HPS, Tikehau, BNP Paribas AM.",
    tags: ['private credit', 'direct lending', 'marché'],
  },
  {
    id: 'f-ac-03',
    topic: 'actualite',
    front: "ESG en leveraged finance — SLL",
    back: "Sustainability-Linked Loan (SLL) : prêt dont le pricing est ajusté (souvent ±5–10 bps) en fonction d'objectifs ESG (KPIs : émissions CO2, part d'énergie renouvelable, diversité au board).\n\nDifférence avec le Green Bond : le SLL n'est pas fléché vers des projets verts spécifiques, il cible la performance ESG globale de l'emprunteur.\nCritique : risque de greenwashing si les KPIs sont trop faciles à atteindre.",
    tags: ['ESG', 'SLL', 'leveraged loan'],
  },
  {
    id: 'f-ac-04',
    topic: 'actualite',
    front: "Loan repricing / repricings trend 2024",
    back: "Vague de repricings en 2024 : les emprunteurs ont profité de l'excès de liquidité sur le marché TLB pour renégocier leurs spreads à la baisse (−50 à −100 bps), sans modifier les autres conditions.\n\nPossible car : CLOs en réinvestissement, fort appétit pour le rendement flottant, concurrence entre prêteurs.\nImpact pour les prêteurs : compression du rendement sur les portefeuilles existants.",
    tags: ['repricing', 'leveraged loan', 'marché', '2024'],
  },
  {
    id: 'f-ac-05',
    topic: 'actualite',
    front: "Altice France — restructuration 2024",
    back: "Altice France a engagé en 2024 une restructuration de sa dette (~€24Md), l'une des plus importantes en Europe.\n\nContexte : fort endettement post-acquisitions + hausse des taux + pression concurrentielle télécom.\nEnseignements crédit :\n• Concentration debt: un seul émetteur très endetté\n• Leveraged covenant-lite : peu de protection pour les prêteurs\n• Fondamentaux télécom challengés (marché mûr, guerre des prix)",
    tags: ['actualité', 'restructuration', 'Altice', 'crédit'],
  },

  // ── CLO & TITRISATION ────────────────────────────────────────────────────────
  {
    id: 'f-clo-01',
    topic: 'clo',
    front: "Structure d'un CLO — les tranches",
    back: "Un CLO émet plusieurs tranches de notes notées, du plus senior au plus junior :\n\nAAA (~60-65% du capital) → AA → A → BBB → BB → B → Equity (non noté, ~8-10%)\n\nL'equity absorbe les premières pertes (first-loss piece). Le AAA absorbe les pertes en dernier.\nEn contrepartie : equity = rendement le plus élevé (TRI cible 15-20%), AAA = rendement le plus faible (E+130-150bps).",
    tags: ['CLO', 'tranches', 'structure'],
  },
  {
    id: 'f-clo-02',
    topic: 'clo',
    front: "OC Test (Overcollateralization Test)",
    back: "Compare la valeur nominale du portefeuille de loans à l'encours des tranches notées.\n\nSi le test breach : les flux d'intérêts sont redirigés pour rembourser le principal des tranches seniors → l'equity ne reçoit plus rien (cash diversion).\n\nProtège les investisseurs seniors contre les pertes sur le portefeuille.",
    formula: "OC Test (tranche X) = Valeur nominale portefeuille / Encours notes (X + toutes tranches plus seniors)",
    tags: ['CLO', 'OC test', 'protections'],
  },
  {
    id: 'f-clo-03',
    topic: 'clo',
    front: "IC Test (Interest Coverage Test)",
    back: "Compare les intérêts reçus sur le portefeuille aux intérêts dus sur les tranches notées.\n\nUn breach arrive si trop de loans passent en PIK ou font défaut — plus assez d'intérêts entrants pour couvrir les coupons des notes.\n\nEn cas de breach : diversion des flux vers remboursement des tranches seniors.",
    formula: "IC Test (tranche X) = Intérêts reçus portefeuille / Intérêts dus (tranche X + tranches + seniors)",
    tags: ['CLO', 'IC test', 'protections'],
  },
  {
    id: 'f-clo-04',
    topic: 'clo',
    front: "Période de réinvestissement (Reinvestment Period)",
    back: "Durée (~4-5 ans) pendant laquelle le CLO manager peut réinvestir les remboursements de principal reçus pour acheter de nouveaux loans.\n\nAprès la reinvestment period : phase d'amortissement — les remboursements paient les tranches notées de la plus senior à la plus junior.\n\nMaturité légale d'un CLO : 12-14 ans. Durée effective : 7-10 ans.",
    tags: ['CLO', 'reinvestment', 'amortissement'],
  },
  {
    id: 'f-clo-05',
    topic: 'clo',
    front: "CLO Warehouse",
    back: "Ligne de crédit bancaire permettant au CLO manager de constituer son portefeuille de loans avant le closing officiel du CLO (ramp-up period : 3-6 mois).\n\nLevier warehouse : typiquement 4-5×.\nRisque : si le marché se dégrade pendant le ramp-up, la valeur mark-to-market du portefeuille baisse → pertes pour le manager et la banque warehouse.",
    tags: ['CLO', 'warehouse', 'ramp-up'],
  },
  {
    id: 'f-clo-06',
    topic: 'clo',
    front: "WARF (Weighted Average Rating Factor)",
    back: "Score Moody's mesurant la qualité de crédit moyenne pondérée du portefeuille CLO.\nPlus le WARF est élevé, plus le portefeuille est risqué.\n\nConversion indicative :\n• B1/B+ ≈ 2 220\n• B2/B ≈ 2 720\n• B3/B- ≈ 4 770\n• Caa1/CCC+ ≈ 6 500\n\nLe CLO indenture fixe un WARF maximum — le manager ne peut pas dépasser ce seuil.",
    tags: ['CLO', 'WARF', 'qualité crédit', 'Moody\'s'],
  },
  {
    id: 'f-clo-07',
    topic: 'clo',
    front: "WAS (Weighted Average Spread) et arbitrage CLO",
    back: "WAS = moyenne pondérée des spreads des loans en portefeuille (ex : E+420 bps).\n\nArbitrage CLO = WAS (revenus) − Coût moyen pondéré des liabilities − Frais de gestion\n\nCe spread net couvre les pertes sur défauts et rémunère l'equity.\n\nSi le WAS se comprime (repricing des loans) → arbitrage se réduit → rendement equity sous pression.",
    formula: "Spread net ≈ WAS − Coût liabilities − Frais mgmt",
    tags: ['CLO', 'WAS', 'arbitrage', 'equity return'],
  },
  {
    id: 'f-clo-08',
    topic: 'clo',
    front: "CCC Bucket",
    back: "Limite de concentration sur les loans notés CCC ou en dessous — généralement plafonnée à 7.5% du portefeuille CLO.\n\nMécanisme punitif si dépassement : l'excédent au-delà de 7.5% est comptabilisé à valeur de marché (ex : 70 cents) dans le numérateur des OC tests au lieu du nominal (100 cents).\n\nEn période de stress : vague de downgrades B→CCC → menace sur les OC tests → diversion cash flows.",
    tags: ['CLO', 'CCC', 'stress', 'OC test'],
  },
  {
    id: 'f-clo-09',
    topic: 'clo',
    front: "CLO Reset vs CLO Refinancing",
    back: "Reset : restructuration complète — nouvelle reinvestment period (~4-5 ans), nouvelles liabilities aux conditions de marché actuelles. L'equity prolonge sa durée d'investissement.\n\nRefinancing : uniquement repricing des tranches notées (spreads plus bas) sans changer la reinvestment period.\n\nEn 2023-2024 : vague massive de resets/refis car les spreads liabilities avaient baissé.",
    tags: ['CLO', 'reset', 'refinancing', '2024'],
  },
  {
    id: 'f-clo-10',
    topic: 'clo',
    front: "Risk Retention (EU Securitisation Regulation)",
    back: "Obligation pour l'originateur/sponsor/manager de conserver 5% du risque économique net du CLO — alignement d'intérêts.\n\nFormes autorisées :\n1. Tranche verticale : 5% de chaque tranche\n2. Tranche horizontale : 5% en equity (first-loss)\n3. Sélection aléatoire : 5% des expositions\n\nEn pratique, les CLO managers (dont BNP Paribas AM) retiennent souvent plus de 5% en equity.",
    tags: ['CLO', 'risk retention', 'réglementation', 'EU'],
  },
  {
    id: 'f-clo-11',
    topic: 'clo',
    front: "CLO Manager vs Trustee",
    back: "CLO Manager (ex : BNP Paribas AM) : sélectionne et gère activement le portefeuille de loans dans le cadre des contraintes documentaires. Décisions d'investissement.\n\nTrustee / Agent de calcul (ex : US Bank, State Street) : entité indépendante qui calcule les OC/IC tests, publie le monthly investor report, vérifie les contraintes et distribue les flux selon le waterfall.\n\nSéparation des rôles = protection des investisseurs.",
    tags: ['CLO', 'gouvernance', 'trustee', 'manager'],
  },
  {
    id: 'f-clo-12',
    topic: 'clo',
    front: "Diversity Score (Moody's)",
    back: "Score mesurant la diversification effective du portefeuille CLO en tenant compte des corrélations sectorielles.\n\nUn score élevé = meilleure diversification = moins de risque de défauts simultanés = meilleures notations.\n\nLe manager optimise le Diversity Score en diversifiant : par secteur (limite ~5-7% par secteur), par géographie, par taille d'émetteurs.",
    tags: ['CLO', 'diversity score', 'concentration', 'Moody\'s'],
  },
  {
    id: 'f-clo-13',
    topic: 'clo',
    front: "Waterfall de distribution d'intérêts (Priority of Payments)",
    back: "Ordre des paiements dans un CLO (distribution d'intérêts) :\n1. Frais seniors (trustee, rating agencies, hedge)\n2. Frais de gestion (senior management fee ~0.45%)\n3. Intérêts AAA → OC/IC test AAA\n4. Intérêts AA → OC/IC test AA\n5. ... (chaque tranche dans l'ordre)\n6. Frais gestion juniors\n7. Intérêts equity (résiduel)\n\nEn cas de breach OC/IC : diversion vers remboursement du principal senior.",
    tags: ['CLO', 'waterfall', 'priority of payments'],
  },
  {
    id: 'f-clo-14',
    topic: 'clo',
    front: "Monthly Investor Report (MIR) — que surveiller ?",
    back: "5 éléments clés à analyser en priorité :\n1. OC/IC tests — headroom par rapport aux seuils, tendance\n2. CCC bucket — % et direction (hausse = signal stress)\n3. Defaulted/Credit impaired assets — pertes réalisées\n4. WAS — compression potentielle (repricing en cours)\n5. Watchlist / Negative Outlook — loans susceptibles de passer CCC\n\nUn analyste CLO chez BNP Paribas AM consulte le MIR chaque mois pour chaque CLO en portefeuille.",
    tags: ['CLO', 'MIR', 'analyse', 'BNP AM', 'due diligence'],
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getFichesByTopic(topicId: TopicId): Fiche[] {
  return FICHES.filter(f => f.topic === topicId)
}

export function getAllTopicsInFiches(): TopicId[] {
  return [...new Set(FICHES.map(f => f.topic))]
}
