import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en.json";
import hi from "./hi.json";
import kn from "./kn.json";
import ta from "./ta.json";
import te from "./te.json";

const initialLanguage = typeof window !== "undefined" ? localStorage.getItem("language") || "en" : "en";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    kn: { translation: kn },
    ta: { translation: ta },
    te: { translation: te },
  },
  lng: initialLanguage,
  fallbackLng: "en",
  supportedLngs: ["en", "hi", "kn", "ta", "te"],
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;