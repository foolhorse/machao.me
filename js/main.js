(function () {
  'use strict';

  var root = document.documentElement;
  var button = document.querySelector('.theme-toggle');
  var languageButton = document.querySelector('.language-toggle');
  var system = window.matchMedia('(prefers-color-scheme: dark)');
  var translations = JSON.parse(document.getElementById('i18n-data').textContent);
  var language = root.getAttribute('data-ui-lang');

  try {
    var savedLanguage = localStorage.getItem('ui-language');
    if (savedLanguage === 'en' || savedLanguage === 'zh') language = savedLanguage;
  } catch (error) { /* Use the page's default interface language. */ }

  function isDark() {
    return root.getAttribute('data-theme') === 'dark' ||
      (!root.hasAttribute('data-theme') && system.matches);
  }

  function updateTheme() {
    if (!button) return;
    var text = translations[language];
    button.textContent = isDark() ? text.light : text.dark;
    button.setAttribute('aria-label', isDark() ? text.switch_light : text.switch_dark);
  }

  function updateLanguage() {
    var text = translations[language];
    // The document and article language describe the content, not this preference.
    root.setAttribute('data-ui-lang', language);
    document.querySelectorAll('[data-i18n]').forEach(function (element) {
      element.textContent = text[element.getAttribute('data-i18n')];
      element.setAttribute('lang', language);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (element) {
      element.setAttribute('aria-label', text[element.getAttribute('data-i18n-aria')]);
      element.setAttribute('lang', language);
    });
    if (languageButton) {
      languageButton.textContent = text.language;
      languageButton.setAttribute('aria-label', text.switch_language);
      languageButton.setAttribute('lang', language === 'en' ? 'zh' : 'en');
    }
    updateTheme();
  }

  if (button) {
    button.addEventListener('click', function () {
      var theme = isDark() ? 'light' : 'dark';
      root.setAttribute('data-theme', theme);
      try { localStorage.setItem('theme', theme); } catch (error) { /* Storage is optional. */ }
      updateTheme();
    });
    system.addEventListener('change', updateTheme);
  }

  if (languageButton) {
    languageButton.addEventListener('click', function () {
      language = language === 'en' ? 'zh' : 'en';
      try { localStorage.setItem('ui-language', language); } catch (error) { /* Storage is optional. */ }
      updateLanguage();
    });
  }

  updateLanguage();
  if (button) button.hidden = false;
  if (languageButton) languageButton.hidden = false;
}());
