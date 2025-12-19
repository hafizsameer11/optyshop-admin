import React, { createContext, useContext, useState, useEffect } from 'react';

const I18nContext = createContext();

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

const translations = {
  en: {
    // Common
    language: 'Language',
    search: 'Search',
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    actions: 'Actions',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    loading: 'Loading...',
    noData: 'No data found',
    // Pages
    users: 'Users',
    products: 'Products',
    orders: 'Orders',
    categories: 'Categories',
    // Forms
    contactRequests: 'Contact Requests',
    demoRequests: 'Demo Requests',
    pricingRequests: 'Pricing Requests',
    jobApplications: 'Job Applications',
    credentialsRequests: 'Credentials Requests',
    supportRequests: 'Support Requests',
  },
  ar: {
    // Common
    language: 'اللغة',
    search: 'بحث',
    add: 'إضافة',
    edit: 'تعديل',
    delete: 'حذف',
    save: 'حفظ',
    cancel: 'إلغاء',
    close: 'إغلاق',
    actions: 'الإجراءات',
    status: 'الحالة',
    active: 'نشط',
    inactive: 'غير نشط',
    loading: 'جاري التحميل...',
    noData: 'لا توجد بيانات',
    // Pages
    users: 'المستخدمون',
    products: 'المنتجات',
    orders: 'الطلبات',
    categories: 'الفئات',
    // Forms
    contactRequests: 'طلبات الاتصال',
    demoRequests: 'طلبات العرض التوضيحي',
    pricingRequests: 'طلبات التسعير',
    jobApplications: 'طلبات التوظيف',
    credentialsRequests: 'طلبات الاعتماد',
    supportRequests: 'طلبات الدعم',
  },
  fr: {
    // Common
    language: 'Langue',
    search: 'Rechercher',
    add: 'Ajouter',
    edit: 'Modifier',
    delete: 'Supprimer',
    save: 'Enregistrer',
    cancel: 'Annuler',
    close: 'Fermer',
    actions: 'Actions',
    status: 'Statut',
    active: 'Actif',
    inactive: 'Inactif',
    loading: 'Chargement...',
    noData: 'Aucune donnée trouvée',
    // Pages
    users: 'Utilisateurs',
    products: 'Produits',
    orders: 'Commandes',
    categories: 'Catégories',
    // Forms
    contactRequests: 'Demandes de contact',
    demoRequests: 'Demandes de démo',
    pricingRequests: 'Demandes de prix',
    jobApplications: 'Candidatures',
    credentialsRequests: 'Demandes d\'identifiants',
    supportRequests: 'Demandes de support',
  },
};

export const I18nProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('language') || 'en';
    }
    return 'en';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', language);
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
  };

  const value = {
    language,
    changeLanguage,
    t,
    translations: translations[language] || translations.en,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

