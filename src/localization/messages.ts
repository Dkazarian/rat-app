export const locales = ["en", "es"] as const;

export type Locale = (typeof locales)[number];

export type MessageDictionary = {
  appName: string;
  appLabel: string;
  tagline: string;
  languageLabel: string;
  english: string;
  spanish: string;
  inputLabel: string;
  sampleInput: string;
  inputPlaceholder: string;
  sortAction: string;
  categories: string;
  newCategory: string;
  food: string;
  transport: string;
  home: string;
  fun: string;
  total: string;
  spending: string;
  thisMonth: string;
  recentExpenses: string;
  today: string;
  lunch: string;
  coffee: string;
  taxi: string;
  chartLabel: string;
  poweredBy: string;
  viewSource: string;
  viewSourceAria: string;
  emptyTitle: string;
  emptyDetail: string;
  emptyMascotAlt: string;
  loadingTitle: string;
  loadingDetail: string;
  loadingMascotAlt: string;
  successTitle: string;
  successDetail: string;
  successMascotAlt: string;
  extractionFailureTitle: string;
  extractionFailureDetail: string;
  extractionFailureMascotAlt: string;
  providerErrorTitle: string;
  providerErrorDetail: string;
  providerErrorMascotAlt: string;
  scaffoldEyebrow: string;
  scaffoldTitle: string;
  scaffoldDescription: string;
  switchLanguage: string;
};

export type MessageKey = keyof MessageDictionary;

export const messages = {
  en: {
    appName: "RatApp",
    appLabel: "Ratapp expense dashboard",
    tagline: "Say it. Sort it. See it.",
    languageLabel: "Language",
    english: "English",
    spanish: "Español",
    inputLabel: "What did you spend?",
    sampleInput: "Lunch $18, coffee $4.50 and taxi $12",
    inputPlaceholder: "Lunch $18, coffee $4.50 and taxi $12",
    sortAction: "Sort it",
    categories: "Categories",
    newCategory: "New",
    food: "Food",
    transport: "Transport",
    home: "Home",
    fun: "Fun",
    total: "total",
    spending: "Spending",
    thisMonth: "This month",
    recentExpenses: "Recent expenses",
    today: "Today",
    lunch: "Lunch",
    coffee: "Coffee",
    taxi: "Taxi",
    chartLabel: "Spending: Food 40%, Transport 26%, Home 20%, Fun 14%",
    poweredBy: "Powered by",
    viewSource: "View source on GitHub",
    viewSourceAria: "Open the Ratapp GitHub repository in a new tab",
    emptyTitle: "Ready",
    emptyDetail: "Tell me what you spent.",
    emptyMascotAlt: "Rat mascot ready to sort expenses",
    loadingTitle: "Sorting…",
    loadingDetail: "Looking for the right buckets.",
    loadingMascotAlt: "Rat mascot sniffing for the right categories",
    successTitle: "Done",
    successDetail: "3 expenses sorted.",
    successMascotAlt: "Happy rat mascot",
    extractionFailureTitle: "I didn't understand :(",
    extractionFailureDetail: "Try including what you bought and the amount.",
    extractionFailureMascotAlt: "Confused rat mascot",
    providerErrorTitle: "Something went wrong",
    providerErrorDetail: "Try again in a moment.",
    providerErrorMascotAlt: "Worried rat mascot",
    scaffoldEyebrow: "Foundation ready",
    scaffoldTitle: "Ratapp is ready for its interface.",
    scaffoldDescription:
      "The component foundation is ready for the approved mockup.",
    switchLanguage: "Switch to Spanish",
  },
  es: {
    appName: "RatApp",
    appLabel: "Panel de gastos de Ratapp",
    tagline: "Decilo. Ordenalo. Miralo.",
    languageLabel: "Idioma",
    english: "English",
    spanish: "Español",
    inputLabel: "¿En qué gastaste?",
    sampleInput: "Almuerzo $18, café $4,50 y taxi $12",
    inputPlaceholder: "Almuerzo $18, café $4,50 y taxi $12",
    sortAction: "Ordenar",
    categories: "Categorías",
    newCategory: "Nueva",
    food: "Comida",
    transport: "Transporte",
    home: "Casa",
    fun: "Diversión",
    total: "total",
    spending: "Gastos",
    thisMonth: "Este mes",
    recentExpenses: "Gastos recientes",
    today: "Hoy",
    lunch: "Almuerzo",
    coffee: "Café",
    taxi: "Taxi",
    chartLabel: "Gastos: Comida 40%, Transporte 26%, Casa 20%, Diversión 14%",
    poweredBy: "Impulsado por",
    viewSource: "Ver código en GitHub",
    viewSourceAria:
      "Abrir el repositorio de Ratapp en GitHub en una pestaña nueva",
    emptyTitle: "Listo",
    emptyDetail: "Contame en qué gastaste.",
    emptyMascotAlt: "Mascota rata lista para ordenar gastos",
    loadingTitle: "Ordenando…",
    loadingDetail: "Buscando las categorías correctas.",
    loadingMascotAlt: "Mascota rata olfateando las categorías correctas",
    successTitle: "Listo",
    successDetail: "3 gastos ordenados.",
    successMascotAlt: "Mascota rata feliz",
    extractionFailureTitle: "No entendí :(",
    extractionFailureDetail: "Probá incluyendo qué compraste y el monto.",
    extractionFailureMascotAlt: "Mascota rata confundida",
    providerErrorTitle: "Algo salió mal",
    providerErrorDetail: "Probá de nuevo en un momento.",
    providerErrorMascotAlt: "Mascota rata preocupada",
    scaffoldEyebrow: "Base lista",
    scaffoldTitle: "Ratapp está listo para su interfaz.",
    scaffoldDescription:
      "La base de componentes está lista para la maqueta aprobada.",
    switchLanguage: "Cambiar a inglés",
  },
} as const satisfies Record<Locale, MessageDictionary>;
