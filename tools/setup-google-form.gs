/**
 * LP の申込フォームと同じ設問を Google フォームに作成するスクリプト
 *
 * 使い方:
 *   1. Google フォームの編集画面 → 右上「⋮」→「Apps Script」
 *   2. このファイルの中身を貼り付けて保存
 *   3. 関数 setupForm を選んで「実行」（初回は権限の承認が必要）
 *
 * 注意: 実行するとフォーム内の既存の設問はすべて削除されます。
 *
 * 選択肢の文言は LP 側の value と完全一致している必要があります。
 * 変更する場合は index.html / ko/index.html の value も同時に直してください。
 * 韓国語版も日本語の value で送信し、「言語」欄で区別します。
 *
 * 必須チェックは LP 側で行うため、ここでは必須にしていません
 * （フォーム側で必須にすると、不一致があったときに回答が黙って捨てられるため）。
 */
function setupForm() {
  var form = FormApp.getActiveForm();

  form.getItems().forEach(function (item) { form.deleteItem(item); });

  form.setTitle('タワマン大家 個別相談 アンケート');
  form.setDescription('LP（日本語版・韓国語版）から送信される回答の受付用フォームです。');
  form.setCollectEmail(false);
  form.setLimitOneResponsePerUser(false);
  form.setAcceptingResponses(true);
  try { form.setRequireLogin(false); } catch (e) { /* 個人アカウントでは設定不可 */ }

  form.addTextItem().setTitle('お名前');
  form.addTextItem().setTitle('メールアドレス');

  form.addListItem().setTitle('国籍・在留資格').setChoiceValues([
    '日本国籍',
    '永住者・特別永住者',
    '日本人の配偶者等・永住者の配偶者等',
    '経営・管理',
    '就労資格（技術・人文知識・国際業務 など）',
    'その他の在留資格',
    '日本非居住（海外にお住まい）'
  ]);

  form.addListItem().setTitle('世帯年収').setChoiceValues([
    '〜900万円', '900〜1,500万円', '1,500〜2,500万円', '2,500万円〜'
  ]);

  form.addListItem().setTitle('投資に回せる自己資金').setChoiceValues([
    '〜500万円', '500〜1,000万円', '1,000〜3,000万円', '3,000万円〜'
  ]);

  form.addListItem().setTitle('不動産の保有状況').setChoiceValues([
    'まだ持っていない', '自宅のみ（賃貸中の物件はなし）', '投資用を1件保有', '投資用を2件以上保有'
  ]);

  form.addListItem().setTitle('検討している時期').setChoiceValues([
    'すぐにでも（3か月以内）', '半年以内', '1年以内', 'まだ情報収集の段階'
  ]);

  form.addCheckboxItem().setTitle('関心のあるテーマ').setChoiceValues([
    '湾岸タワーマンションの購入',
    '一棟アパートによる資産形成',
    '融資の組み方・金融機関の選び方',
    '出口戦略・売却・資産の組み換え'
  ]);

  form.addParagraphTextItem().setTitle('いま一番知りたいこと・困っていること');

  form.addMultipleChoiceItem().setTitle('個別相談のご希望').setChoiceValues([
    '希望する', '検討中', '資料のみ'
  ]);

  form.addCheckboxItem().setTitle('プライバシーポリシーへの同意').setChoiceValues(['同意する']);

  form.addListItem().setTitle('言語').setChoiceValues(['日本語', '한국어']);

  Logger.log('作成完了: ' + form.getPublishedUrl());
}
