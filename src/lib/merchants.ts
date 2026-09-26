export interface MerchantHint {
  pattern: RegExp;
  merchant: string;
  category: string;
  type: "Personal" | "Business";
}

export const MERCHANT_HINTS: MerchantHint[] = [
  { pattern: /winco|vinco|world foods/i, merchant: "WinCo", category: "Food & Groceries", type: "Personal" },
  { pattern: /7[-\s]?eleven|7 eleven/i, merchant: "7-Eleven", category: "Cigarettes", type: "Personal" },
  { pattern: /\bgas\b|arco|shell|chevron|love'?s/i, merchant: "Заправка", category: "Transportation", type: "Personal" },
  { pattern: /parking/i, merchant: "Parking", category: "Transportation", type: "Personal" },
  { pattern: /kfc|mcdonald|burger|carls|pizza|starbucks|uber eats|food cart|restaurant|restourant|buffet/i, merchant: "Кафе", category: "Food outside", type: "Personal" },
  { pattern: /avem/i, merchant: "Avem", category: "Materials", type: "Business" },
  { pattern: /houzz/i, merchant: "HouzzPro", category: "Marketing & Subscription", type: "Business" },
  { pattern: /hiscox|simply\s?busen|simplebusiness/i, merchant: "Бизнес-страховка", category: "Insurance & Licenses", type: "Business" },
  { pattern: /xfinity|verizon|internet|mobile|icloud|apple music|google/i, merchant: "Связь", category: "Utilities & Bills", type: "Personal" },
  { pattern: /geico|progressive|moda/i, merchant: "Страховка", category: "Health & Insurance", type: "Personal" },
  { pattern: /gym|cascade/i, merchant: "Cascade Gym", category: "Utilities & Bills", type: "Personal" },
  { pattern: /uber(?!\s*eats)/i, merchant: "Uber", category: "Transportation", type: "Personal" },
  { pattern: /amazon/i, merchant: "Amazon", category: "Supplies", type: "Business" },
  { pattern: /kikoff/i, merchant: "Kikoff", category: "Utilities & Bills", type: "Personal" },
  { pattern: /mission lane/i, merchant: "Mission Lane", category: "Loan", type: "Business" },
  { pattern: /overdraft|bank fee|bofa|chase/i, merchant: "Банк", category: "Utilities & Bills", type: "Personal" },
  { pattern: /litter|pet|dry food/i, merchant: "Питомцы", category: "Pets", type: "Personal" },
  { pattern: /beer|corona|alcohol|wine/i, merchant: "Алкоголь", category: "Alcohol", type: "Personal" },
  { pattern: /club|party|apple games/i, merchant: "Развлечения", category: "Entertainment", type: "Personal" },
  { pattern: /rent/i, merchant: "Аренда", category: "Rent", type: "Personal" },
  { pattern: /power|pacific/i, merchant: "Pacific Power", category: "Utilities & Bills", type: "Personal" },
  { pattern: /square/i, merchant: "Square", category: "Transaction Fee", type: "Business" },
];

export function guessFromText(text: string) {
  for (const hint of MERCHANT_HINTS) {
    if (hint.pattern.test(text)) {
      return {
        merchant: hint.merchant,
        category: hint.category,
        type: hint.type,
      };
    }
  }
  return null;
}
