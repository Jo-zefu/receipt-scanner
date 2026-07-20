import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import zh from './locales/zh.json';

// 检测用户语言：1. localStorage 手动选择  2. 浏览器语言  3. 默认英文
function detectLanguage(): string {
  const saved = localStorage.getItem('language');
  if (saved) return saved;

  // 读取浏览器首选语言列表
  const browserLangs = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];

  for (const lang of browserLangs) {
    const code = lang.toLowerCase();
    if (code.startsWith('zh')) return 'zh';
    if (code.startsWith('en')) return 'en';
  }

  return 'en';
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
    },
    lng: detectLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
