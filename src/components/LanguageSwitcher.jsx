import React, { useState } from 'react';
import { FiGlobe, FiChevronDown } from 'react-icons/fi';
import { useI18n } from '../context/I18nContext';

const LanguageSwitcher = ({ variant = 'default', onGradient = false }) => {
  const { language, changeLanguage } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ];

  const currentLanguage = languages.find((lang) => lang.code === language) || languages[0];

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
    setIsOpen(false);
  };

  // Compact variant for tables and forms
  if (variant === 'compact') {
    const buttonClasses = onGradient
      ? "flex items-center gap-2 px-3 py-1.5 text-sm bg-white/25 hover:bg-white/40 text-white rounded-lg transition-colors backdrop-blur-sm border border-white/30 shadow-sm"
      : "flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors";
    
    const iconClasses = onGradient ? "text-white" : "";
    
    return (
      <div className="relative inline-block">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={buttonClasses}
          title="Change language"
        >
          <span className="text-base">{currentLanguage.flag}</span>
          <span className={`hidden sm:inline font-medium ${onGradient ? 'text-white' : ''}`}>{currentLanguage.code.toUpperCase()}</span>
          <FiChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''} ${iconClasses}`} />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            ></div>
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
                    language === lang.code
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.name}</span>
                  {language === lang.code && (
                    <span className="ml-auto text-indigo-600 dark:text-indigo-400">✓</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Default variant for header
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Change language"
      >
        <FiGlobe className="w-5 h-5" />
        <span className="hidden md:inline text-sm font-medium">{currentLanguage.code.toUpperCase()}</span>
        <FiChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Select Language
            </div>
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
                  language === lang.code
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span>{lang.name}</span>
                {language === lang.code && (
                  <span className="ml-auto text-indigo-600 dark:text-indigo-400">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;

