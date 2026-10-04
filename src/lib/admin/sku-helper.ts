/**
 * Helpers for auto-generating and sequentially incrementing SKUs by collection / subcollection.
 */

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Generates sensible default initials from a category name.
 * e.g. "3D Bed Sheets" -> "3DS"
 * e.g. "Double Bed-sheets" -> "DBS"
 * e.g. "Single Bed-sheets" -> "SBS"
 * e.g. "Chiffon Hijabs" -> "CHJ"
 * e.g. "3-Piece" -> "3PC"
 */
export function generateDefaultInitials(categoryName: string): string {
  if (!categoryName) return "AYR";

  const trimmed = categoryName.trim();

  // Special common shortcuts
  if (/3d/i.test(trimmed) && /bed/i.test(trimmed)) return "3DS";
  if (/single/i.test(trimmed) && /bed/i.test(trimmed)) return "SBS";
  if (/double/i.test(trimmed) && /bed/i.test(trimmed)) return "DBS";
  if (/king/i.test(trimmed) && /bed/i.test(trimmed)) return "KBS";
  if (/fitted/i.test(trimmed)) return "FBS";
  if (/duvet/i.test(trimmed)) return "DVT";
  if (/quilt/i.test(trimmed)) return "QLT";
  if (/3-?piece/i.test(trimmed)) return "3PC";
  if (/2-?piece/i.test(trimmed)) return "2PC";
  if (/chiffon/i.test(trimmed)) return "CHJ";

  // General word-acronym extraction
  const words = trimmed
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length >= 2) {
    const letters = words.map((w) => w[0].toUpperCase()).join("");
    return letters.slice(0, 4);
  }

  return trimmed.slice(0, 3).toUpperCase();
}

/**
 * Scans existing SKUs in a collection and identifies the most prominent prefix
 * along with the highest sequence number used.
 */
export function detectPrefixFromSkus(
  existingSkus: string[]
): { prefix: string; maxNum: number; padding: number } | null {
  const prefixMap: Record<string, { count: number; maxNum: number; padding: number }> = {};

  for (const rawSku of existingSkus) {
    if (!rawSku) continue;
    const trimmed = rawSku.trim();

    // Match patterns like "3DS-05", "3DS-5", "AYR-BED-01", "SBS_02"
    const match = trimmed.match(/^([A-Za-z0-9_-]+?)[-_ ](\d+)$/);
    if (match) {
      const prefix = match[1].toUpperCase();
      const numStr = match[2];
      const num = parseInt(numStr, 10);
      const pad = numStr.length;

      if (!prefixMap[prefix]) {
        prefixMap[prefix] = { count: 0, maxNum: 0, padding: 2 };
      }
      prefixMap[prefix].count += 1;
      if (num > prefixMap[prefix].maxNum) {
        prefixMap[prefix].maxNum = num;
        prefixMap[prefix].padding = Math.max(prefixMap[prefix].padding, pad);
      }
    }
  }

  let bestPrefix: string | null = null;
  let highestCount = -1;

  for (const [pref, data] of Object.entries(prefixMap)) {
    if (data.count > highestCount) {
      highestCount = data.count;
      bestPrefix = pref;
    }
  }

  if (bestPrefix) {
    return {
      prefix: bestPrefix,
      maxNum: prefixMap[bestPrefix].maxNum,
      padding: prefixMap[bestPrefix].padding,
    };
  }

  return null;
}

/**
 * Given a prefix and existing SKUs, calculates the next available sequence number.
 * e.g. prefix "3DS" with existing [3DS-01, 3DS-04] and startNum 1 -> "3DS-05"
 * e.g. prefix "3DS" with no existing and startNum 5 -> "3DS-05"
 */
export function calculateNextSku(
  existingSkus: string[],
  prefix: string,
  startNum: number = 1
): string {
  const cleanPrefix = prefix.replace(/[-_ ]+$/, "").toUpperCase().trim();
  if (!cleanPrefix) return "";

  const regex = new RegExp(`^${escapeRegex(cleanPrefix)}[-_ ]?(\\d+)$`, "i");

  let maxNum = 0;
  let minPadding = 2;

  for (const rawSku of existingSkus) {
    if (!rawSku) continue;
    const match = rawSku.trim().match(regex);
    if (match) {
      const numStr = match[1];
      const num = parseInt(numStr, 10);
      if (!isNaN(num)) {
        if (num > maxNum) {
          maxNum = num;
          minPadding = Math.max(minPadding, numStr.length);
        }
      }
    }
  }

  const nextNum = maxNum >= startNum ? maxNum + 1 : startNum;
  return `${cleanPrefix}-${String(nextNum).padStart(minPadding, "0")}`;
}
