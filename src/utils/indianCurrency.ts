/**
 * Indian Currency & GST Utility
 * Formats numbers into Indian Lakhs/Crores notation and English words.
 */

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertBelowThousand(n: number): string {
  let str = '';
  if (n >= 100) {
    str += ONES[Math.floor(n / 100)] + ' Hundred ';
    n %= 100;
  }
  if (n >= 20) {
    str += TENS[Math.floor(n / 10)] + ' ';
    n %= 10;
  }
  if (n > 0) {
    str += ONES[n] + ' ';
  }
  return str.trim();
}

/**
 * Converts a numeric amount to Indian Currency Words.
 * e.g. 118000 -> "Rupees One Lakh Eighteen Thousand Only"
 */
export function numberToIndianWords(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rupees Zero Only';
  
  const rounded = Math.round((Math.abs(amount) + Number.EPSILON) * 100) / 100;
  const wholePart = Math.floor(rounded);
  const paisePart = Math.round((rounded - wholePart) * 100);

  if (wholePart === 0 && paisePart === 0) {
    return 'Rupees Zero Only';
  }

  let words = '';

  const crores = Math.floor(wholePart / 10000000);
  let remainder = wholePart % 10000000;

  const lakhs = Math.floor(remainder / 100000);
  remainder = remainder % 100000;

  const thousands = Math.floor(remainder / 1000);
  remainder = remainder % 1000;

  const hundreds = remainder;

  if (crores > 0) {
    words += convertBelowThousand(crores) + ' Crore ';
  }
  if (lakhs > 0) {
    words += convertBelowThousand(lakhs) + ' Lakh ';
  }
  if (thousands > 0) {
    words += convertBelowThousand(thousands) + ' Thousand ';
  }
  if (hundreds > 0) {
    words += convertBelowThousand(hundreds) + ' ';
  }

  words = words.trim();
  let result = words ? `Rupees ${words}` : '';

  if (paisePart > 0) {
    const paiseWords = convertBelowThousand(paisePart);
    if (result) {
      result += ` and ${paiseWords} Paise`;
    } else {
      result = `${paiseWords} Paise`;
    }
  }

  return (result + ' Only').replace(/\s+/g, ' ');
}

/**
 * Formats a number to Indian currency format with ₹ sign.
 * e.g. 118000 -> "₹1,18,000.00"
 */
export function formatIndianCurrency(amount: number, showDecimals = true): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0.00';
  const val = Number(amount);
  return '₹' + val.toLocaleString('en-IN', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0
  });
}

/**
 * Evaluates whether transaction is Intra-State or Inter-State based on GSTIN or State.
 */
export function isIntraStateGst(supplierStateOrGstin?: string, placeOfSupplyOrGstin?: string): boolean {
  if (!supplierStateOrGstin || !placeOfSupplyOrGstin) return true; // Default to Intra-State (CGST + SGST)
  
  const extractCode = (str: string): string => {
    const trimmed = str.trim();
    // If it starts with 2 digits (e.g. 27AAACA1234), return the 2 digits
    if (/^\d{2}/.test(trimmed)) {
      return trimmed.substring(0, 2);
    }
    // Else check common state names
    const s = trimmed.toLowerCase();
    if (s.includes('maharashtra') || s.includes('pune') || s.includes('mumbai')) return '27';
    if (s.includes('karnataka') || s.includes('bangalore')) return '29';
    if (s.includes('gujarat') || s.includes('ahmedabad')) return '24';
    if (s.includes('tamil nadu') || s.includes('chennai')) return '33';
    if (s.includes('haryana') || s.includes('gurgaon')) return '06';
    if (s.includes('delhi')) return '07';
    if (s.includes('uttar pradesh') || s.includes('noida')) return '09';
    if (s.includes('telangana') || s.includes('hyderabad')) return '36';
    return s;
  };

  const code1 = extractCode(supplierStateOrGstin);
  const code2 = extractCode(placeOfSupplyOrGstin);

  return code1 === code2;
}
