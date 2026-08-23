export const locales = ["en", "es"] as const;

export type Locale = (typeof locales)[number];

export type MessageDictionary = {
  appName: string;
  scaffoldEyebrow: string;
  scaffoldTitle: string;
  scaffoldDescription: string;
  switchLanguage: string;
};

export type MessageKey = keyof MessageDictionary;

export const messages = {
  en: {
    appName: "Ratapp",
    scaffoldEyebrow: "Foundation ready",
    scaffoldTitle: "Ratapp is ready for its interface.",
    scaffoldDescription:
      "The component foundation is ready for the approved mockup.",
    switchLanguage: "Switch to Spanish",
  },
  es: {
    appName: "Ratapp",
    scaffoldEyebrow: "Base lista",
    scaffoldTitle: "Ratapp está listo para su interfaz.",
    scaffoldDescription:
      "La base de componentes está lista para la maqueta aprobada.",
    switchLanguage: "Cambiar a inglés",
  },
} as const satisfies Record<Locale, MessageDictionary>;
