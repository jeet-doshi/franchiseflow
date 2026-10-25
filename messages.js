/* FranchiseFlow messages: drafts the note each applicant receives, in the language they
 * asked for (Kannada / Hindi / English). Built from the decision's own codes, so the
 * message always says the same thing the decision does.
 */
(function (root) {
  'use strict';

  var E = root.FranchiseEngine || (typeof require !== 'undefined' ? require('./engine.js') : null);

  var T = {
    English: {
      hi: 'Namaste {name}!',
      approved: 'Great news - your application {id} to open our store in {city} (pin {pin}) is approved.',
      conditional: 'Good news - your application {id} for {city} (pin {pin}) is provisionally approved. We are holding a slot for you for 30 days. To confirm it, please:',
      next: 'Next steps:',
      steps: ['A welcome call from your expansion manager within 3 days.', 'Upload KYC, PAN, GST and proof of funds within 7 days.', 'Sign the franchise agreement and pay the fee within 14 days.'],
      training: 'Your training will be in {lang} ({weeks} week(s)), including shifts at our {store} store.',
      opening: 'Expected opening: {date}.',
      waitlist: 'Thank you, {name}. Your application {id} meets our criteria, but all the open slots in your area are taken right now. You are on our priority waitlist and we will call you first when a slot opens.',
      hold: 'Thank you, {name}. Before we can decide on application {id}, we need one thing from you:',
      rejected: 'Thank you for your interest, {name}. We are unable to take application {id} forward right now:',
      reapply: 'You are welcome to apply again when this changes.',
      withdrawn: 'Thank you, {name}. As requested, we have closed application {id}. Our door stays open.',
      sign: '- Expansion team',
      c: {
        relocate: 'move the proposed store to pin {p} (we have reserved it for you for 45 days)',
        funds: 'show proof of {p} in funds (a bank loan or co-investor is fine)',
        find_space: 'find a ground-floor or mall shop of at least 400 sq ft in pin {p} - our team will share 3 options',
        share_size: 'share the size, photos and frontage of your shop',
        small_space: 'find a shop larger than 300 sq ft',
        upper_floor: 'move to a ground-floor or mall shop (upper floors get far fewer walk-ins)',
        site_visit: 'let us visit the site to confirm the floor and frontage',
        confirm_space: 'confirm your shop address and share the lease or ownership papers',
        loan: 'share your loan sanction letter',
        competitor: 'exit any competing-brand business before signing',
        commitment: 'join a commitment call and pay a refundable token deposit'
      },
      q: {
        pin_missing: 'the exact 6-digit pin code of the shop you have in mind.',
        pin_mismatch: 'please confirm the city and pin code - {city} and pin {pin} do not match.',
        store_pin: 'we already have a store in pin {pin}. Would you consider pin {alt} instead?',
        no_territory: 'pin {pin} is outside the areas we are opening in. Would you consider pin {alt} instead?',
        inv_missing: 'how much you can invest in the store.',
        duplicate: 'we received two applications from you - please tell us which one to keep.',
        city: 'the city where you want to open the store.',
        relocate_offer: 'your pin was taken, but we can offer pin {alt} in the same area. Would that work?'
      },
      r: {
        funds: 'a store in {city} needs about {cost} and the application shows {inv}.',
        score: 'the application does not yet meet our requirements on funds, shop space and experience.',
        notarget: 'we are not opening stores in {city} at the moment.'
      }
    },
    Kannada: {
      hi: 'ನಮಸ್ಕಾರ {name} ಅವರೇ!',
      approved: 'ಸಂತೋಷದ ಸುದ್ದಿ - {city} (ಪಿನ್ {pin}) ನಲ್ಲಿ ನಮ್ಮ ಮಳಿಗೆ ತೆರೆಯಲು ನಿಮ್ಮ ಅರ್ಜಿ {id} ಅನುಮೋದನೆಯಾಗಿದೆ.',
      conditional: 'ಒಳ್ಳೆಯ ಸುದ್ದಿ - {city} (ಪಿನ್ {pin}) ಗಾಗಿ ನಿಮ್ಮ ಅರ್ಜಿ {id} ತಾತ್ಕಾಲಿಕವಾಗಿ ಅನುಮೋದನೆಯಾಗಿದೆ. ನಿಮಗಾಗಿ 30 ದಿನಗಳ ಕಾಲ ಸ್ಥಾನವನ್ನು ಕಾಯ್ದಿರಿಸಿದ್ದೇವೆ. ಅದನ್ನು ಖಚಿತಪಡಿಸಲು ದಯವಿಟ್ಟು:',
      next: 'ಮುಂದಿನ ಹಂತಗಳು:',
      steps: ['3 ದಿನಗಳಲ್ಲಿ ನಿಮ್ಮ ವಿಸ್ತರಣಾ ವ್ಯವಸ್ಥಾಪಕರಿಂದ ಸ್ವಾಗತ ಕರೆ.', '7 ದಿನಗಳಲ್ಲಿ KYC, PAN, GST ಮತ್ತು ಹಣದ ಪುರಾವೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.', '14 ದಿನಗಳಲ್ಲಿ ಫ್ರಾಂಚೈಸಿ ಒಪ್ಪಂದಕ್ಕೆ ಸಹಿ ಮಾಡಿ ಮತ್ತು ಶುಲ್ಕ ಪಾವತಿಸಿ.'],
      training: 'ನಿಮ್ಮ ತರಬೇತಿ ಕನ್ನಡದಲ್ಲಿ ({weeks} ವಾರ) ನಡೆಯುತ್ತದೆ, ನಮ್ಮ {store} ಮಳಿಗೆಯಲ್ಲಿ ಪ್ರಾಯೋಗಿಕ ಶಿಫ್ಟ್‌ಗಳೂ ಸೇರಿವೆ.',
      opening: 'ಅಂದಾಜು ಉದ್ಘಾಟನೆ: {date}.',
      waitlist: 'ಧನ್ಯವಾದಗಳು {name} ಅವರೇ. ನಿಮ್ಮ ಅರ್ಜಿ {id} ನಮ್ಮ ಮಾನದಂಡಗಳನ್ನು ಪೂರೈಸುತ್ತದೆ, ಆದರೆ ನಿಮ್ಮ ಪ್ರದೇಶದ ಎಲ್ಲಾ ಸ್ಥಾನಗಳು ಸದ್ಯಕ್ಕೆ ಭರ್ತಿಯಾಗಿವೆ. ನೀವು ನಮ್ಮ ಆದ್ಯತಾ ಕಾಯುವ ಪಟ್ಟಿಯಲ್ಲಿದ್ದೀರಿ; ಸ್ಥಾನ ಖಾಲಿಯಾದಾಗ ಮೊದಲು ನಿಮಗೆ ಕರೆ ಮಾಡುತ್ತೇವೆ.',
      hold: 'ಧನ್ಯವಾದಗಳು {name} ಅವರೇ. ಅರ್ಜಿ {id} ಬಗ್ಗೆ ನಿರ್ಧರಿಸುವ ಮೊದಲು ನಿಮ್ಮಿಂದ ಒಂದು ಮಾಹಿತಿ ಬೇಕು:',
      rejected: 'ನಿಮ್ಮ ಆಸಕ್ತಿಗೆ ಧನ್ಯವಾದಗಳು {name} ಅವರೇ. ಸದ್ಯಕ್ಕೆ ಅರ್ಜಿ {id} ಅನ್ನು ಮುಂದುವರಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ:',
      reapply: 'ಪರಿಸ್ಥಿತಿ ಬದಲಾದಾಗ ಮತ್ತೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಸ್ವಾಗತ.',
      withdrawn: 'ಧನ್ಯವಾದಗಳು {name} ಅವರೇ. ನಿಮ್ಮ ಕೋರಿಕೆಯಂತೆ ಅರ್ಜಿ {id} ಅನ್ನು ಮುಚ್ಚಿದ್ದೇವೆ.',
      sign: '- ವಿಸ್ತರಣಾ ತಂಡ',
      c: {
        relocate: 'ಪ್ರಸ್ತಾವಿತ ಮಳಿಗೆಯನ್ನು ಪಿನ್ {p} ಗೆ ಸ್ಥಳಾಂತರಿಸಿ (45 ದಿನಗಳಿಗೆ ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ)',
        funds: '{p} ಹಣದ ಪುರಾವೆ ತೋರಿಸಿ (ಬ್ಯಾಂಕ್ ಸಾಲ ಅಥವಾ ಸಹ-ಹೂಡಿಕೆದಾರ ಆಗಬಹುದು)',
        find_space: 'ಪಿನ್ {p} ನಲ್ಲಿ ಕನಿಷ್ಠ 400 ಚದರ ಅಡಿಯ ನೆಲ ಮಹಡಿ ಅಥವಾ ಮಾಲ್ ಮಳಿಗೆ ಹುಡುಕಿ - ನಮ್ಮ ತಂಡ 3 ಆಯ್ಕೆಗಳನ್ನು ಕಳುಹಿಸುತ್ತದೆ',
        share_size: 'ನಿಮ್ಮ ಮಳಿಗೆಯ ಅಳತೆ ಮತ್ತು ಫೋಟೋಗಳನ್ನು ಕಳುಹಿಸಿ',
        small_space: '300 ಚದರ ಅಡಿಗಿಂತ ದೊಡ್ಡ ಮಳಿಗೆ ಹುಡುಕಿ',
        upper_floor: 'ನೆಲ ಮಹಡಿ ಅಥವಾ ಮಾಲ್ ಮಳಿಗೆಗೆ ಬದಲಾಯಿಸಿ',
        site_visit: 'ಮಹಡಿ ಮತ್ತು ಮುಂಭಾಗ ದೃಢೀಕರಿಸಲು ಸ್ಥಳ ಭೇಟಿಗೆ ಅವಕಾಶ ನೀಡಿ',
        confirm_space: 'ಮಳಿಗೆಯ ವಿಳಾಸ ಮತ್ತು ಬಾಡಿಗೆ/ಮಾಲೀಕತ್ವದ ದಾಖಲೆಗಳನ್ನು ಕಳುಹಿಸಿ',
        loan: 'ಸಾಲ ಮಂಜೂರಾತಿ ಪತ್ರ ಕಳುಹಿಸಿ',
        competitor: 'ಸಹಿ ಮಾಡುವ ಮೊದಲು ಸ್ಪರ್ಧಾತ್ಮಕ ಬ್ರ್ಯಾಂಡ್ ವ್ಯವಹಾರದಿಂದ ಹೊರಬನ್ನಿ',
        commitment: 'ಬದ್ಧತೆಯ ಕರೆಗೆ ಸೇರಿ ಮತ್ತು ಮರುಪಾವತಿಸಬಹುದಾದ ಟೋಕನ್ ಠೇವಣಿ ಪಾವತಿಸಿ'
      },
      q: {
        pin_missing: 'ನೀವು ಯೋಚಿಸಿರುವ ಮಳಿಗೆಯ ಸರಿಯಾದ 6 ಅಂಕಿಯ ಪಿನ್ ಕೋಡ್.',
        pin_mismatch: 'ದಯವಿಟ್ಟು ನಗರ ಮತ್ತು ಪಿನ್ ಕೋಡ್ ದೃಢೀಕರಿಸಿ - {city} ಮತ್ತು ಪಿನ್ {pin} ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ.',
        store_pin: 'ಪಿನ್ {pin} ನಲ್ಲಿ ಈಗಾಗಲೇ ನಮ್ಮ ಮಳಿಗೆ ಇದೆ. ಬದಲಿಗೆ ಪಿನ್ {alt} ಪರಿಗಣಿಸುತ್ತೀರಾ?',
        no_territory: 'ಪಿನ್ {pin} ನಾವು ವಿಸ್ತರಿಸುತ್ತಿರುವ ಪ್ರದೇಶದ ಹೊರಗಿದೆ. ಬದಲಿಗೆ ಪಿನ್ {alt} ಪರಿಗಣಿಸುತ್ತೀರಾ?',
        inv_missing: 'ಮಳಿಗೆಯಲ್ಲಿ ನೀವು ಎಷ್ಟು ಹೂಡಿಕೆ ಮಾಡಬಹುದು.',
        duplicate: 'ನಿಮ್ಮಿಂದ ಎರಡು ಅರ್ಜಿಗಳು ಬಂದಿವೆ - ಯಾವುದನ್ನು ಉಳಿಸಬೇಕು ಎಂದು ತಿಳಿಸಿ.',
        city: 'ಮಳಿಗೆ ತೆರೆಯಲು ಬಯಸುವ ನಗರ.',
        relocate_offer: 'ನಿಮ್ಮ ಪಿನ್ ಬೇರೆಯವರಿಗೆ ಹೋಗಿದೆ, ಆದರೆ ಅದೇ ಪ್ರದೇಶದಲ್ಲಿ ಪಿನ್ {alt} ನೀಡಬಹುದು. ಅದು ಸರಿಯೇ?'
      },
      r: {
        funds: '{city} ನಲ್ಲಿ ಮಳಿಗೆಗೆ ಸುಮಾರು {cost} ಬೇಕು, ಅರ್ಜಿಯಲ್ಲಿ {inv} ಇದೆ.',
        score: 'ಹಣ, ಮಳಿಗೆ ಸ್ಥಳ ಮತ್ತು ಅನುಭವದ ನಮ್ಮ ಅವಶ್ಯಕತೆಗಳನ್ನು ಅರ್ಜಿ ಇನ್ನೂ ಪೂರೈಸಿಲ್ಲ.',
        notarget: 'ಸದ್ಯಕ್ಕೆ {city} ನಲ್ಲಿ ನಾವು ಮಳಿಗೆಗಳನ್ನು ತೆರೆಯುತ್ತಿಲ್ಲ.'
      }
    },
    Hindi: {
      hi: 'नमस्ते {name} जी!',
      approved: 'खुशखबरी - {city} (पिन {pin}) में हमारा स्टोर खोलने के लिए आपका आवेदन {id} स्वीकृत हो गया है।',
      conditional: 'अच्छी खबर - {city} (पिन {pin}) के लिए आपका आवेदन {id} अस्थायी रूप से स्वीकृत है। हमने 30 दिनों के लिए आपकी जगह सुरक्षित रखी है। इसे पक्का करने के लिए कृपया:',
      next: 'अगले कदम:',
      steps: ['3 दिनों के भीतर आपके एक्सपेंशन मैनेजर का स्वागत कॉल।', '7 दिनों के भीतर KYC, PAN, GST और फंड का प्रमाण अपलोड करें।', '14 दिनों के भीतर फ्रैंचाइज़ी अनुबंध पर हस्ताक्षर करें और शुल्क जमा करें।'],
      training: 'आपका प्रशिक्षण हिंदी में ({weeks} सप्ताह) होगा, जिसमें हमारे {store} स्टोर पर शिफ्ट भी शामिल हैं।',
      opening: 'अनुमानित उद्घाटन: {date}।',
      waitlist: 'धन्यवाद {name} जी। आपका आवेदन {id} हमारे मानदंडों पर खरा है, लेकिन आपके क्षेत्र की सभी जगहें अभी भर चुकी हैं। आप हमारी प्राथमिकता प्रतीक्षा सूची में हैं; जगह खाली होते ही सबसे पहले आपको कॉल करेंगे।',
      hold: 'धन्यवाद {name} जी। आवेदन {id} पर निर्णय लेने से पहले हमें आपसे एक जानकारी चाहिए:',
      rejected: 'आपकी रुचि के लिए धन्यवाद {name} जी। अभी हम आवेदन {id} को आगे नहीं बढ़ा पा रहे हैं:',
      reapply: 'स्थिति बदलने पर आप दोबारा आवेदन कर सकते हैं।',
      withdrawn: 'धन्यवाद {name} जी। आपके अनुरोध पर हमने आवेदन {id} बंद कर दिया है।',
      sign: '- एक्सपेंशन टीम',
      c: {
        relocate: 'प्रस्तावित स्टोर को पिन {p} पर ले जाएँ (45 दिनों के लिए आपके लिए सुरक्षित)',
        funds: '{p} के फंड का प्रमाण दिखाएँ (बैंक लोन या सह-निवेशक चलेगा)',
        find_space: 'पिन {p} में कम से कम 400 वर्ग फुट की ग्राउंड-फ्लोर या मॉल दुकान ढूँढें - हमारी टीम 3 विकल्प भेजेगी',
        share_size: 'अपनी दुकान का माप और फ़ोटो भेजें',
        small_space: '300 वर्ग फुट से बड़ी दुकान ढूँढें',
        upper_floor: 'ग्राउंड-फ्लोर या मॉल दुकान में जाएँ',
        site_visit: 'फ्लोर और सामने का हिस्सा देखने के लिए साइट विज़िट होने दें',
        confirm_space: 'दुकान का पता और किराया/स्वामित्व के कागज़ भेजें',
        loan: 'लोन स्वीकृति पत्र भेजें',
        competitor: 'हस्ताक्षर से पहले प्रतिस्पर्धी ब्रांड का काम बंद करें',
        commitment: 'प्रतिबद्धता कॉल में शामिल हों और वापसी योग्य टोकन राशि जमा करें'
      },
      q: {
        pin_missing: 'जिस दुकान के बारे में आप सोच रहे हैं उसका सही 6 अंकों का पिन कोड।',
        pin_mismatch: 'कृपया शहर और पिन कोड की पुष्टि करें - {city} और पिन {pin} मेल नहीं खाते।',
        store_pin: 'पिन {pin} में हमारा स्टोर पहले से है। क्या आप इसकी जगह पिन {alt} पर विचार करेंगे?',
        no_territory: 'पिन {pin} हमारे विस्तार क्षेत्र से बाहर है। क्या आप पिन {alt} पर विचार करेंगे?',
        inv_missing: 'आप स्टोर में कितना निवेश कर सकते हैं।',
        duplicate: 'हमें आपसे दो आवेदन मिले हैं - बताएँ कि कौन सा रखना है।',
        city: 'वह शहर जहाँ आप स्टोर खोलना चाहते हैं।',
        relocate_offer: 'आपका पिन किसी और को मिल गया, लेकिन उसी क्षेत्र में पिन {alt} दे सकते हैं। क्या यह ठीक रहेगा?'
      },
      r: {
        funds: '{city} में स्टोर के लिए लगभग {cost} चाहिए और आवेदन में {inv} है।',
        score: 'आवेदन अभी फंड, दुकान और अनुभव की हमारी ज़रूरतें पूरी नहीं करता।',
        notarget: 'फ़िलहाल हम {city} में स्टोर नहीं खोल रहे हैं।'
      }
    }
  };

  var COND = [
    [/^Relocate: .*pin (\d{6})/, 'relocate'], [/funding gap: show proof of (₹[\d.]+ L)/, 'funds'], [/^Confirm the space/, 'confirm_space'],
    [/^Find a ground-floor or mall unit .* pin (\d{6}|\?)/, 'find_space'], [/^Share the size/, 'share_size'], [/below the \d+ sq ft minimum/, 'small_space'],
    [/^Upper-floor/, 'upper_floor'], [/^Site visit/, 'site_visit'], [/loan sanction/, 'loan'], [/competing-brand/, 'competitor'], [/^Commitment call/, 'commitment']
  ];

  function fill(s, v) { return s.replace(/\{(\w+)\}/g, function (_, k) { return v[k] !== undefined && v[k] !== null ? v[k] : ''; }); }
  function fmtL(n) { return n === null || n === undefined ? '?' : '₹' + Math.round(n * 10) / 10 + ' L'; }

  /** r = one engine result. lang: 'English' | 'Kannada' | 'Hindi' (defaults to the applicant's). */
  function draft(r, lang) {
    lang = T[lang] ? lang : (T[r.app.language] ? r.app.language : 'English');
    var L = T[lang], a = r.app;
    var first = (a.name || '').split(/\s+/)[0] || a.name || '';
    var v = { name: first, id: a.id, city: a.city || '', pin: r.proposedPin || a.pin || '' };
    var lines = [fill(L.hi, v), ''];
    var p = r.plan;
    if (r.status === 'APPROVED' || r.status === 'CONDITIONAL') {
      lines.push(fill(r.status === 'APPROVED' ? L.approved : L.conditional, v));
      if (r.status === 'CONDITIONAL') {
        conditionCodes(r).forEach(function (c) { lines.push('• ' + fill(L.c[c.code], { p: c.p })); });
      }
      lines.push('', L.next);
      L.steps.forEach(function (s, i) { lines.push((i + 1) + '. ' + s); });
      if (p) {
        lines.push('', fill(L.training, { lang: lang, weeks: p.training.weeks, store: (p.training.shadowStore || '').split(' - ')[0] + ' ' + ((p.training.shadowStore || '').split(' - ')[1] || '').split(' (')[0] }));
        lines.push(fill(L.opening, { date: p.launchDate }));
      }
    } else if (r.status === 'WAITLIST') {
      lines = [fill(L.waitlist, v)];
    } else if (r.status === 'HOLD') {
      lines = [fill(L.hold, v)];
      var b = r.blocking[0];
      var alt = (r.suggestedPins || [])[0] || '';
      var code = b ? b.code : (r.suggestedPins && r.suggestedPins.length ? 'relocate_offer' : null);
      lines.push(code && L.q[code] ? fill(L.q[code], { city: a.city, pin: a.pin, alt: alt }) : (r.actions[0] || ''));
    } else if (r.status === 'REJECTED') {
      lines = [fill(L.rejected, v)];
      var info = E.CITIES[a.city];
      var cost = info ? E.ASSUMPTIONS.setupCost[info.tier] : null;
      if (a.override) lines.push(a.override.reason || '');
      else if (cost && a.investment !== null && a.investment < cost * E.ASSUMPTIONS.rejectBelowRatio) lines.push(fill(L.r.funds, { city: a.city, cost: fmtL(cost), inv: fmtL(a.investment) }));
      else lines.push(L.r.score);
      lines.push(L.reapply);
    } else {
      lines = [fill(L.withdrawn, v)];
    }
    lines.push('', L.sign);
    return { language: lang, text: lines.join('\n').replace(/\n{3,}/g, '\n\n') };
  }

  function conditionCodes(r) {
    var out = [];
    r.conditions.forEach(function (c) {
      for (var i = 0; i < COND.length; i++) {
        var m = c.match(COND[i][0]);
        if (m) { out.push({ code: COND[i][1], p: m[1] || '' }); return; }
      }
    });
    return out;
  }

  var api = { draft: draft, languages: Object.keys(T) };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FranchiseMessages = api;
})(this);
