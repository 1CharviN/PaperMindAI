import { createContext, useContext, useEffect } from "react";
import i18n from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";

const translations = {
  en: {
    translation: {
      // Navigation
      dashboard: "Dashboard",
      upload: "Upload",
      history: "History",
      settings: "Settings",
      
      // Upload Page
      uploadTitle: "Upload Research Paper",
      uploadSubtitle: "Drag and drop your PDF file or click to browse",
      supportedFormats: "Supported formats: PDF",
      maxFileSize: "Maximum file size: 10MB",
      uploadButton: "Upload Document",
      processing: "Processing...",
      
      // Dashboard
      welcomeBack: "Welcome Back",
      totalDocuments: "Total Documents",
      processedToday: "Processed Today",
      avgPlagiarismScore: "Avg Plagiarism Score",
      processingTime: "Avg Processing Time",
      recentDocuments: "Recent Documents",
      viewAll: "View All",
      
      // Analysis
      summary: "Summary",
      citations: "Citations",
      paraphrase: "Paraphrase",
      plagiarism: "Plagiarism Detection",
      generateAudio: "Generate Audio",
      downloadReport: "Download Report",
      exportData: "Export Data",
      
      // Common
      cancel: "Cancel",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      close: "Close",
      loading: "Loading...",
      error: "Error",
      success: "Success",
    }
  },
  es: {
    translation: {
      dashboard: "Panel",
      upload: "Subir",
      history: "Historial",
      settings: "Configuración",
      uploadTitle: "Subir Artículo de Investigación",
      uploadSubtitle: "Arrastra y suelta tu archivo PDF o haz clic para buscar",
      supportedFormats: "Formatos admitidos: PDF",
      maxFileSize: "Tamaño máximo de archivo: 10MB",
      summary: "Resumen",
      citations: "Citas",
      paraphrase: "Paráfrasis",
      plagiarism: "Detección de Plagio",
    }
  },
  fr: {
    translation: {
      dashboard: "Tableau de Bord",
      upload: "Télécharger",
      history: "Historique",
      settings: "Paramètres",
      uploadTitle: "Télécharger un Article de Recherche",
      uploadSubtitle: "Glissez-déposez votre fichier PDF ou cliquez pour parcourir",
      supportedFormats: "Formats pris en charge : PDF",
      maxFileSize: "Taille maximale du fichier : 10 Mo",
      summary: "Résumé",
      citations: "Citations",
      paraphrase: "Paraphrase",
      plagiarism: "Détection de Plagiat",
    }
  },
  de: {
    translation: {
      dashboard: "Dashboard",
      upload: "Hochladen",
      history: "Verlauf",
      settings: "Einstellungen",
      uploadTitle: "Forschungsarbeit Hochladen",
      uploadSubtitle: "PDF-Datei per Drag & Drop oder durch Klicken durchsuchen",
      supportedFormats: "Unterstützte Formate: PDF",
      maxFileSize: "Maximale Dateigröße: 10MB",
      summary: "Zusammenfassung",
      citations: "Zitate",
      paraphrase: "Paraphrase",
      plagiarism: "Plagiatserkennung",
    }
  },
  zh: {
    translation: {
      dashboard: "仪表板",
      upload: "上传",
      history: "历史",
      settings: "设置",
      uploadTitle: "上传研究论文",
      uploadSubtitle: "拖放PDF文件或点击浏览",
      supportedFormats: "支持的格式：PDF",
      maxFileSize: "最大文件大小：10MB",
      summary: "摘要",
      citations: "引用",
      paraphrase: "释义",
      plagiarism: "抄袭检测",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources: translations,
    lng: localStorage.getItem("language") || "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

interface LanguageContextType {
  language: string;
  changeLanguage: (lang: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("language", lang);
  };

  return (
    <LanguageContext.Provider value={{ language: i18n.language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
