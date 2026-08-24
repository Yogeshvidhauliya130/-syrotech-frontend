// rmaIssueList.js — Issue list for RMA tickets ONLY
// Same structure as issueList.js — edit the arrays below later with real RMA-specific wording

export const RMA_ISSUE_LIST = {
  "OLT": {
    "_common": [
      "Damaged Product",
      "Hardware Fault",
      "Physical Damage",
      "Water Damage",
      "Burnt Component",
      "Manufacturing Defect",
      "Other",
    ],
  },
  "ONT": {
    "_common": [
      "Damaged Product",
      "Hardware Fault",
      "Physical Damage",
      "Water Damage",
      "Burnt Component",
      "Manufacturing Defect",
      "Other",
    ],
  },
  "Wireless Access Point": {
    "_common": ["Damaged Product","Hardware Fault","Physical Damage","Water Damage","Burnt Component","Manufacturing Defect","Other"],
  },
  "Media Converter": {
    "_common": ["Damaged Product","Hardware Fault","Physical Damage","Water Damage","Burnt Component","Manufacturing Defect","Other"],
  },
  "Optical Transceivers": {
    "_common": ["Damaged Product","Hardware Fault","Physical Damage","Water Damage","Burnt Component","Manufacturing Defect","Other"],
  },
  "Networking Switch": {
    "_common": ["Damaged Product","Hardware Fault","Physical Damage","Water Damage","Burnt Component","Manufacturing Defect","Other"],
  },
  "Grandstream UC": {
    "_common": ["Damaged Product","Hardware Fault","Physical Damage","Water Damage","Burnt Component","Manufacturing Defect","Other"],
  },
  "Grandstream Networking": {
    "_common": ["Damaged Product","Hardware Fault","Physical Damage","Water Damage","Burnt Component","Manufacturing Defect","Other"],
  },
  "Entrance Product": {
    "_common": ["Damaged Product","Hardware Fault","Physical Damage","Water Damage","Burnt Component","Manufacturing Defect","Other"],
  },
  "Passive Products": {
    "_common": ["Damaged Product","Hardware Fault","Physical Damage","Water Damage","Burnt Component","Manufacturing Defect","Other"],
  },
  "CCTV": {
    "_common": ["Damaged Product","Hardware Fault","Physical Damage","Water Damage","Burnt Component","Manufacturing Defect","Other"],
  },
  "EMS/NMS": {
    "_common": ["Damaged Product","Hardware Fault","Physical Damage","Water Damage","Burnt Component","Manufacturing Defect","Other"],
  },
  "Firewall/SDWAN": {
    "_common": ["Damaged Product","Hardware Fault","Physical Damage","Water Damage","Burnt Component","Manufacturing Defect","Other"],
  },
  "Anroid Box": {
    "_common": ["Damaged Product","Hardware Fault","Physical Damage","Water Damage","Burnt Component","Manufacturing Defect","Other"],
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