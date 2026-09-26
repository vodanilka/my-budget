export const CATEGORY_RU: Record<string, string> = {
  Alcohol: "Алкоголь",
  Cigarettes: "Сигареты",
  "Clothing & Care": "Одежда и уход",
  Entertainment: "Развлечения",
  "Food & Groceries": "Продукты",
  "Food outside": "Еда вне дома",
  "Health & Insurance": "Здоровье и страховка",
  Pets: "Питомцы",
  Rent: "Аренда",
  Transportation: "Транспорт",
  Travel: "Поездки",
  "Utilities & Bills": "Коммуналка и счета",
  "Accounting & Taxes": "Бухгалтерия и налоги",
  "Insurance & Licenses": "Страховка и лицензии",
  "Labor & Subcontractors": "Рабочие и субподряд",
  Loan: "Кредит",
  "Marketing & Subscription": "Маркетинг и подписки",
  Materials: "Материалы",
  Supplies: "Расходники",
  "Transaction Fee": "Комиссия",
};

export const TYPE_RU: Record<string, string> = {
  Personal: "Личные",
  Business: "Бизнес",
};

export const PERSON_RU: Record<string, string> = {
  Danil: "Данил",
  Vlad: "Влад",
  SNAP: "SNAP",
  Both: "Оба",
};

export const CARD_RU: Record<string, string> = {
  Square: "Square",
  "BoFa business": "BoFa бизнес",
  "Personal BoFa": "BoFa личная",
  Kikoff: "Kikoff",
  Ollo: "Ollo",
  "Mission lane": "Mission Lane",
  Cash: "Наличные",
};

export const MONTHS_RU = [
  "январь",
  "февраль",
  "март",
  "апрель",
  "май",
  "июнь",
  "июль",
  "август",
  "сентябрь",
  "октябрь",
  "ноябрь",
  "декабрь",
];

export function categoryLabel(name: string) {
  return CATEGORY_RU[name] ?? name;
}

export function typeLabel(name: string) {
  return TYPE_RU[name] ?? name;
}

export function personLabel(name: string) {
  return PERSON_RU[name] ?? name;
}

export function cardLabel(name: string | null | undefined) {
  if (!name) return "Без карты";
  return CARD_RU[name] ?? name;
}

export function monthTitle(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  const name = MONTHS_RU[m - 1];
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${y}`;
}

export function sheetNames() {
  return [
    "Form",
    "Reports",
    "Analitics",
    "Expenses",
    "Lists",
    "Salary",
    "MyBudget",
    "Subscription&bills",
    "Danil Credit Card",
    "Transaction fee",
    "Filter by description",
  ];
}
