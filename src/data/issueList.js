// ══════════════════════════════════════════════════════════════════
// issueList.js — Issue list mapped by Category & SubCategory
// Used in: CustomerDashboard.jsx, SupportDashboard.jsx, Dashboard.jsx
//
// Structure:
//   ISSUE_LIST[category]["_common"]      → issues shown for ALL subcategories of that category
//   ISSUE_LIST[category][subCategory]    → issues shown ONLY for that specific subcategory
//
// How to use:
//   When customer selects only Category     → show _common issues
//   When customer selects Category + Sub    → show _common + subcategory issues combined
// ══════════════════════════════════════════════════════════════════

export const ISSUE_LIST = {

 // ── OLT ──────────────────────────────────────────────────
"OLT": {

  // Common issues for all OLT subcategories
  "_common": [
    "Olt Configuration",
    "User Fluctuation Issue",
    "Gpon Plug&Play Configuration",
    "Epon to Gpon Migration",
    "Olt Cascading Configuration",
    "Olt Firmware Upgrade",
    "Olt Pon Port Issue",
    "Olt Uplink Port Issue",
    "Olt Speed Issue",
    "Multiple ISP Configuration",
    "Olt Rebooting Issue",
    "Olt Fan not Working",
    "Lease Line Configuration",
    "Vlan Configuration",
    "Brand New Olt DOA Case",
    "Olt Booting Issue",
    "Line & Service Profile Configuration",
    "Pon Optical issue",
    "Others",
  ],

  // OLT subcategories
  "EPON OLT": [],
  "GPON OLT": [],
  "EPON OLT PS": [],
  "GPON OLT PS": [],
},

// ── ONT ──────────────────────────────────────────────────
"ONT": {

  "XPON ONT": [
    "Ont Configuration",
    "Voice Configuration",
    "Port Forwarding",
    "Ont not Register",
    "Ont Login Issue",
    "Ont Firmware Upgrade",
    "Customized Ont",
    "Ont WiFi Issue",
    "Only Power Led Light",
    "Ont Query",
    "Ont Adaptor Issue",
    "Ont Speed Issue",
    "Wifi Extender/ Repeater via LAN",
    "Lan Port Issue",
    "Ont Led Issue",
    "Others",
  ],
},

  // ── Media Converter ─────────────────────────────────────────────
  "Media Converter": {
    "_common": [
      "Pon SFP Rx/Tx Optical Power Issue",
      "Not Compatible",
      "DAC Cable Issue",
      "Media Converter Issue",
      "Low Pon Power Issue",
      "Uplink SFP Rx/Tx Power Issue",
      "Uplink SFP not Getting UP",
      "Others",
    ],
  },

  // ── Optical Transceivers ────────────────────────────────────────
  "Optical Transceivers": {
    "_common": [
      "Pon SFP Rx/Tx Optical Power Issue",
      "Not Compatible",
      "DAC Cable Issue",
      "Media Converter Issue",
      "Low Pon Power Issue",
      "Uplink SFP Rx/Tx Power Issue",
      "Uplink SFP not Getting UP",
      
    ],
  },

  // ── Networking Switch ───────────────────────────────────────────
  "Networking Switch": {
    "_common": [
      "Power Supply Issue",
      "Switch Configuration",
      "Switch Firmware Upgrade",
      "Switch Troubleshooting",
      "Switch Speed Issue",
      "Latency Issue",
      "Switch Ring Configuration",
      "Switch Testing",
      "Others",
    ],

    "Unmanaged POE Switch": [
      "Unmanaged Switch",
      "POE Port Issue",
      "POE & Fiber Switch",
      "others",
    ],

    "Manage Poe Switch": [
      "Manageable Switch (L2/L3)",
      "POE Port Issue",
      "POE & Fiber Switch",
      "POE & Non_POE Switch (L2/L3)",
      "Fiber Switch (L2/L3)",
       "others",
    ],

    "L2& L3 manage Switch": [
      "Manageable Switch (L2/L3)",
      "POE Port Issue",
      "POE & Fiber Switch",
      "POE & Non_POE Switch (L2/L3)",
      "Fiber Switch (L2/L3)",
      "others",
    ],
    "Industrial Manage POE & Non-POE": [
      "Manageable Switch (L2/L3)",
      "POE Port Issue",
      "POE & Fiber Switch",
      "POE & Non_POE Switch (L2/L3)",
      "Fiber Switch (L2/L3)",
      "others",
    ],

    "Industrial Unmanage POE & Non_poe": [
      "Manageable Switch (L2/L3)",
      "POE Port Issue",
      "POE & Fiber Switch",
      "POE & Non_POE Switch (L2/L3)",
      "Fiber Switch (L2/L3)",
      "others",
    ],
    "Desktop": [
      "others",
    ],
    "Power Supply": [
      "others",
    ],

    
  },

  // ── Grandstream UC ──────────────────────────────────────────────
  "Grandstream UC": {
    "_common": [
      "AP Configuration",
      "AP Performance Issue",
      "Router Configuration & Troubleshoot",
      "Firewall Config & Troubleshoot",
      "POE & Non_POE Switch (L2/L3)",
      "Fiber Switch (L2/L3)",
      "Unmanaged Switch",
      "GDMS Cloud Config & Troubleshoot",
      "GDMS Controller",
      "Others",
    ],
  },

  // ── Grandstream Networking ──────────────────────────────────────
  "Grandstream Networking": {
    "_common": [
      "AP Configuration",
      "AP Performance Issue",
      "Router Configuration & Troubleshoot",
      "Firewall Config & Troubleshoot",
      "POE & Non_POE Switch (L2/L3)",
      "Fiber Switch (L2/L3)",
      "Unmanaged Switch",
      "GDMS Cloud Config & Troubleshoot",
      "GDMS Controller",
      "Others",
    ],
  },

  // ── Entrance Product ────────────────────────────────────────────
  "Entrance Product": {

    // No common issues — all are subcategory specific
    "_common": [],

    // Access Control subcategories
    "Access Control Products": [
      "Device not coming online",
      "Relay output not working",
      "Door not unlocking",
      "Card not detecting",
      "Software not searching device",
      "Low power supply output",
      "Access control, UHF Reader to Boom Barrier connectivity",
      "Others",
    ],

    // Boom Barrier subcategories
    "Residential Boom Barrier": [
      "Barrier not opening/closing",
      "Barrier jerking during operation",
      "Boom arm auto reverse",
      "Error code issue",
      "Barrier left to right/Right to left direction",
      "Motor direction issue",
      "Barrier controller card component issue",
      "Mechanism sound issue",
      "Supply voltage issue",
      "Remote not working",
      "Photocell issue",
      "Loop Detector issue",
      "Others",
    ],

    "Parking Boom Barrier": [
      "Barrier not opening/closing",
      "Barrier jerking during operation",
      "Boom arm auto reverse",
      "Error code issue",
      "Barrier left to right/Right to left direction",
      "Motor direction issue",
      "Barrier controller card component issue",
      "Mechanism sound issue",
      "Supply voltage issue",
      "Remote not working",
      "Photocell issue",
      "Loop Detector issue",
      "Others",
    ],

    "High Speed Toll  Barrier": [
      "Barrier not opening/closing",
      "Barrier jerking during operation",
      "Boom arm auto reverse",
      "Error code issue",
      "Barrier left to right/Right to left direction",
      "Motor direction issue",
      "Barrier controller card component issue",
      "Mechanism sound issue",
      "Supply voltage issue",
      "Remote not working",
      "Photocell issue",
      "Loop Detector issue",
      "Others",
    ],

    "Toll Barrier": [
      "Barrier not opening/closing",
      "Barrier jerking during operation",
      "Boom arm auto reverse",
      "Error code issue",
      "Barrier left to right/Right to left direction",
      "Motor direction issue",
      "Barrier controller card component issue",
      "Mechanism sound issue",
      "Supply voltage issue",
      "Remote not working",
      "Photocell issue",
      "Loop Detector issue",
      "Others",
    ],

    // UHF Reader subcategories
    "UHF Reader": [
      "Ping not responding",
      "Tag not detecting",
      "Reading range issue",
      "Software not showing tags",
      "Reader rebooting automatically",
      "LAN light off",
      "Buzzer sound issue",
      "Others",
    ],

    "UHF RFID TCP IP PCB-15 mtr": [
      "Ping not responding",
      "Tag not detecting",
      "Reading range issue",
      "Software not showing tags",
      "Reader rebooting automatically",
      "LAN light off",
      "Buzzer sound issue",
      "Others",
    ],

    "UHF RFID TCP IP PCB-6 mtr": [
      "Ping not responding",
      "Tag not detecting",
      "Reading range issue",
      "Software not showing tags",
      "Reader rebooting automatically",
      "LAN light off",
      "Buzzer sound issue",
      "Others",
    ],

    "UHF RFID W/G PCB-15 mtr": [
      "Ping not responding",
      "Tag not detecting",
      "Reading range issue",
      "Software not showing tags",
      "Reader rebooting automatically",
      "LAN light off",
      "Buzzer sound issue",
      "Others",
    ],

    "UHF RFID W/G PCB-6 mtr": [
      "Ping not responding",
      "Tag not detecting",
      "Reading range issue",
      "Software not showing tags",
      "Reader rebooting automatically",
      "LAN light off",
      "Buzzer sound issue",
      "Others",
    ],

    "Loop Detector": [
      "Loop Detector issue",
      "Others",
    ],

    "Safety Sensor": [
      "Photocell issue",
      "Others",
    ],

    "Single Lane  Radar": [
      "Reading range issue",
      "Others",
    ],

    "UHF ADAPTOR": [
      "Others",
    ],



    "Access Controller": [
      "Others",
    ],

    
  },

  // ── Passive Products ────────────────────────────────────────────
  "Passive Products": {
    "_common": [
      "Splitter Losses",
      "Patch Cords Losses (IL/RL)",
      "Packaging",
      "Patch Cords & PLC Length",
      "Branding & Non Branding Product",
      "Product Condition",
      "DOA (Dead on arrival)",
      "Warranty",
      "Received other product",
      "Delivery Time",
      "Others",
    ],
  },


  // CCTV 
  "CCTV": {
    "_common": [
      "Others",
    ],
  },

};


// ══════════════════════════════════════════════════════════════════
// Helper function — call this in your dashboard components
//
// Returns combined issue list based on selected category + subCategory
// Usage:
//   import { getIssues } from "../data/issueList";
//   const issues = getIssues(form.category, form.subCategory);
// ══════════════════════════════════════════════════════════════════

export function getIssues(category, subCategory) {
  if (!category) return [];

  const catData = ISSUE_LIST[category];
  if (!catData) return [];

  const common = catData["_common"] || [];
  const subIssues = subCategory && catData[subCategory] ? catData[subCategory] : [];

  // Merge and deduplicate
  const merged = [...common, ...subIssues];
  return [...new Set(merged)];
}