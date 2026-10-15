/* ==========================================================================
   申込フォーム → Google フォーム送信（日本語版 / 韓国語版で共有）

   ページ遷移せずに formResponse へ POST する。Google 側は CORS を返さないため
   no-cors で送り、レスポンスの中身は確認できない（ネットワークエラーのみ検知）。
   ========================================================================== */

(function () {
  var FORM_ACTION = 'https://docs.google.com/forms/d/e/1FAIpQLSdBZ_p0uI_Z5CzauZ4aS6SXSIcKGZ6c0a2lWirK2TSx_j1F9Q/formResponse';

  // LP の name 属性 → Google フォームの entry ID
  // 設問を作り直した場合は ID が変わるので、公開フォームから取り直すこと
  var ENTRY = {
    name:      'entry.2108506434',
    email:     'entry.1658199166',
    residency: 'entry.482455744',
    income:    'entry.1567298018',
    equity:    'entry.658247390',
    holdings:  'entry.1541361398',
    timing:    'entry.802143010',
    topics:    'entry.1638083950',
    message:   'entry.689228946',
    consult:   'entry.262546002',
    consent:   'entry.864377852',
    lang:      'entry.429244145'
  };

  // 特典PDF。HTML には書かず、送信完了後にだけリンクを生成する。
  // 推測されにくいパスに置いているだけなので、URL を知っていれば誰でも取得できる点に注意。
  var DOWNLOAD_URL = new URL('dl/VF4WHOEdG4bdTxIAZ69Ekwfh/real-estate-strategy-seminar.pdf', document.currentScript.src).href;

  var form = document.querySelector('form[data-gform]');
  if (!form) return;

  var button = form.querySelector('button[type="submit"]');
  var status = form.querySelector('.form-status');
  var thanks = document.getElementById('form-thanks');

  function fieldOf(el) {
    return el.closest('.field, fieldset, .consent');
  }

  function markInvalid() {
    var first = null;
    form.querySelectorAll('.is-invalid').forEach(function (el) { el.classList.remove('is-invalid'); });
    form.querySelectorAll('input, select, textarea').forEach(function (el) {
      if (!el.checkValidity()) {
        var wrap = fieldOf(el);
        if (wrap) wrap.classList.add('is-invalid');
        if (!first) first = el;
      }
    });
    return first;
  }

  // 修正したらその場でエラー表示を消す
  form.addEventListener('change', function (e) {
    var wrap = fieldOf(e.target);
    if (!wrap || !wrap.classList.contains('is-invalid')) return;
    var ok = Array.prototype.every.call(wrap.querySelectorAll('input, select, textarea'), function (el) {
      return el.checkValidity();
    });
    if (ok) wrap.classList.remove('is-invalid');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var firstInvalid = markInvalid();
    if (firstInvalid) {
      status.textContent = form.dataset.msgInvalid;
      status.className = 'form-status is-error';
      fieldOf(firstInvalid).scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalid.focus({ preventScroll: true });
      return;
    }

    var body = new URLSearchParams();
    new FormData(form).forEach(function (value, key) {
      if (ENTRY[key] && value !== '') body.append(ENTRY[key], value);
    });
    body.append(ENTRY.lang, form.dataset.lang);

    button.disabled = true;
    button.textContent = form.dataset.msgSending;
    status.textContent = '';
    status.className = 'form-status';

    fetch(FORM_ACTION, { method: 'POST', mode: 'no-cors', body: body })
      .then(function () {
        var link = thanks.querySelector('[data-download]');
        link.href = DOWNLOAD_URL;
        link.setAttribute('download', link.dataset.download);
        form.hidden = true;
        thanks.hidden = false;
        thanks.scrollIntoView({ behavior: 'smooth', block: 'start' });
        thanks.focus({ preventScroll: true });
      })
      .catch(function () {
        button.disabled = false;
        button.textContent = form.dataset.msgSubmit;
        status.textContent = form.dataset.msgError;
        status.className = 'form-status is-error';
      });
  });
})();
