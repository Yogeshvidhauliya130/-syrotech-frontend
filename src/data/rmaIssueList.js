// rmaIssueList.js — Issue list for RMA tickets ONLY
// Same structure as issueList.js — edit the arrays below later with real RMA-specific wording

export const RMA_ISSUE_LIST = {
  "OLT": {
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
  },
  "ONT": {
    "_common": [
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

    "Power Adaptor":[
    "others"
  ]
  },
  "Wireless Access Point": {
    "_common": ["Other"],
  },
  "Media Converter": {
    "_common": ["Pon SFP Rx/Tx Optical Power Issue",
      "Not Compatible",
      "DAC Cable Issue",
      "Media Converter Issue",
      "Low Pon Power Issue",
      "Uplink SFP Rx/Tx Power Issue",
      "Uplink SFP not Getting UP",
      "Others",],
  },
  "Optical Transceivers": {
    "_common": ["Pon SFP Rx/Tx Optical Power Issue",
      "Not Compatible",
      "DAC Cable Issue",
      "Media Converter Issue",
      "Low Pon Power Issue",
      "Uplink SFP Rx/Tx Power Issue",
      "Uplink SFP not Getting UP",
      "Others",],
  },
  "Networking Switch": {
    "_common": ["Power Supply Issue",
      "Switch Configuration",
      "Switch Firmware Upgrade",
      "Switch Troubleshooting",
      "Switch Speed Issue",
      "Latency Issue",
      "Switch Ring Configuration",
      "Switch Testing",
      "POE Port Issue",
      "POE & Fiber Switch",
      "Others",],
  },
  "Grandstream UC": {
    "_common": ["AP Configuration",
      "AP Performance Issue",
      "Router Configuration & Troubleshoot",
      "Firewall Config & Troubleshoot",
      "POE & Non_POE Switch (L2/L3)",
      "Fiber Switch (L2/L3)",
      "Unmanaged Switch",
      "GDMS Cloud Config & Troubleshoot",
      "GDMS Controller",
      "Others",],
  },
  "Grandstream Networking": {
    "_common": ["AP Configuration",
      "AP Performance Issue",
      "Router Configuration & Troubleshoot",
      "Firewall Config & Troubleshoot",
      "POE & Non_POE Switch (L2/L3)",
      "Fiber Switch (L2/L3)",
      "Unmanaged Switch",
      "GDMS Cloud Config & Troubleshoot",
      "GDMS Controller",
      "Others",],
  },
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
  "Passive Products": {
    "_common": ["Splitter Losses",
      "Patch Cords Losses (IL/RL)",
      "Packaging",
      "Patch Cords & PLC Length",
      "Branding & Non Branding Product",
      "Product Condition",
      "DOA (Dead on arrival)",
      "Warranty",
      "Received other product",
      "Others",],
  },
  "CCTV": {
    "_common": ["Other"],
  },
  "EMS/NMS": {
    "_common": ["Other"],
  },
  "Firewall/SDWAN": {
    "_common": ["Other"],
  },
  "Anroid Box": {
    "_common": ["Other"],
  },
};

export function getRmaIssues(category, subCategory) {
  if (!category) return [];
  const catData = RMA_ISSUE_LIST[category];
  if (!catData) return ["Damaged Product","Hardware Fault","Physical Damage","Water Damage","Burnt Component","Manufacturing Defect","Other"];
  const common = catData["_common"] || [];
  const subIssues = subCategory && catData[subCategory] ? catData[subCategory] : [];
  const merged = [...common, ...subIssues];
  return [...new Set(merged)];
}