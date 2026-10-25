/* Preset questions the Veloce team can send to an applicant. Each one has a structured answer
 * that updates the application, so the decision re-runs on the reply. Text in en / hi / kn.
 */
(function (root) {
  'use strict';
  var Q = {
    pin: { type: 'pin', en: 'Please confirm the exact 6-digit pin code of your shop.', hi: 'कृपया अपनी दुकान का सही 6 अंकों का पिन कोड बताएँ।', kn: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಮಳಿಗೆಯ ಸರಿಯಾದ 6 ಅಂಕಿಯ ಪಿನ್ ಕೋಡ್ ತಿಳಿಸಿ.' },
    funds: { type: 'number', field: 'investment', unit: 'lakh', en: 'How much can you invest in the store (₹ lakh)? Please keep proof of funds ready.', hi: 'आप स्टोर में कितना निवेश कर सकते हैं (₹ लाख)? कृपया फंड का प्रमाण तैयार रखें।', kn: 'ಮಳಿಗೆಯಲ್ಲಿ ನೀವು ಎಷ್ಟು ಹೂಡಿಕೆ ಮಾಡಬಹುದು (₹ ಲಕ್ಷ)? ದಯವಿಟ್ಟು ಹಣದ ಪುರಾವೆ ಸಿದ್ಧವಾಗಿಡಿ.' },
    space: { type: 'space', en: 'Have you found a shop? Tell us if it is owned or rented, which floor, and its size.', hi: 'क्या आपको दुकान मिल गई है? बताएँ कि वह अपनी है या किराए की, कौन सी मंज़िल पर है और उसका आकार।', kn: 'ನಿಮಗೆ ಮಳಿಗೆ ಸಿಕ್ಕಿದೆಯೇ? ಅದು ಸ್ವಂತವೇ ಬಾಡಿಗೆಯೇ, ಯಾವ ಮಹಡಿ ಮತ್ತು ಅದರ ಅಳತೆ ತಿಳಿಸಿ.' },
    launch: { type: 'number', field: 'launchMonths', unit: 'months', en: 'In how many months do you realistically want to open?', hi: 'आप वास्तव में कितने महीनों में स्टोर खोलना चाहते हैं?', kn: 'ನೀವು ವಾಸ್ತವವಾಗಿ ಎಷ್ಟು ತಿಂಗಳಲ್ಲಿ ಮಳಿಗೆ ತೆರೆಯಲು ಬಯಸುತ್ತೀರಿ?' },
    experience: { type: 'number', field: 'experience', unit: 'years', en: 'How many years have you run or managed a shop?', hi: 'आपने कितने वर्षों तक कोई दुकान चलाई या संभाली है?', kn: 'ನೀವು ಎಷ್ಟು ವರ್ಷ ಅಂಗಡಿ ನಡೆಸಿದ್ದೀರಿ ಅಥವಾ ನಿರ್ವಹಿಸಿದ್ದೀರಿ?' },
    loan: { type: 'yesno', signals: ['loan'], en: 'Has your bank loan been sanctioned?', hi: 'क्या आपका बैंक लोन स्वीकृत हो गया है?', kn: 'ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಸಾಲ ಮಂಜೂರಾಗಿದೆಯೇ?' },
    commitment: { type: 'yesno', signals: ['absentee', 'uncertain'], en: 'Will you run the store full-time yourself?', hi: 'क्या आप स्टोर पूरा समय खुद चलाएँगे?', kn: 'ನೀವೇ ಪೂರ್ಣ ಸಮಯ ಮಳಿಗೆ ನಡೆಸುತ್ತೀರಾ?' },
    custom: { type: 'text', en: '', hi: '', kn: '' }
  };
  var ORDER = ['pin', 'funds', 'space', 'launch', 'experience', 'loan', 'commitment'];
  var LANG = { English: 'en', Hindi: 'hi', Kannada: 'kn' };

  /** Which questions the engine's own reasoning says to ask first */
  function suggest(r) {
    var out = [];
    function add(k) { if (out.indexOf(k) < 0) out.push(k); }
    (r.blocking || []).forEach(function (b) {
      if (/pin_|city/.test(b.code)) add('pin');
      if (b.code === 'inv_missing') add('funds');
    });
    (r.conditions || []).forEach(function (c) {
      if (/funding gap/.test(c)) add('funds');
      if (/Find a ground|Share the size|Upper-floor|Site visit|below the|Confirm the space|Relocate/.test(c)) add('space');
      if (/loan sanction/.test(c)) add('loan');
      if (/Commitment call/.test(c)) add('commitment');
    });
    (r.signals || []).forEach(function (s) { if (s.key === 'absentee' || s.key === 'uncertain') add('commitment'); if (s.key === 'loan') add('loan'); });
    if (r.realisticMonths && r.app && r.app.launchMonths !== null && r.app.launchMonths < r.realisticMonths) add('launch');
    if (r.app && (r.app.experience === null || r.app.experience === undefined)) add('experience');
    return out;
  }

  function text(key, lang, custom) {
    if (key === 'custom') return custom || '';
    var q = Q[key]; if (!q) return custom || '';
    return q[LANG[lang] || lang] || q.en;
  }

  root.VeloceQuestions = { Q: Q, ORDER: ORDER, suggest: suggest, text: text, LANG: LANG };
})(this);
