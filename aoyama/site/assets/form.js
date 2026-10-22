/* ==========================================================================
   申込フォーム → Google フォーム送信

   ページ遷移せずに formResponse へ POST する。Google 側は CORS を返さないため
   no-cors で送り、レスポンスの中身は確認できない（ネットワークエラーのみ検知）。
   ========================================================================== */

(function () {
  // TODO: tools/setup-google-form.gs で作ったフォームの formResponse の URL と entry ID に差し替える。
  // 差し替えるまで送信はエラーになる（no-cors では失敗を検知できず、回答が黙って消えるため）
  var FORM_ACTION = '';

  // LP の name 属性 → Google フォームの entry ID
  // 設問を作り直した場合は ID が変わるので、公開フォームから取り直すこと
  var ENTRY = {
    name:       'entry.TODO',
    email:      'entry.TODO',
    occupation: 'entry.TODO',
    income:     'entry.TODO',
    equity:     'entry.TODO',
    holdings:   'entry.TODO',
    timing:     'entry.TODO',
    topics:     'entry.TODO',
    message:    'entry.TODO',
    consult:    'entry.TODO',
    consent:    'entry.TODO',
    lang:       'entry.TODO'
  };

  // 特典はサンクス表示の LINE 友だち追加ボタンから受け取ってもらう（PDF のリンクは置かない）

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

    var sent = FORM_ACTION && ENTRY.lang.indexOf('TODO') < 0
      ? fetch(FORM_ACTION, { method: 'POST', mode: 'no-cors', body: body })
      : Promise.reject(new Error('form action is not configured'));

    sent
      .then(function () {
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
