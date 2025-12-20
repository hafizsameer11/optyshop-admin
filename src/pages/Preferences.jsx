import React, { useState, useEffect } from 'react';
import { FiSettings, FiMoon, FiSun, FiBell, FiMail } from 'react-icons/fi';
import { useI18n } from '../context/I18nContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import toast from 'react-hot-toast';

const Preferences = () => {
  const { t, language, changeLanguage } = useI18n();
  const [preferences, setPreferences] = useState({
    theme: localStorage.getItem('theme') || 'light',
    notifications: {
      email: localStorage.getItem('notifications_email') !== 'false',
      push: localStorage.getItem('notifications_push') !== 'false',
    },
    language: language,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load saved preferences
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedEmailNotifications = localStorage.getItem('notifications_email') !== 'false';
    const savedPushNotifications = localStorage.getItem('notifications_push') !== 'false';
    
    setPreferences({
      theme: savedTheme,
      notifications: {
        email: savedEmailNotifications,
        push: savedPushNotifications,
      },
      language: language,
    });
  }, [language]);

  const handleThemeChange = (theme) => {
    setPreferences({ ...preferences, theme });
    localStorage.setItem('theme', theme);
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    toast.success(`Theme changed to ${theme}`);
  };

  const handleNotificationChange = (type, value) => {
    const updatedPreferences = {
      ...preferences,
      notifications: {
        ...preferences.notifications,
        [type]: value,
      },
    };
    setPreferences(updatedPreferences);
    localStorage.setItem(`notifications_${type}`, value.toString());
    toast.success(`${type === 'email' ? 'Email' : 'Push'} notifications ${value ? 'enabled' : 'disabled'}`);
  };

  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
    setPreferences({ ...preferences, language: lang });
    toast.success('Language preference saved');
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('preferences') || 'Preferences'}</h1>
          <p className="text-sm text-gray-500 mt-1">Customize your application settings</p>
        </div>
        <LanguageSwitcher variant="compact" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Theme Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FiSun className="w-5 h-5" />
              {t('theme') || 'Theme'}
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiSun className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{t('lightMode') || 'Light Mode'}</p>
                  <p className="text-xs text-gray-500">Use light theme</p>
                </div>
              </div>
              <button
                onClick={() => handleThemeChange('light')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.theme === 'light' ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.theme === 'light' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiMoon className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{t('darkMode') || 'Dark Mode'}</p>
                  <p className="text-xs text-gray-500">Use dark theme</p>
                </div>
              </div>
              <button
                onClick={() => handleThemeChange('dark')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Language Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FiSettings className="w-5 h-5" />
              {t('language')}
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full px-4 py-3 text-left rounded-lg border transition-colors flex items-center gap-3 ${
                    preferences.language === lang.code
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className="flex-1">{lang.name}</span>
                  {preferences.language === lang.code && (
                    <span className="text-indigo-600">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FiBell className="w-5 h-5" />
              {t('notifications') || 'Notifications'}
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiMail className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{t('emailNotifications') || 'Email Notifications'}</p>
                  <p className="text-xs text-gray-500">Receive notifications via email</p>
                </div>
              </div>
              <button
                onClick={() => handleNotificationChange('email', !preferences.notifications.email)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.notifications.email ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.notifications.email ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiBell className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{t('pushNotifications') || 'Push Notifications'}</p>
                  <p className="text-xs text-gray-500">Receive browser push notifications</p>
                </div>
              </div>
              <button
                onClick={() => handleNotificationChange('push', !preferences.notifications.push)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.notifications.push ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.notifications.push ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preferences;

