// productionIssueList.js — Issue list for Production tickets ONLY
// Same structure as issueList.js — edit the arrays below later with real Production-specific wording

export const PRODUCTION_ISSUE_LIST = {
  "OLT": { "_common": ["Others"] },
  "ONT": { "_common": ["Others"] },
  "Wireless Access Point": { "_common": ["Others"] },
  "Media Converter": { "_common": ["Others"] },
  "Optical Transceivers": { "_common": ["Others"] },
  "Networking Switch": { "_common": ["Others"] },
  "Grandstream UC": { "_common": ["Others"] },
  "Grandstream Networking": { "_common": ["Others"] },
  "Entrance Product": { "_common": ["Others"] },
  "Passive Products": { "_common": ["Others"] },
  "CCTV": { "_common": ["Others"] },
  "EMS/NMS": { "_common": ["Others"] },
  "Firewall/SDWAN": { "_common": ["Others"] },
  "Anroid Box": { "_common": ["Others"] },
};

export function getProductionIssues(category, subCategory) {
  if (!category) return [];
  const catData = PRODUCTION_ISSUE_LIST[category];
  if (!catData) return ["Others"];
  const common = catData["_common"] || [];
  const subIssues = subCategory && catData[subCategory] ? catData[subCategory] : [];
  const merged = [...common, ...subIssues];
  return [...new Set(merged)];
}