import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/locales/en/translation.json";
import fr from "@/locales/fr/translation.json";
import ar from "@/locales/ar/translation.json";
import es from "@/locales/es/translation.json";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    ar: { translation: ar },
    es: { translation: es }
  },
  supportedLngs: ["en", "fr", "ar", "es"],
  lng: "en",
  fallbackLng: "en",
  showSupportNotice: false,
  interpolation: {
    escapeValue: false
  }
});

export default i18n;
