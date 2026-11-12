(function () {
  'use strict';

  var root = document.documentElement;
  var button = document.querySelector('.theme-toggle');
  var languageButton = document.querySelector('.language-toggle');
  var picker = document.querySelector('.theme-picker');
  var options = document.getElementById('theme-options');
  var languagePicker = document.querySelector('.language-picker');
  var languageOptions = document.getElementById('language-options');
  var translations = JSON.parse(document.getElementById('i18n-data').textContent);
  var language = root.getAttribute('data-ui-lang');

  try {
    var savedLanguage = localStorage.getItem('ui-language');
    if (savedLanguage === 'en' || savedLanguage === 'zh') language = savedLanguage;
  } catch (error) { /* Use the page's default interface language. */ }

  function updateTheme() {
    if (!button || !options) return;
    var theme = root.getAttribute('data-theme') || 'system';
    var text = translations[language];
    button.querySelector('.theme-label').textContent = text[theme];
    button.setAttribute('aria-label', text.appearance + ': ' + text[theme]);
    options.querySelectorAll('input').forEach(function (input) {
      input.checked = input.value === theme;
    });
  }

  function setupPicker(container, toggle, panel) {
    if (!container || !toggle || !panel) return;
    function close() {
      panel.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
    }
    toggle.addEventListener('click', function () {
      panel.hidden = !panel.hidden;
      toggle.setAttribute('aria-expanded', String(!panel.hidden));
      if (!panel.hidden) panel.querySelector('input:checked').focus();
    });
    document.addEventListener('click', function (event) {
      if (!container.contains(event.target)) close();
    });
    container.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !panel.hidden) {
        close();
        toggle.focus();
      }
    });
    container.addEventListener('focusout', function (event) {
      if (!container.contains(event.relatedTarget)) close();
    });
    container.hidden = false;
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
      languageButton.querySelector('.language-label').textContent = text.language;
      languageButton.setAttribute('aria-label', text.interface_language + ': ' + text.language);
      languageButton.setAttribute('lang', language);
      languageOptions.querySelectorAll('input').forEach(function (input) {
        input.checked = input.value === language;
      });
    }
    updateTheme();
  }

  if (button && options) {
    options.addEventListener('change', function (event) {
      var theme = event.target.value;
      if (theme !== 'light' && theme !== 'dark' && theme !== 'system') return;
      if (theme === 'system') root.removeAttribute('data-theme');
      else root.setAttribute('data-theme', theme);
      try {
        if (theme === 'system') localStorage.removeItem('theme');
        else localStorage.setItem('theme', theme);
      } catch (error) { /* Storage is optional. */ }
      updateTheme();
    });
  }

  if (languageButton && languageOptions) {
    languageOptions.addEventListener('change', function (event) {
      if (event.target.value !== 'zh' && event.target.value !== 'en') return;
      language = event.target.value;
      try { localStorage.setItem('ui-language', language); } catch (error) { /* Storage is optional. */ }
      updateLanguage();
    });
  }

  updateLanguage();
  setupPicker(picker, button, options);
  setupPicker(languagePicker, languageButton, languageOptions);
}());
