// ✅ Product Category → Sub Category → Item Name mapping
// Master list — all products from Excel sheet (Goip_Product_List_GrandstreamProductList_-2026.xlsx)
// 3-level structure: Category → Sub Category → [Item Names]
// To add new items: add to PRODUCT_MODELS first, then update CUSTOMER/SALES lists below

export const PRODUCT_MODELS = {

  // ── OLT ───────────────────────────────
"OLT": {
  "EPON OLT": [
    "SY-GOPON-4OLT-L3",
    "SY-GOPON-4OLT-L3-ECO",
    "SY-GOPON-4OLT-L3-DC",
    "SY-GOPON-8OLT-L3",
    "SY-GOPON-8OLT-L3-ECO"
  ],

  "GPON OLT": [
    "SY-GPON-1 OLT",
    "SY-GPON-2OLT",
    "SY-GPON-4OLT",
    "SY-GPON-8OLT",
    "SY-GPON-16OLT"
  ],

  "EPON OLT PS": [
    "SY-GOPON-4OLT-L3-AC-PS",
    "SY-GOPON-4OLT-L3-DC-PS",
    "SY-GOPON-8OLT-L3-AC-PS",
    "SY-GOPON-16OLT-L3-AC-PS"
  ],

  "GPON OLT PS": [
    "SY-GPON-4OLT-AC-PS",
    "SY-GPON-8OLT-AC-PS",
    "SY-GPON-16OLT-AC-PS"
  ]
},

// ── ONT ───────────────────────────────
"ONT": {
  "XPON ONT": [
    "SY-GPON-1000R-DONT",
    "SY-GPON-4000R-DONT",
    "SY-GPON-1010-DONT",
    "SY-GPON-1001-DONT",
    "SY-GPON-1000-2WDONT",
    "SY-GPON-1100-WDONT",
    "SY-GPON-1110-R2-WDONT",
    "SY-GPON-1110-WDONT",
    "SY-GPON-2000-WADONT",
    "SY-GPON-2000-WADONT-PRO",
    "SY-GPON-2010-WADONT",
    "SY-GPON-2010-WADONT (HR)",
    "SY-GPON-2010R2-WADONT",
    "SY-GPON-2010-WADONT-PRO",
    "SY-GPON-2010-WADONT-PRO-V2",
    "SY-GPON-2010 WADONT (LOCKING}",
    "SY-GPON-4010-WADONT",
    "SY-GPON-4010-AX1500",
    "SY-GPON-4010-AX3000"
  ]
},

  // ── Media Converter ─────────────────────────
  "Media Converter": {
    "Media Converter": [
      "GOMC-1303-02",
      "GOMC-1303-20",
      "GOMC-BI3503-20",
      "GOMC-BI5303-20",
      "GOMC-1312-20",
      "GOMC-BI3512-20",
      "GOMC-BI5312-20",
      "GOMC-1312-SFP"
    ]
  },

  // ── Optical Transceivers ────────────────────
  "Optical Transceivers": {
    "155M SFP": [
      "GOXS-1303-02D",
      "GOXS-1303-20D",
      "GOXS-1503-40D",
      "GOXS-1503-80D",
      "GOXS-C03-02",
      "GOXS-BI3503-20D",
      "GOXS-BI5303-20D",
      "GOXS-BI3503-20SC",
      "GOXS-BI5303-20SC",
      "GOXS-BI3503-40D",
      "GOXS-BI5303-40D",
      "GOXS- BI4503-80D",
      "GOXS- BI5403-80D",
      "GOXS- BI4503-120D",
      "GOXS- BI5403-120D"
    ],
    "1.25G SFP": [
      "GOXS-8512-02D",
      "GOHS-8512-02D",
      "GOXS-1312-20D",
      "GOHS-1312-20D",
      "GOXS-1312-40D",
      "GOXS-1512-40D",
      "GOXS-1512-80D",
      "GOXS-1512-120D",
      "GOXS-C12-02",
      "GOXS-BI3512-20D",
      "GOXS-BI5312-20D",
      "GOXS-BI3512-20SC",
      "GOXS-BI5312-20SC",
      "GOXS-BI3412-20D",
      "GOXS-BI4312-20D",
      "GOXS-BI3412-40D",
      "GOXS-BI4312-40D",
      "GOXS-BI3512-40D",
      "GOXS-BI5312-40D",
      "GOXS-BI4512-80D",
      "GOXS-BI5412-80D",
      "GOXS-BI4512-120D",
      "GOXS-BI5412-120D"
    ],
    "STM1 SFP": [
      "GOXS-1303-02STM1",
      "GOXS-1303-20STM1",
      "GOXS-1303-40STM1",
      "GOXS-1503-40STM1",
      "GOXS-1503-80STM1"
    ],
    "STM4 SFP": [
      "GOXS-1306-02STM4",
      "GOXS-1306-20STM4",
      "GOXS-1306-40STM4",
      "GOXS-1506-40STM4",
      "GOXS-1506-80STM4"
    ],
    "SFP 16 SFP": [
      "GOXS-1324-02STM16",
      "GOXS-1324-20STM16",
      "GOXS-1324-40STM16",
      "GOXS-1524-40STM16",
      "GOXS-1524-80STM16"
    ],
    "STM 64 SFP": [
      "GOXP-1396-02STM64",
      "GOXP-1396-20STM64",
      "GOXP-1396-40STM64",
      "GOXP-1596-40STM64",
      "GOXP-1596-80STM64"
    ],
    "10G SFP+": [
      "GOXP-8596-02",
      "GOHP-8596-02",
      "GOXP-1396-20",
      "GOHP-1396-20",
      "GOXP-1596-40",
      "GOXP-1596-80",
      "GOXP-C96-02",
      "GOXP-BI2396-20",
      "GOXP-BI3296-20",
      "GOXP-BI2396-40",
      "GOXP-BI3296-40",
      "GOXP-BI2396-60",
      "GOXP-BI3296-60",
      "GOXP-BI2396-80",
      "GOXP-BI3296-80",
      "GOXP-BI4596-80",
      "GOXP-BI5496-80"
    ],
    "1.25G CWDM SFP": ["GOXS-CWDM4612-80", "GOXP-CWDM4696-80"],
    "10G DWDM SFP+": ["GOXP-DWDM96-80"],
    "CWMDM-Mux/DeMux": ["SY-CWDM-04MD1355", "SY-CWDM-08MD4761-ESR", "SY-CWDM-16MD1261-R"],
    "DWDM-Mux/DeMux": [
      "SY-DWDM-8M27342-R",
      "SY-DWDM-8D2734-R",
      "SY-DWDM-16M2742-R",
      "SY-DWDM-16D2742-R",
      "SY-DWDM-24M2346-R",
      "SY-DWDM-24D2346-R",
      "SY-DWDM-32M2157-R",
      "SY-DWDM-32M2157-R",
      "SY-DWDM-40M21602-R",
      "SY-DWDM-40M2160-R"
    ],
    "10G XFP": [
      "GOXX-8596-02",
      "GOXX-1396-20",
      "GOXX-1596-40",
      "GOXX-1596-80",
      "GOXX-BI2396-20",
      "GOXX-BI3296-20",
      "GOXX-BI2396-40",
      "GOXX-BI3296-40"
    ],
    "25G SFP28": [
      "GOXP-8528-02",
      "GOXP-1328-10",
      "GOXP-1328-40",
      "GOXP-8528-02 IND",
      "GOXP-1328-10 IND"
    ],
    "40G QSFP+": [
      "GOXQ-8540G-02SR4",
      "GOXQ-1340G-10LR4",
      "GOXQ-1340G-10LRM",
      "GOXQ-1340G-20LR4",
      "GOXQ-1340G-ER4L",
      "GOXQ-1340G-ER4",
      "GOXQ-1340G-ZR4"
    ],
    "100G QSFP28": [
      "GOXQ28-85100G-SR4",
      "GOXQ28-13100G-02",
      "GOXQ28-13100G-LR4",
      "GOXQ28-13100G-20LR4",
      "GOXQ28-13100G-ER4",
      "GOXQ28-13100G-ZR4"
    ],
    "100G QSFP28 BIDI": [
      "GOXQ28-BI23100G-LR4",
      "GOXQ28-BI32100G-LR4",
      "GOXQ28-BI23100G-20LR",
      "GOXQ28-BI32100G-20LR",
      "GOXQ28-BI49100G-ERL",
      "GOXQ28-BI49100G-ERL",
      "GOXQ28-BI49100G-ER",
      "/GOXQ28-BI94100G-ER",
      "GOXQ28-BI49100G-ZR",
      "GOXQ28-BI94100G-ZR"
    ],
    "10G DAC Cable": ["G0XP-CAB-10GSFP-P1M", "G0XP-CAB-10GSFP-P3M", "G0XP-CAB-10GSFP-P5M"],
    "25G DAC Cable": ["GOXP-CAB-SFP28-P1M", "GOXP-CAB-SFP28-P3M", "GOXP-CAB-SFP28-P5M"],
    "40G QSFP AOC Cable": ["GOXQ-CAB-QSFP-A1M", "GOXQ-CAB-QSFP-A3M", "GOXQ-CAB-QSFP-A5M", "GOXQ-CAB-QSFP+-A10M"],
    "PON SFP": ["GOXS-BI4312-20PON4+", "GOXS-BI4312-20PONC4+", "GOXS-BI4312-20PONC5+"],
    "10G AOC Cable": ["G0XP-CAB-10GSFP-A1M", "GOXP-CAB-10GSFP-A3M", "G0XP-CAB-10GSFP-A5M", "G0XP-CAB-10GSFP-A10M"],
    "25G AOC Cable": ["GOXP-CAB-SFP28-A1M", "GOXP-CAB-SFP28-A3M", "GOXP-CAB-SFP28-A5M", "GOXP-CAB-SFP28-A10M"],
    "100G AOC Cable": [
      "GOXQ-CAB-QSFP28-A1M",
      "GOXQ-CAB-QSFP28-A3M",
      "GOXQ-CAB-QSFP28-A5M",
      "GOXQ-CAB-QSFP28-A10M",
      "GOXQ-CAB-QSFP28-A30M"
    ],
    "40G QSFP DAC Cable": [
      "GOXQ-CAB-QSFP-P1M",
      "GOXQ-CAB-QSFP-P3M",
      "GOXQ-CAB-QSFP-P5M",
      "GOXQ-CAB-QSFP/4SFP+-P1M",
      "GOXQ-CAB-QSFP/4SFP+-P3M",
      "GOXQ-CAB-QSFP/4SFP+-P5M",
      "GOXQ-CAB-QSFP/4SFP+-A1M",
      "GOXQ-CAB-QSFP/4SFP+-A3M",
      "GOXQ-CAB-QSFP/4SFP+-A5M"
    ],
    "100G DAC Cable": [
      "GOXQ-CAB-QSFP28-P1M",
      "GOXQ-CAB-QSFP28-P3M",
      "GOXQ-CAB-QSFP28-P5M",
      "GOXQ-CAB-QSFP28/4SF28-P1M",
      "GOXQ-CAB-QSFP28/4SF28-P3M",
      "GOXQ-CAB-QSFP28/4SF28-P5M",
      "GOXQ-CAB-QSFP28/4SFP28-A1M",
      "GOXQ-CAB-QSFP28/4SFP28-A3M",
      "GOXQ-CAB-QSFP28/4SFP28-A5M"
    ]
  },

  // ── Networking Switch ───────────────────────
  "Networking Switch": {
    "Unmanaged POE Switches-AI Series": [
      "SY-0400P-2T-78W-AI",
      "SY-0800P-2T-120W-AI",
      "SY-0800P-2G-120W-AI",
      "SY-4000P-1T-2S-96W-AI",
      "SY-8000P-2T-150W-AI",
      "SY-8000P-2T-2S-150W-AI",
      "SY-2400P-2T-2S-400W"
    ],
    "Managed L2 POE Switches": [
      "SY-8000P-2S-120W-L2",
      "SY-8000P-2S-150W-L2",
      "SY-2400P-4S-400W-L2",
      "SY-ESPL2G82S",
      "SY-ESPL2G244X"
    ],
    "Managed Industrial POE Switch": [
      "SY-4000P-2S-IND",
      "SY-8000P-2S-IND",
      "SY-8000P-4S-IND",
      "SY-1016P-4S-IND",
      "SY-1024P-8CS-4P-IND",
      "SY-2400X-2Q28-L3",
      "SY-2400S-4X-DP",
      "SY-2400-4X-L2",
      "SY-8000-4X-L2"
    ]
  },

  // ── Entrance Product ────────────────────────
  "Entrance Product": {
    "Residential Boom Barrier": ["SY-PB2500 6 Mtr", "SY-RB3000 6MTR"],
    "Parking Boom Barrier": ["SY-PB800"],
    "High Speed Toll  Barrier": ["SY-HB600", "SY-HB900"],
    "Toll Barrier": ["SY-TB900", "SY-TB600"],
    "Loop Detector": ["SY-LD01"],
    "Safety Sensor": ["SY-PC01"],
    "Single Lane  Radar": ["SY-RADAR"],
    "UHF Reader": ["SY-U9006001", "SY-U9006001-RJ", "SY-U15001200", "SY-U15001200-RJ"],
    "UHF RFID TCP IP PCB-15 mtr": ["SY-U1500 1200-RJ-PCB"],
    "UHF RFID TCP IP PCB-6 mtr": ["SY-U60019001 RJ (PCB)"],
    "UHF RFID W/G PCB-15 mtr": ["SY-U1500 1200-PCB"],
    "UHF RFID W/G PCB-6 mtr": ["SY-U60019001  (PCB)"],
    "UHF ADAPTOR": ["ADAPTOR-12V-3A(UHP ADAPTOR)"]
  },

  // CCTV

  "CCTV": {
    "XVR": ["Other"],
    "XVR": ["Other"],
    "IP-Camera": ["Other"]
  },



  

  // ── Passive Products ────────────────────────
  "Passive Products": {
    "Unarmoured Fiber Cable": ["SY-CATV-2F-UNARM-GYP( Coil)", "SY-CATV-4F-UNARM-GYP ( Coil)", "SY-CATV-6F-UNARM-GYP( Coil)", "SY-CATV-12F-UNARM-GYP( Coil)"],
    "Armoured Fiber Cable": ["SY-CATV-6F-ARM-OM2", "SY-CATV-12F-ARM-OM2", "SY-CATV-6F-ARM-OM3", "SY-CATV-12F-ARM-OM3"],
    "Drop Cable": ["Syrotech-DROP2FR-A1-IND", "SY-DROP2FF-A1-IND", "SY-DROP1FF-A1-IND"],
    "CAT6 Cable": ["SY-CAT6-UTP-305M(0.48)", "SY-CAT6-SFTP-305M (0.51)", "SY-CAT6-SFTP-305M (0.55)"],
    "Adaptor": [
      "SY-FA-SCPC",
      "SY-FA-SCAPC",
      "SY-FA-LCP-LCP",
      "SY-FA-LCA-LCA",
      "SY-FA-LCP-SCP",
      "SY-FA-FCP-FCP",
      "SY-FA-FCP-SCP",
      "SY-FA-FCP-LCP",
      "SY-FA-STP-STP",
      "SY-FA-E2KA",
      "SY-FA-SCPC-DX",
      "SY-FA-SCAPC-DX",
      "SY-FA-LCPC-DX",
      "SY-FA-SCPC-DX-MM",
      "SY-FA-LCPC-DX-MM",
      "SY-FA-SCPC-MM",
      "SY-FA-LCP-LCP-MM",
      "SY-FA-STP-STP-MM",
      "SY-FA-FCP-FCP-MM"
    ],
    "Attenutor": [
      "SY-FAT-LCPM-LCPF-1",
      "SY-FAT-LCPM-LCPF-2",
      "SY-FAT-LCPM-LCPF-3",
      "SY-FAT-LCPM-LCPF-5",
      "SY-FAT-LCPM-LCPF-7",
      "SY-FAT-LCPM-LCPF-10",
      "SY-FAT-LCPM-LCPF-15",
      "SY-FAT-LCPM-LCPF-20",
      "SY-FAT-FCPM-FCPF-1",
      "SY-FAT-FCPM-FCPF-3",
      "SY-FAT-FCPM-FCPF-5",
      "SY-FAT-FCPM-FCPF-10",
      "SY-FAT-FCPM-FCPF-15",
      "SY-FAT-FCPM-FCPF-20",
      "SY-FAT-SCPM-SCPF-1",
      "SY-FAT-SCPM-SCPF-3",
      "SY-FAT-SCPM-SCPF-5",
      "SY-FAT-SCPM-SCPF-7",
      "SY-FAT-SCPM-SCPF-10",
      "SY-FAT-SCPF-SCPF-1",
      "SY-FAT-SCPF-SCPF-3",
      "SY-FAT-SCPF-SCPF-5",
      "SY-FAT-SCPF-SCPF-7",
      "SY-FAT-SCPF-SCPF-10",
      "SY-FAT-FCPF-FCPF-1",
      "SY-FAT-FCPF-FCPF-3",
      "SY-FAT-FCPF-FCPF-5",
      "SY-FAT-FCPF-FCPF-7",
      "SY-FAT-FCPF-FCPF-10",
      "SY-FAT-FCPF-FCPF-15"
    ],
    "Steel Tube PLC Splitter": [
      "SY-PLC-ST-1X2-WC-1A",
      "SY-PLC-ST-1X4-WC-1A",
      "SY-PLC-ST-1X8-WC-1A",
      "SY-PLC-ST-1X16-WC-1A",
      "SY-PLC-ST-1X32-WC-1A",
      "SY-PLC-ST-1X64-WC-1A",
      "SY-PLC-ST-2X2-WC-1A",
      "SY-PLC-ST-2X4-WC-1A",
      "SY-PLC-ST-2X8-WC-1A",
      "SY-PLC-ST-2X16-WC-1A"
    ],
    "ABS PLC Splitter ": ["SY-PLC-ABS-1X2-WC-1A"],
    "ABS PLC Splitter": [
      "SY-PLC-ABS-1X4-WC-1A",
      "SY-PLC-ABS-1X8-WC-1A",
      "SY-PLC-ABS-1X16-WC-1A",
      "SY-PLC-ABS-1X32-WC-1A",
      "SY-PLC-ABS-1X64-WC-1A"
    ],
    "LGX PLC Splitter": [
      "SY-PLC-LGX-1X2-SCP/SCA",
      "SY-PLC-LGX-1X4-SCP/SCA",
      "SY-PLC-LGX-1X8-SCP/SCA",
      "SY-PLC-LGX-1X16-SCP/SCA",
      "SY-PLC-LGX-1X32-SCP/SCA",
      "SY-PLC-LGX-1X64-SCP/SCA"
    ],
    "Triple Windo Coupler": [
      "STWC-1x2-99-01-WC",
      "STWC-1x2-95-5-WC",
      "STWC-1x2-90-10-WC",
      "STWC-1x2-85-15-WC",
      "STWC-1x2-80-20-WC",
      "STWC-1x2-75-25-WC",
      "STWC-1x2-70-30-WC",
      "STWC-1x2-65-35-WC",
      "STWC-1x2-60-40-WC",
      "STWC-1x2-55-45-WC",
      "STWC-1x2-50-50-WC"
    ],
    "Fiber Splitter Box( FSB) W/O Loadded": ["SY-FSB-1x4", "SY-FSB-1x8", "SY-FSB-1x16", "SY-FSB-1x32"],
    "Fiber Splitter Box with LGX": ["SY-FSB-1x4-XXX LGX", "SY-FSB-1x8-XXX LGX", "SY-FSB-1x16-XXX LGX", "SY-FSB-1x32-XXX LGX"],
    "Fiber Splitter Box with Steel Tuber Splitter": ["SY-FSB-1x4-XXX ST", "SY-FSB-1x8-XXX ST", "SY-FSB-1x16-XXX ST", "SY-FSB-1x32-XXX ST"],
    "Fiber Distribution BOX W/O Loaded": ["SY-FDB-6F", "SY-FDB-12F", "SY-FDB-24F", "SY-FDB-48F"],
    "Fiber Splittter Box With Loaded": ["SY-FDB-6F-XXX", "SY-FDB-12F-XXX", "SY-FDB-24F-XXX", "SY-FDB-48F-XXX"],
    "FTTH Wall Outlet": [
      "SY-FTTHS-BOX",
      "SY-FTTH-BOX-4WAY",
      "SY-FTTH-BOX-1F",
      "SY-FTTH-BOX-1F-XXX",
      "SY-FTTH-BOX-2F-XXX"
    ],
    "Fast Connector": ["SY-FFC-SCPC", "SY-FFC-SCAPC"],
    "Rack Mount Non-Sliding  LIU Unloaded ": ["SY-LIU-6R-FMS-1U", "SY-LIU-12R-FMS-1U", "SY-LIU-24R-FMS-1U", "SY-LIU-48R-FMS-2U"],
    "Rack Mount Non-Sliding  LIU Loaded ": ["SY-LIU-6R-FMS-XXX-1U", "SY-LIU-12R-FMS-XXX-1U", "SY-LIU-24R-FMS-XXX-1U", "SY-LIU-48R-FMS-XXX-1U"],
    "RackMount -Sliding Type-Unloaded": ["SY-LIU-24F-RS"],
    "RackMount -Sliding Type-Single Mode Simplex- SC/PC or SC/APC LIU/FMS": [
      "SY-LIU-6F-RS-XXXX",
      "SY-LIU-12F-RS-XXXX",
      "SY-LIU-24F-RS-XXXX",
      "SY-LIU-48F-RS-XXXX",
      "SY-LIU-96F-RS-XXXX"
    ],
    "RackMount -Sliding Type-MultiMode Simplex- SC/PC  LIU/FMS": [
      "SY-LIU-6F-RS-XXXX-MM",
      "SY-LIU-12F-RS-XXXX-MM",
      "SY-LIU-24F-RS-XXXX-MM",
      "SY-LIU-48F-RS-XXXX-MM",
      "SY-LIU-96F-RS-XXXX-MM"
    ],
    "RackMount -Sliding Type-Single Mode Duplex- SC/PC or SC/APC  LIU/FMS": ["SY-LIU-6F-RS-XXXX-DX", "SY-LIU-12F-RS-XXXX-DX", "SY-LIU-24F-RS-XXXX-DX", "SY-LIU-48F-RS-XXXX-DX"],
    "RackMount -Sliding Type-MultiMode Duplex- SC/PC LIU/FMS": ["SY-LIU-6F-RS-XXXX-MM-DX", "SY-LIU-12F-RS-XXXX-MM-DX", "SY-LIU-24F-RS-XXXX-MM-DX", "SY-LIU-48F-RS-XXXX-MM-DX"],
    "WallMount  Type-Single Mode Simplex- SC/PC or SC/APC or LC/PC or LC/APC LIU/FMS": ["SY-LIU-6F-W-XXXX", "SY-LIU-12F-W-XXXX", "SY-LIU-24F-W-XXXX", "SY-LIU-48F-W-XXXX"],
    "WallMount  Type-Single Mode Simplex- ST/PC or FC/APC LIU/FMS": ["SY-LIU-6F-W-XXXX", "SY-LIU-12F-W-XXXX", "SY-LIU-24F-W-XXXX", "SY-LIU-48F-W-XXXX"],
    "WallMount  Type-MultiMode Simplex- SC/PC or SC/APC or LC/PC or LC/APC LIU/FMS": ["SY-LIU-6F-W-XXXX-MM", "SY-LIU-12F-W-XXXX-MM", "SY-LIU-24F-W-XXXX-MM", "SY-LIU-48F-W-XXXX-MM"],
    "WallMount  Type-MultiMode Simplex- ST/PC or FC/APC LIU/FMS": ["SY-LIU-6F-W-XXXX-MM", "SY-LIU-12F-W-XXXX-MM", "SY-LIU-24F-W-XXXX-MM", "SY-LIU-48F-W-XXXX-MM"],
    "WallMount  Type-Single Mode Duplex- SC/PC or SC/APC or LC/PC or LC/APC LIU/FMS": ["SY-LIU-6F-W-XXXX-DX", "SY-LIU-12F-W-XXXX-DX", "SY-LIU-24F-W-XXXX-DX", "SY-LIU-48F-W-XXXX-DX"],
    "WallMount  Type-MultiMode Duplex- SC/PC or LC/PC  LIU/FMS": ["SY-LIU-6F-W-XXXX-MM-DX", "SY-LIU-12F-W-XXXX-MM-DX", "SY-LIU-24F-W-XXXX-MM-DX", "SY-LIU-48F-W-XXXX-MM-DX"],
    "Din Rail LIU": ["SY-LIU-6F-DR-XXXX-DX", "SY-LIU-12F-DR-XXXX-DX"],
    "Standard Patch Cords": ["FSMS-SCP-SCP-3M-(S)", "FSMS-SCP-SCP-5M-(S)", "FSMS-SCA-SCA-3M-(S)", "FSMS-SCA-SCA-5M-(S)"],
    "Standard Pigtail": ["FPT-SM-SCP-2A-(S)", "FPT-SM-SCA-2A-(S)", "FPT-SM-BUNCH-SCP/SCA-2A"],
    "SM Simplex Customized Patch Cords": [
      "FSMS-SCP-SCP-XM",
      "FSMS-SCP-LCP-XM",
      "FSMS-LCP-LCP-XM",
      "FSMS-SCA-SCA-XM",
      "FSMS-SCA-SCP-XM",
      "FSMS-SCA-LCP-XM",
      "FSMS-SCA-LCA-XM",
      "FSMS-SCP-STP-XM",
      "FSMS-SCP-FCP-XM",
      "FSMS-STP-STP-XM",
      "FSMS-STP-FCP-XM",
      "FSMS-FCP-FCP-XM",
      "FSMS-FCP-LCP-XM"
    ],
    "SM Duplex Customized Patch Cords": [
      "FSMD-SCP-SCP-XM",
      "FSMD-SCP-LCP-XM",
      "FSMD-LCP-LCP-XM",
      "FSMD-SCA-SCA-XM",
      "FSMD-SCA-SCP-XM",
      "FSMD-SCA-LCP-XM",
      "FSMD-SCA-LCA-XM",
      "FSMD-SCP-STP-XM",
      "FSMD-SCP-FCP-XM",
      "FSMD-STP-STP-XM",
      "FSMD-STP-FCP-XM",
      "FSMD-FCP-FCP-XM",
      "FSMD-FCP-LCP-XM"
    ],
    "OM1 Duplex Customized Patch Cords": [
      "FOM1D-SCP-SCP-XM",
      "FOM1D-SCP-LCP-XM",
      "FOM1D-LCP-LCP-XM",
      "FOM1D-STP-STP-XM",
      "FOM1D-FCP-FCP-XM",
      "FOM2D-SCP-SCP-XM"
    ],
    "OM2 Duplex Customized Patch Cords": ["FOM2D-SCP-LCP-XM", "FOM2D-LCP-LCP-XM", "FOM2D-STP-STP-XM", "FOM2D-FCP-FCP-XM"],
    "OM3 Duplex Customized Patch Cords": [
      "FOM3D-SCP-SCP-XM",
      "FOM3D-SCP-LCP-XM",
      "FOM3D-LCP-LCP-XM",
      "FOM3D-STP-STP-XM",
      "FOM3D-FCP-FCP-XM"
    ],
    "OM4 Duplex Customized Patch Cords": [
      "FOM4D-SCP-SCP-XM",
      "FOM4D-SCP-LCP-XM",
      "FOM4D-LCP-LCP-XM",
      "FOM4D-STP-STP-XM",
      "FOM4D-FCP-FCP-XM"
    ],
    "OM5 Duplex Customized Patch Cords": [
      "FOM5D-SCP-SCP-XM",
      "FOM5D-SCP-LCP-XM",
      "FOM5D-LCP-LCP-XM",
      "FOM5D-STP-STP-XM",
      "FOM5D-FCP-FCP-XM"
    ],
    "SM Pigtail Customized": [
      "FPT-SM-SCP-XM",
      "FPT-SM-LCP-XM",
      "FPT-SM-LCA-XM",
      "FPT-SM-SCA-XM",
      "FPT-SM-FCP-XM",
      "FPT-SM-STP-XM"
    ],
    "MM OM1  Pigtail Customized": ["FPT-OM1-SCP-XM", "FPT-OM1-LCP-XM", "FPT-OM1-FCP-XM", "FPT-OM1-STP-XM"],
    "MM OM2  Pigtail Customized": ["FPT-OM2-SCP-XM", "FPT-OM2-LCP-XM", "FPT-OM2-FCP-XM", "FPT-OM2-STP-XM"],
    "MM OM3  Pigtail Customized": ["FPT-OM3-SCP-XM", "FPT-OM3-LCP-XM", "FPT-OM3-FCP-XM", "FPT-OM3-STP-XM"]
  },

  // ── Grandstream UC ──────────────────────────
  "Grandstream UC": {
    "Analog Telephone Adaptors": [
      "HT813",
      "HT801V2",
      "HT802V2",
      "HT812V2",
      "HT814V2",
      "HT818V2",
      "HT841",
      "HT881"
    ],
    "Gateways": [
      "GXW4216",
      "GXW4224",
      "GXW4232",
      "GXW4248",
      "GXW4216V2",
      "GXW4224V2",
      "GXW4232V2",
      "GXW4248V2"
    ],
    "IP-PBX": [
      "UCM6301",
      "UCM6302",
      "UCM6304",
      "UCM6308",
      "UCM6300A",
      "UCM6302A",
      "UCM6304A",
      "UCM6308A"
    ],
    "Wireless IP Phones": [
      "DP720",
      "DP750",
      "DP760",
      "DP722",
      "DP725",
      "DP730",
      "DP735",
      "DP752",
      "DP755",
      "WP810",
      "WP816",
      "WP820",
      "WP822",
      "WP825",
      "WP826",
      "WP836",
      "WP856"
    ],
    "HD IP Phones & Headsets": [
      "GHP610",
      "GHP611",
      "GHP610W",
      "GHP611W",
      "GHP620",
      "GHP621",
      "GHP620W",
      "GHP621W",
      "GHP630",
      "GHP631",
      "GHP630W",
      "GHP631W",
      "GXP1610",
      "GXP1610P",
      "GXP1615",
      "GXP1620",
      "GXP1625",
      "GXP1628",
      "GXP1630",
      "GXP2130",
      "GXP2135",
      "GXP2140",
      "GXP2160",
      "GXP2170",
      "GXP2200 EXT",
      "GRP2601",
      "GRP2601P",
      "GRP2601W (SZ only)",
      "GRP2602",
      "GRP2602P",
      "GRP2602W",
      "GRP2602G",
      "GRP2603",
      "GRP2603P",
      "GRP2604",
      "GRP2604P",
      "GRP2610",
      "GRP2610P",
      "GRP2611G",
      "GRP2612",
      "GRP2612P",
      "GRP2612W",
      "GRP2612G",
      "GRP2613",
      "GRP2613W",
      "GRP2614",
      "GRP2615",
      "GRP2616",
      "GRP2624",
      "GRP2624 Pro (NEW, GA 1H Jun)",
      "GRP2634",
      "GRP2636",
      "GRP2650",
      "GRP2670",
      "GBX20",
      "GRP_WM_S",
      "GRP_WM_L",
      "GRP_WM_A",
      "GRP_WM_B",
      "GRP_WM_C",
      "GRP_WM_D",
      "GUV3000 (LAST CALL)"
    ],
    "IP Video/Audio Conferencing": ["GMD1208", "GAC2500", "GAC2570", "GVC3220"],
    "IP Video / Multimedia Phones": ["GXV3380_WM", "GXV3450", "GXV3470", "GXV3480"],
    "SIP Intercom Speaker": [
      "GSC3506 V2",
      "GSC3506_CB",
      "GSC3516",
      "GSC3518HS",
      "GSC3560 (NEW, GA 2H May)",
      "GSC3565 (NEW, GA 1H Jun)"
    ],
    "Access Control Products": [
      "GDS3725",
      "GDS3726",
      "GDS3726Q (NEW, GA 2H Jun)",
      "GDS3727",
      "GDS37xx NFC FOB (G-AC1)",
      "GDS37xx NFC FOB (G-AD2)",
      "GDS37xx NFC CARD (G-AC1)",
      "GDS37xx NFC CARD (G-AD2)",
      "GSC3570",
      "GSC3574",
      "GSC3575"
    ]
  },

  // ── Grandstream Networking ──────────────────
  "Grandstream Networking": {
    "Convergence Products": [
      "GCC6010",
      "GCC6010W",
      "GCC6011",
      "GCC6020",
      "GCC6021",
      "GCC-UC-50 SMB Upgrade for GCC601x only",
      "GCC-UC-200-SMB Upgrade for GCC602x only",
      "GCC-UC-Extra-50-EXT Upgrade",
      "GCC-UC-Extra-4-Call Upgrade",
      "GCC-UC-Extra-100-EXT Upgrade for GCC602x only",
      "GCC-UC-Extra-16-Call Upgrade for GCC602x only"
    ],
    "Multiwan Router": [
      "GWN7001",
      "GWN7002",
      "GWN7003",
      "GWN7062E",
      "GWN7062ET",
      "GWN7062M (NEW)",
      "GWN7072 (NEW, GA 2H Jun)"
    ],
    "Wireless AP": [
      "GWN7302",
      "GWN7603",
      "GWN7604",
      "GWN7605",
      "GWN7605LR",
      "GWN7605CLR",
      "GWN7615",
      "GWN7624",
      "GWN7625",
      "GWN7630",
      "GWN7630LR",
      "GWN7660",
      "GWN7660E",
      "GWN7660ELR",
      "GWN7660EM",
      "GWN7661E",
      "GWN7662",
      "GWN7670",
      "GWN7670WM",
      "GWN7670LR",
      "GWN7670E(NEW, GA 1H May)",
      "GWN7670ELR (NEW, GA 1H Jun)",
      "GWN7672",
      "GWN7672L (NEW, GA 2H May)",
      "GWN7672WM (NEW, GA 1H Jun)",
      "GWN7673 (NEW, GA 1H Jun)",
      "GWN7674Lite (NEW, GA 1H Jun)",
      "GWN7674LR Lite (New, GA 2H Jun)",
      "GWN7674",
      "GWN7664E",
      "GWN7664ELR",
      "GWN7665"
    ],
    "Unmanaged Switch": [
      "GWN7700",
      "GWN7700P",
      "GWN7700M",
      "GWN7700MP",
      "GWN7701",
      "GWN7701P",
      "GWN7701PA",
      "GWN7701M",
      "GWN7702",
      "GWN7702P",
      "GWN7703",
      "GWN7706"
    ],
    "L2 Managed Switch": [
      "GWN7710R",
      "GWN7711",
      "GWN7711P",
      "GWN7721",
      "GWN7721P",
      "GWN7721PE (NEW, GA 1H Jun)",
      "GWN7801",
      "GWN7801P",
      "GWN7802",
      "GWN7802P",
      "GWN7803",
      "GWN7803P",
      "GWN7806",
      "GWN7806P",
      "GWN7801P Pro",
      "GWN7802P Pro",
      "GWN7803 Pro",
      "GWN7803PL Pro",
      "GWN7803PH Pro",
      "GWN7806PL Pro",
      "GWN7806PH Pro"
    ],
    "L3 Managed Switch": [
      "GWN7811",
      "GWN7811P",
      "GWN7812P",
      "GWN7813",
      "GWN7813P",
      "GWN7816",
      "GWN7816P",
      "GWN7821P",
      "GWN7822P",
      "GWN7830",
      "GWN7831",
      "GWN7832"
    ]
  }

};


// ✅ Helper functions
export const getCategories = () => Object.keys(PRODUCT_MODELS);
export const getSubCategories = (category) => Object.keys(PRODUCT_MODELS[category] || {});
export const getItems = (category, subCategory) => PRODUCT_MODELS[category]?.[subCategory] || [];


// ══════════════════════════════════════════════════════
// CUSTOMER DASHBOARD — all products visible to customers
// ══════════════════════════════════════════════════════
export const CUSTOMER_PRODUCT_MODELS = PRODUCT_MODELS;
export const CUSTOMER_CATEGORIES = getCategories();


// ══════════════════════════════════════════════════════
// SALES DASHBOARD — products visible to sales persons
// Add/remove categories here for Dashboard.jsx
// ══════════════════════════════════════════════════════
export const SALES_PRODUCT_MODELS = {
  "OLT":                                  PRODUCT_MODELS["OLT"],
  "ONT":                                          PRODUCT_MODELS["ONT"],
  "Media Converter":                            PRODUCT_MODELS["Media Converter"],
  "Optical Transceivers":                       PRODUCT_MODELS["Optical Transceivers"],
  "Networking Switch":                          PRODUCT_MODELS["Networking Switch"],
  "Entrance Product":                           PRODUCT_MODELS["Entrance Product"],
  "Passive Products":                           PRODUCT_MODELS["Passive Products"],
  "Grandstream UC":                             PRODUCT_MODELS["Grandstream UC"],
  "Grandstream Networking":                     PRODUCT_MODELS["Grandstream Networking"],
  "CCTV":                                         PRODUCT_MODELS["CCTV"]
};
export const SALES_CATEGORIES = Object.keys(SALES_PRODUCT_MODELS);




























