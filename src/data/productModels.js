// ✅ Product → Models mapping
// Master list — all products & models from Excel
// To add new products/models, add to PRODUCT_MODELS first, then add to CUSTOMER or SALES list below

export const PRODUCT_MODELS = {

  // ── Grandstream ──────────────────────────
  "Router": [
    "GWN7001", "GWN7002",
  ],
  "AP": [
    "GWN7624", "GWN7630", "GWN7630LR", "GWN7660", "GWN7661E",
    "GWN7664E", "GWN7664ELR", "GWN7665", "GWN7670", "GWN7670WM",
    "GWN7670LR", "GWN7672", "GWN7674", "GWN7302",
  ],
  "GCC Series": [
    "GCC6010", "GCC6010W", "GCC6011", "GCC6020", "GCC6021",
  ],
  // Grandstream Switches only
  "Switch": [
    // Grandstream Unmanaged
    "GWN7700", "GWN7700P", "GWN7700MP", "GWN7701", "GWN7701P",
    "GWN7701PA", "GWN7701M", "GWN7702", "GWN7702P", "GWN7703",
    // Grandstream L2 Lite Managed
    "GWN7710R", "GWN7711", "GWN7711P", "GWN7721", "GWN7721P",
    // Grandstream L2 Managed
    "GWN7801", "GWN7801P", "GWN7801P Pro", "GWN7802", "GWN7802P",
    "GWN7802P Pro", "GWN7803P", "GWN7803PL Pro", "GWN7806", "GWN7806P",
    "GWN7806PL Pro", "GWN7806PH Pro",
    // Grandstream L3 Managed
    "GWN7811", "GWN7811P", "GWN7812P", "GWN7813", "GWN7813P",
    "GWN7816", "GWN7816P", "GWN7821P", "GWN7822P", "GWN7830", "GWN7831", "GWN7832",
  ],

  // ── Syrotech Switches (separate products) ───────────
  "Unmanaged PoE Switches": [
    "SY-0400P-2T-AI", "SY-0800P-2T-AI", "SY-4000P-1T-2S-AI",
    "SY-0800P-2G-AI", "SY-8000P-2T-AI", "SY-8000P-2T-2S-AI",
    "SY-1600P-2T-2S-AI", "SY-2400P-2G-2S-AI", "SY-2400P-2T-2S-HP-AI",
    "SY-2400P-2T-2S-AI",
  ],
  "Managed PoE Switches": [
    "SY-8000P-2S-150W-L2", "SY-2400P-4S-400W-L2", "SY-2400P-4X-400W-L2",
  ],
  "Managed non PoE Switches": [
    "SY-8000-4X-AC", "SY-2400-4X-AC", "SY-2400S-4X-DP",
  ],
  "Industrial Managed PoE Switches": [
    "SY-4000P-2S-IND", "SY-4000P-2S-IND V2", "SY-8000P-2S-IND",
    "SY-8000P-2S-IND V2", "SY-8000P-4S-IND", "SY-1016P-4S-IND",
    "SY-1600P-4S-IND", "SY-1024P-8CS4X-IND",
  ],
  "Industrial Managed Non PoE Switches": [
    "SY-4000-2S-IND-L2", "SY-8000-2S-IND-L2", "SY-1600-4S-IND-L2", "SY-2400-8CS-4X-IND",
  ],
  "Industrial Unmanaged PoE and Non-PoE Switches": [
    "SY-4000-2S-IND-UM (Non PoE)", "SY-4000P-2S-IND-UM", "SY-8000P-2S-IND-UM",
  ],
  "L2/L3 Managed Switches": [
    "SY-2400-4X-L2", "SY-2400S-4X-DP", "SY-2400X-2Q28-L3",
  ],
  "Desktop Switches": [
    "SY-1008",
  ],

  // ── Syrotech Fiber ───────────────────────
  "OLT": [
    "SY-GPON-16OLT", "SY-GPON-8OLT", "SY-GPON-4OLT", "SY-GPON-2OLT", "SY-GPON-1OLT",
    "SY-GOPON-16OLT-L3", "SY-GOPON-8OLT L3", "SY-GEPON-4OLT-L3",
    "SY-XGSPON-8 OLT", "SY-XGSPON-2 OLT",
  ],
  "ONT": [
    "SY-GPON-2000-WADONT-PRO", "SY-GPON-4010-AX3000", "SY-GPON-4010-AX1500",
    "SY-GPON-2010-WADONT-PRO", "SY-GPON-2010-WADONT", "SY-GPON-1110-WDONT",
    "SY-GPON-1010-DONT", "SY-GPON-2000-WADONT", "SY-GPON-1100-WDONT",
    "SY-GPON-1000-2WDONT", "SY-GPON-1000R-DONT", "SY-XGSPON-X1000S ONT",
    "SY-XGSPON-X4000 ONT", "SY-GPON-8000P-DONT ONT", "SY-XGSPON-4000-AX3000 ONT",
    "SY-XGSPON-X1000 ONT", "SY-XGSPON-4010-AX3000 ONT", "SY-GPON-1010IN-WDONT ONT",
    "SY-GPON-4000P-DONT ONT", "SY-GPON-4010-AX3000 (PRO) ONT", "SY-GPON-SP-POF8 POF splitter",
    "SY-GPON-PFC1-AX3000 POF ONT", "SY-GPON-1100IN-DONT ONT", "SY-GPON-SP-POF8C POF splitter",
  ],
  "Media Converter": [
    "GOMC-1303-02", "GOMC-1303-20", "GOMC-BI5303-20", "GOMC-1312-20",
    "GOMC-BI3512-20", "GOMC-BI5312-20", "GOMC-BI3503-20", "GOMC-1312-SFP",
  ],
  "DWDM Mux-Demux": [
    "SY-DWDM-96D-R", "SY-DWDM-40MD2160-ESR", "SY-DWDM-24MD2346-ESR",
    "SY-DWDM-16MD2742-ESR", "SY-DWDM-08MD27BD-R", "SY-DWDM-8M27342-R",
    "SY-DWDM-8D2734-R", "SY-DWDM-16M2742-R", "SY-DWDM-16D2742-R",
    "SY-DWDM-24M2346-R", "SY-DWDM-24D2346-R", "SY-DWDM-32M2157-R",
    "SY-DWDM-40M21602-R", "SY-DWDM-40M2160-R",
  ],
  "CWDM Mux-Demux": [
    "SY-CWDM-04MD1355", "SY-CWDM-08MD4761-ESR", "SY-CWDM-16MD1261-R",
  ],

  // ── Syrotech Entrance ────────────────────
  "Residential Barriers": [
    "SY-RB2500", "SY-RB3000",
  ],
  "Commercial Barriers": [
    "SY-CB800",
  ],
  "High Speed Barriers": [
    "SY-HB600", "SY-HB900",
  ],
  "UHF Readers": [
    "SY-UHF-FXIM-8P", "SY-UHF-ANT-9DCP", "SY-UHF-FXIM-4P",
    "SY-UHF-12DLP-02", "SY-UHF-9DIM-LR",
    "SY-U60019001-RJ : 6m", "SY-U60019001-WIEGAND : 6m",
    "SY-U15001200-WIEGAND : 15m", "SY-U15001200-RJ : 15m",
  ],
  "Accessories": [
    "SY-AC4", "SY-AC2", "SY-AC1", "SY-U30 : Windshield Tags",
    "SY-U20", "SY-H50", "SY-H100", "Loop Detector SY-LD01",
  ],
  "Power Supplies for Industrial POE Switches": [
    "SY-SMPS48-50DR (240W)", "SY-SMPS48-10DR", "SY-SMPS-4825DR",
  ],

  // ── SFP ─────────────────────────────────
  "SFP": [
    // 400G
    "GOXQDD-13400-LR8", "GOXQDD-13400-FR4", "GOXQDD-13400-DR4", "GOXQDD-85400-SR8",
    // 100G and 100G BIDI
    "GOXQ28-85100G-SR4", "GOXQ-85100G-02SRBI", "GOXQ28-13100G-02",
    "GOXQ28-13100LR4", "GOXQ28-13100G-20LR4", "GOXQ28-13100G-ER4",
    "GOXQ28-13100G-ZR4", "GOXQ28-BI23100G-LR4", "GOXQ28-BI32100G-LR4",
    "GOXQ28-BI23100G-20LR", "GOXQ28-BI32100G-20LR", "GOXQ28-BI49100G-ERL",
    "GOXQ28-BI94100G-ER", "GOXQ28-BI49100G-ZR", "GOXQ28-BI94100G-ZR",
    // 40G QSFP+
    "GOXQ-8540G-02SR4", "GOXQ-8540G-02SRBI", "GOXQ-1340G-10LR4",
    "GOXQ-1340G-10LRM", "GOXQ-1340G-20LR4", "GOXQ-1340G-ER4L",
    "GOXQ-1340G-ER4", "GOXQ-1340G-ZR4",
    // 25G and 25G BIDI
    "GOXP-1328-10", "GOXP-8528-02", "GOXP-1328-40", "GOXP-1328-80", "GOXP-8528-02 IND", "GOXP-1328-10 IND",
    // 10G BiDi SFP+
    "10G-12BIDI-20", "10G-13BIDI-20", "10G-12BIDI-40", "10G-13BIDI-40",
    "10G-12BIDI-60", "10G-13BIDI-60", "10G-12BIDI-80", "10G-13BIDI-80",
    "GOXP-BI2396-20", "GOXP-BI3296-20", "GOXP-BI2396-40", "GOXP-BI3296-40",
    "GOXP-BI2396-60", "GOXP-BI3296-60", "GOXP-BI2396-80",
    "GOXP-BI3296-80", "GOXP-BI4596-80", "GOXP-BI5496-80",
    // 10G Dual Fiber SFP+
    "10G-850-02",
    "10G-1310-20", "10G-1510-40", "10G-RJ45-02", "GOXP-8596-02", "GOHP-8596-02",
    "GOXP-1396-20", "GOHP-1396-20", "GOXP-1596-40", "GOXP-1596-80",
    "GOXP-CWDM4696-40", "GOXP-CWDM4696-80", "GOXP-DWDM96-40", "GOXP-DWDM96-80",
    // 1G BiDi SFP
    "1G-13BIDI-20", "1G-15BIDI-20", "1G-13BIDI-20SC", "1G-15BIDI-20SC", "1G-34BIDI-20",
    "1G-43BIDI-20", "1G-13BIDI-40", "1G-15BIDI-40", "1G-34BIDI-40", "1G-43BIDI-40",
    "GOXS-BI3512-20D", "GOXS-BI5312-20D", "GOXS-BI3512-20SC", "GOXS-BI5312-20SC",
    "GOXS-BI3412-20D", "GOXS-BI4312-20D", "GOXS-BI3412-40D",
    "GOXS-BI4312-40D", "GOXS-BI3512-40D", "GOXS-BI5312-40D",
    "GOXS-BI4512-80D", "GOXS-BI5412-80D", "GOXS-BI4512-120D", "GOXS-BI5412-120D",
    // 155M SFP Dual Fiber SFP
    "GOXS-1303-02D", "GOXS-1303-20D", "GOXS-1503-40D", "GOXS-1503-80D",
    // 155M Bidi SFP
    "GOXS-BI3503-20D", "GOXS-BI5303-20D", "GOXS-BI3503-20SC",
    "GOXS-BI5303-20SC", "GOXS-BI3503-40D", "GOXS-BI5303-40D",
    "GOXS-BI4503-80D", "GOXS-BI5403-80D", "GOXS-BI4503-120D", "GOXS-BI5403-120D",
    // 1G Dual Fiber
    "1G-850-02", "1G-1310-20", "1G-1310-40", "1G-1510-40", "GOXS-8512-02D",
    "GOHS-8512-02D", "GOXS-1312-20D", "GOHS-1312-20D", "GOXS-1312-40D",
    "GOXS-1512-40D", "GOXS-1512-80D", "GOXS-1512-120D", "GOXS-CWDM4612-80",
    // Copper SFP+
    "GOXS-C12-02A", "GOXS-C12-02", "1G-RJ45-02", "1G-RJ45A-02", "GOXP-C96-02",
    // STM SFP
    "GOXS-1303-20 STM1", "GOXS-1303-40 STM1", "GOXS-1503-80 STM1", "GOXS-1306-20 STM4",
    "GOXS-1306-40 STM4", "GOXS-1506-40 STM4", "GOXS-1506-80 STM4", "GOXS-1324-20 STM16", "GOXS-1524-40 STM16", "GOXS-1524-80 STM16",
    // PON SFP
    "GOXS-BI4312-20PON4+", "GOXS-BI4312-20PONC4+", "GOXS-BI4312-20PONC5+",
    // DAC/AOC
    "GOXP-CAB-10GSFP-PXM (DAC)", "GOXP-CAB-10GSFP-AXM (AOC)", "GOXP-CAB-SFP28-AXM (AOC)",
  ],
};

// ✅ Master product list
export const PRODUCTS = Object.keys(PRODUCT_MODELS);


// ══════════════════════════════════════════════════════
// CUSTOMER DASHBOARD — products visible to customers
// Add/remove products here for CustomerDashboard.jsx
// ══════════════════════════════════════════════════════
export const CUSTOMER_PRODUCT_MODELS = PRODUCT_MODELS;
export const CUSTOMER_PRODUCTS = Object.keys(CUSTOMER_PRODUCT_MODELS);


// ══════════════════════════════════════════════════════
// SALES DASHBOARD — products visible to sales persons
// Add/remove products here for Dashboard.jsx
// ══════════════════════════════════════════════════════
export const SALES_PRODUCT_MODELS = {
  "Router":                                        PRODUCT_MODELS["Router"],
  "AP":                                            PRODUCT_MODELS["AP"],
  "GCC Series":                                    PRODUCT_MODELS["GCC Series"],
  "Switch":                                        PRODUCT_MODELS["Switch"],
  "Unmanaged PoE Switches":                        PRODUCT_MODELS["Unmanaged PoE Switches"],
  "Managed PoE Switches":                          PRODUCT_MODELS["Managed PoE Switches"],
  "Managed non PoE Switches":                      PRODUCT_MODELS["Managed non PoE Switches"],
  "Industrial Managed PoE Switches":               PRODUCT_MODELS["Industrial Managed PoE Switches"],
  "Industrial Managed Non PoE Switches":           PRODUCT_MODELS["Industrial Managed Non PoE Switches"],
  "Industrial Unmanaged PoE and Non-PoE Switches": PRODUCT_MODELS["Industrial Unmanaged PoE and Non-PoE Switches"],
  "L2/L3 Managed Switches":                        PRODUCT_MODELS["L2/L3 Managed Switches"],
  "Desktop Switches":                              PRODUCT_MODELS["Desktop Switches"],
  "OLT":                                           PRODUCT_MODELS["OLT"],
  "ONT":                                           PRODUCT_MODELS["ONT"],
  "Media Converter":                               PRODUCT_MODELS["Media Converter"],
  "DWDM Mux-Demux":                                PRODUCT_MODELS["DWDM Mux-Demux"],
  "CWDM Mux-Demux":                                PRODUCT_MODELS["CWDM Mux-Demux"],
  "SFP":                                           PRODUCT_MODELS["SFP"],
  "Residential Barriers":                          PRODUCT_MODELS["Residential Barriers"],
  "Commercial Barriers":                           PRODUCT_MODELS["Commercial Barriers"],
  "High Speed Barriers":                           PRODUCT_MODELS["High Speed Barriers"],
  "UHF Readers":                                   PRODUCT_MODELS["UHF Readers"],
  "Accessories":                                   PRODUCT_MODELS["Accessories"],
  "Power Supplies for Industrial POE Switches":    PRODUCT_MODELS["Power Supplies for Industrial POE Switches"],
  // ✅ ADD MORE for sales — copy line below and uncomment:
  // "New Product":                                PRODUCT_MODELS["New Product"],
};
export const SALES_PRODUCTS = Object.keys(SALES_PRODUCT_MODELS);