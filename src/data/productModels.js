// ✅ Product → Models mapping
// Used in CustomerDashboard, Dashboard, SupportDashboard
// To add new products/models, just add here — no other file needs to change

// ══════════════════════════════════════════
// FULL MASTER LIST — all products & models
// ══════════════════════════════════════════
export const PRODUCT_MODELS = {
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
  "ONU / ONT": [
    "SY-GPON-2000-WADONT-PRO", "SY-GPON-4010-AX3000", "SY-GPON-4010-AX1500",
    "SY-GPON-2011-WADONT", "SY-GPON-1111-WDONT", "SY-GPON-1101-WDONT",
    "SY-GPON-2010-WADONT-PRO", "SY-GPON-2010-WADONT", "SY-GPON-1110-WDONT",
    "SY-GPON-1010-DONT", "SY-GPON-2000-WADONT", "SY-GPON-1100-WDONT",
    "SY-GPON-1000-2WDONT", "SY-GPON-1001-DONT", "SY-GPON-1000R-DONT",
    "SY-XGSPON-X1000S ONT", "SY-XGSPON-X4000 ONT", "SY-GPON-8000P-DONT ONT",
    "SY-XGSPON-4000-AX3000 ONT", "SY-XGSPON-X1000 ONT", "SY-XGSPON-4010-AX3000 ONT",
    "SY-GPON-1010IN-WDONT ONT", "SY-GPON-4000P-DONT ONT", "SY-GPON-4010-AX3000 (PRO) ONT",
    "SY-GPON-PFC1-AX3000 POF ONT", "SY-GPON-1100IN-DONT ONT",
  ],
  "OLT": [
    "SY-GPON-16OLT", "SY-GPON-8OLT", "SY-GPON-4OLT", "SY-GPON-2OLT", "SY-GPON-1OLT",
    "SY-GOPON-16OLT-L3", "SY-GOPON-8OLT L3", "SY-GEPON-4OLT-L3",
    "SY-XGSPON-8 OLT", "SY-XGSPON-2 OLT",
  ],
  "Switch": [
    "GWN7700", "GWN7700P", "GWN7700MP", "GWN7701", "GWN7701P",
    "GWN7701PA", "GWN7701M", "GWN7702", "GWN7702P", "GWN7703",
    "GWN7710R", "GWN7711", "GWN7711P", "GWN7721", "GWN7721P",
    "GWN7801", "GWN7801P", "GWN7801P Pro", "GWN7802", "GWN7802P",
    "GWN7802P Pro", "GWN7803P", "GWN7803PL Pro", "GWN7806", "GWN7806P",
    "GWN7806PL Pro", "GWN7806PH Pro",
    "GWN7811", "GWN7811P", "GWN7812P", "GWN7813", "GWN7813P",
    "GWN7816", "GWN7816P", "GWN7821P", "GWN7822P", "GWN7830", "GWN7831", "GWN7832",
    "SY-0400P-2T-AI", "SY-0800P-2T-AI", "SY-4000P-1T-2S-AI",
    "SY-8000P-2T-AI", "SY-8000P-2T-2S-AI", "SY-2400P-2T-2S-AI",
    "SY-8000P-2S-150W-L2", "SY-2400P-4S-400W-L2", "SY-2400P-4X-400W-L2",
    "SY-4000P-2S-IND", "SY-8000P-2S-IND", "SY-8000P-4S-IND",
    "SY-1016P-4S-IND", "SY-1024P-8CS4X-IND",
    "SY-4000-2S-IND-L2 (Non PoE)", "SY-8000-2S-IND-L2 (Non PoE)",
    "SY-4000-2S-IND-UM (Non PoE)", "SY-4000P-2S-IND-UM", "SY-8000P-2S-IND-UM",
    "SY-2400-4X-L2", "SY-2400S-4X-DP", "SY-2400X-2Q28-L3",
    "SY-1008",
  ],
  "Media Converter": [
    "GOMC-1303-02", "GOMC-1303-20", "GOMC-BI5303-20", "GOMC-1312-20",
    "GOMC-BI3512-20", "GOMC-BI5312-20", "GOMC-BI3503-20", "GOMC-1312-SFP",
  ],
  "SFP": [
    "GOXQDD-13400-LR8", "GOXQDD-13400-FR4", "GOXQDD-13400-DR4", "GOXQDD-85400-SR8",
    "GOXQ28-13100G-ZR4", "GOXQ28-13100G-ER4", "GOXQ28-13100G-LR4",
    "GOXQ28-BI59100G-ER", "GOXQ28-BI95100G-ER", "GOXQ28-BI79100G-ZR", "GOXQ28-BI97100G-ZR",
    "GOXQ-1340G-ZR4", "GOXQ-1340G-ER4", "GOXQ-1340G-LR4", "GOXQ-8540G-02-SR4",
    "GOXP-1328-10", "GOXP-8528-02",
    "GOXP-BI2396-80", "GOXP-BI3296-80", "GOXP-BI2396-60", "GOXP-BI3296-60",
    "GOXP-BI2396-40", "GOXP-BI3296-40", "GOXP-BI2396-20", "GOXP-BI3296-20",
    "GOXP-1596-80", "GOXP-1596-40", "GOXP-1396-20", "GOXP-8596-02",
    "GOXS-BI4512-80D", "GOXS-BI5412-80D", "GOXS-BI3512-40D",
    "GOXS-BI5312-40D", "GOXS-BI3512-20D", "GOXS-BI5312-20D",
    "GOXS-1312-20D", "GOXS-1512-120D", "GOXS-1512-80D", "GOXS-8512-02D",
    "GOXS-C12-02", "GOXP-C96-02",
    "GOXS-1303-02D", "GOXS-1303-20 STM1", "GOXS-1303-40 STM1",
    "GOXS-1503-80 STM1", "GOXS-1306-20 STM4", "GOXS-1306-40 STM4",
    "GOXS-1506-40 STM4", "GOXS-1506-80 STM4", "GOXS-1324-20 STM16",
    "GOXS-1524-40 STM16", "GOXS-1524-80 STM16",
    "GOXP-CAB-10GSFP-PXM (DAC)", "GOXP-CAB-10GSFP-AXM (AOC)", "GOXP-CAB-SFP28-AXM (AOC)",
  ],
};

// ✅ All product names (master)
export const PRODUCTS = Object.keys(PRODUCT_MODELS);


// ══════════════════════════════════════════
// CUSTOMER DASHBOARD — add/remove products
// that customers should see when raising ticket
// ══════════════════════════════════════════
export const CUSTOMER_PRODUCT_MODELS = {
  "Router": PRODUCT_MODELS["Router"],
  "ONU / ONT": PRODUCT_MODELS["ONU / ONT"],
  "Switch": PRODUCT_MODELS["Switch"],
  // ✅ ADD MORE for customer like this:
  // "AP": PRODUCT_MODELS["AP"],
  // "OLT": PRODUCT_MODELS["OLT"],
};
export const CUSTOMER_PRODUCTS = Object.keys(CUSTOMER_PRODUCT_MODELS);


// ══════════════════════════════════════════
// SALES DASHBOARD — add/remove products
// that sales persons should see when raising ticket
// ══════════════════════════════════════════
export const SALES_PRODUCT_MODELS = {
  "Router": PRODUCT_MODELS["Router"],
  "AP": PRODUCT_MODELS["AP"],
  "GCC Series": PRODUCT_MODELS["GCC Series"],
  "ONU / ONT": PRODUCT_MODELS["ONU / ONT"],
  "OLT": PRODUCT_MODELS["OLT"],
  "Switch": PRODUCT_MODELS["Switch"],
  "Media Converter": PRODUCT_MODELS["Media Converter"],
  "SFP": PRODUCT_MODELS["SFP"],
  // ✅ ADD MORE for sales like this:
  // "New Product": PRODUCT_MODELS["New Product"],
};
export const SALES_PRODUCTS = Object.keys(SALES_PRODUCT_MODELS);