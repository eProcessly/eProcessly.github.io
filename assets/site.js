(() => {
  const EMAILJS_PUBLIC_KEY = 'tuXLomuzXc_bY8GNA';
  const EMAILJS_SERVICE_ID = 'service_7627sg2';
  const EMAILJS_TEMPLATE_ID = 'template_97vz2yf';

  let emailJsLoading = false;
  let emailJsReady = false;
  let handlersAttached = false;

  function loadEmailJs() {
    if (window.emailjs) {
      initEmailJs();
      return Promise.resolve();
    }
    if (emailJsLoading) {
      return new Promise((resolve) => {
        const check = () => {
          if (emailJsReady) resolve();
          else setTimeout(check, 50);
        };
        check();
      });
    }
    emailJsLoading = true;
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
      s.async = true;
      s.onload = () => { initEmailJs(); resolve(); };
      s.onerror = (e) => reject(e);
      document.head.appendChild(s);
    });
  }

  function initEmailJs() {
    try {
      if (!emailJsReady && window.emailjs) {
        window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
        emailJsReady = true;
        console.log('[site] EmailJS initialized');
      }
    } catch (e) {
      console.error('EmailJS init failed', e);
    }
  }

  function isContactRoute() {
    const p = location.pathname;
    return /contact(\.html)?$/i.test(p);
  }

  function findContactForm() {
    return (
      document.querySelector('form.framer-yckqxa') ||
      document.querySelector('form[action*="contact"]') ||
      document.querySelector('form')
    );
  }

  function getField(name) {
    return (
      document.querySelector(`input[name="${name}"]`) ||
      document.querySelector(`select[name="${name}"]`) ||
      document.querySelector(`textarea[name="${name}"]`)
    );
  }

  function extractParams() {
    const name = getField('Name')?.value?.trim() || '';
    const email = getField('Email')?.value?.trim() || '';
    const company = getField('Company')?.value?.trim() || '';
    const meetingForm = getField('Meeting form')?.value || '';
    const message = getField('Message')?.value?.trim() || '';
    return { name, email, company, meeting_form: meetingForm, message };
  }

  function validateParams(params) {
    if (!params.name || !params.email || !params.meeting_form) return false;
    const ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(params.email);
    return ok;
  }

  async function attachContactHandlers() {
    const form = findContactForm();
    if (!form || handlersAttached) return;
    handlersAttached = true;

    await loadEmailJs().catch((e) => console.error('EmailJS load failed', e));

    form.addEventListener(
      'submit',
      async (e) => {
        try {
          e.preventDefault();
          const params = extractParams();
          if (!validateParams(params)) {
            alert('Please fill Name, Email, Meeting form.');
            return;
          }
          const submitBtn = form.querySelector('[type="submit"]');
          if (submitBtn) submitBtn.disabled = true;
          const result = await window.emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            params
          );
          console.log('[site] EmailJS sent', result);
          alert('Message sent! We will get back soon.');
          if (submitBtn) submitBtn.disabled = false;
        } catch (err) {
          console.error('EmailJS send error', err);
          alert('Failed to send. Please try again later.');
          const submitBtn = form.querySelector('[type="submit"]');
          if (submitBtn) submitBtn.disabled = false;
        }
      },
      { once: true }
    );
  }

  function observeForContactForm() {
    const observer = new MutationObserver(() => {
      if (!handlersAttached) attachContactHandlers();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function onLocationChange() {
    handlersAttached = false;
    if (isContactRoute() || findContactForm()) attachContactHandlers();
  }

  function patchHistory() {
    const origPush = history.pushState;
    const origReplace = history.replaceState;
    const emit = () => window.dispatchEvent(new Event('locationchange'));
    history.pushState = function (...args) {
      const ret = origPush.apply(this, args);
      emit();
      return ret;
    };
    history.replaceState = function (...args) {
      const ret = origReplace.apply(this, args);
      emit();
      return ret;
    };
    window.addEventListener('popstate', emit);
    window.addEventListener('hashchange', emit);
    window.addEventListener('locationchange', onLocationChange);
  }

  function init() {
    patchHistory();
    observeForContactForm();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onLocationChange);
    } else {
      onLocationChange();
    }
  }

  init();
})();