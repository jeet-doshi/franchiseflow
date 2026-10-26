/* Veloce Partner Portal: pin check first, then a 3-step application with a live shortlist-chance panel,
 * then tracking with questions from the team. English (default), Hindi and Kannada.
 * Uses the same engine and rubric as the expansion dashboard, through the shared VeloceStore.
 */
(function () {
  'use strict';
  var E = window.FranchiseEngine, L = window.FranchiseLoader, S = window.VeloceStore, Q = window.VeloceQuestions, M = window.FranchiseMessages, H = E.helpers;
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ------------------------------------------------------------------ text
  var T = {
    en: {
      portal: 'Partner Portal', track: 'Track application', team: 'Veloce team? Open the expansion dashboard →',
      heroEyebrow: 'Now opening across Karnataka', heroTitle: 'Own a Veloce store in your neighbourhood',
      heroSub: 'Tell us where your shop would be. In two minutes you will know if your area is open, how strong your application looks, and what would make it stronger.',
      perk1: 'Training in your language', perk2: 'Open in about 10 weeks once you have a shop', perk3: 'See your chances before you apply',
      pinTitle: 'Start with your shop’s pin code', pinHint: 'The 6-digit pin code where you want to open the store', pinBtn: 'Check my area', pinInvalid: 'Please enter a 6-digit pin code.',
      notKA: 'Veloce is opening stores only in Karnataka right now: Bengaluru, Mysuru, Mangaluru, Hubballi-Dharwad, Belagavi, Tumakuru and Davanagere.',
      storeHere: 'Veloce already has a store in {pin} ({store}). We never open two stores in the same pin code.',
      takenHere: 'Another partner has already been shortlisted for {pin}. We never open two stores in the same pin code.',
      outside: '{pin} is outside the areas we are opening in right now.', full: 'All slots near {pin} are taken for now.',
      noCity: 'We are not opening new stores in {city} right now. You can still apply and join the waitlist.',
      openHere: 'Good news! {city} {pin} is open for new partners.', openSub: '{ter} · {prio} priority · {slots} open slot(s)',
      High: 'High', Medium: 'Medium', Low: 'Low',
      altTitle: 'Nearby areas that are open', altPick: 'Use {pin}', waitlistBtn: 'Apply anyway and join the waitlist', continueBtn: 'Continue to application',
      trackTitle: 'Already applied?', trackPh: 'Application ID, e.g. WEB-1234', trackBtn: 'Track',
      step1: 'About you', step2: 'Money & shop', step3: 'Your plans', stepOf: 'Step {n} of 3',
      name: 'Full name', namePh: 'e.g. Kavya Rao', exp: 'Years running or managing a shop', expHint: '0 if none',
      biz: 'What do you do today?', bizPh: 'e.g. I run a footwear store',
      inv: 'How much can you invest?', invUnit: '₹ lakh', invHint: 'A store in {city} needs about ₹{cost} lakh in total (fee, fit-out, stock, deposit).',
      space: 'Do you have a shop space?', Owned: 'Yes, I own it', Rented: 'Yes, rented', 'Not yet identified': 'Not yet',
      floor: 'Which floor?', Ground: 'Ground floor', 'Mall unit': 'Mall unit', Upper: 'Upper floor', 'Not known': 'Not sure',
      size: 'Shop size (sq ft)', launch: 'When do you want to open?', months: '{n} months',
      lang: 'Preferred language for training', notes: 'Anything else we should know?', notesPh: 'e.g. I want to open before Diwali',
      back: 'Back', next: 'Next', submit: 'Submit application', city: 'City', change: 'Change',
      chanceTitle: 'Your shortlist chance', band_strong: 'Strong', band_good: 'Good', band_fair: 'Needs work', band_low: 'Unlikely right now',
      bs_strong: 'You look like a strong fit for this area.', bs_good: 'A good fit. A few things would make it stronger.', bs_fair: 'Possible, but some gaps need fixing.', bs_low: 'Not yet. Here is what would change that.',
      howScore: 'How you score', f_Funds: 'Funds', 'f_Space readiness': 'Shop readiness', 'f_Retail experience': 'Retail experience', 'f_Business background': 'Business background', 'f_Timeline realism': 'Realistic timeline', 'f_Territory priority': 'Area priority',
      improve: 'How to improve your chances', tip_funds: 'Raise your investment to ₹{amt} lakh', tip_space: 'Secure a ground-floor shop of about 450 sq ft', tip_size: 'Confirm a shop of at least 400 sq ft',
      tip_pin: 'Choose pin {pin} instead', tip_launch: 'Plan to open in {n} months', tip_loan: 'Get your bank loan sanctioned', tip_commit: 'Confirm you are fully committed', tip_conflict: 'Exit any competing brand',
      tip_fulltime: 'Plan to run the store full-time', tip_city: 'Confirm your city', tip_all: 'Do all of the above together', noTips: 'Nothing to improve. Keep your documents ready.', noTipsSoft: 'What’s left is experience and business background. Those build over time, and our training covers them, so keep your documents ready.',
      fineprint: 'This is a live estimate. The final decision also depends on other applicants for the same area and on checking your documents.',
      doneTitle: 'Application submitted!', doneId: 'Your application ID', doneSave: 'Save this ID. Use it to track your application and answer questions from our team.', doneTrack: 'Track my application', doneCopy: 'Copy ID', copied: 'Copied',
      trkTitle: 'Your application', notFound: 'We couldn’t find {id}. Check the ID and try again.', loading: 'Looking up your application…',
      st_submitted: 'Submitted', st_review: 'Under review', st_decision: 'Decision',
      s_review: 'Under review', s_APPROVED: 'Shortlisted', s_CONDITIONAL: 'Shortlisted, with conditions', s_WAITLIST: 'Waitlisted', s_HOLD: 'We need some information', s_REJECTED: 'Not selected this time', s_WITHDRAWN: 'Withdrawn',
      reviewNote: 'Our expansion team is reviewing your application. Questions and the decision will appear here.',
      msgFromTeam: 'Message from Veloce', questions: 'Questions from our team', noQuestions: 'No questions yet. We’ll post them here.',
      answerBtn: 'Send answer', answered: 'Answered', yes: 'Yes', no: 'Not yet', replyPh: 'Type your answer', yourAnswer: 'Your answer',
      sendNote: 'Send a message to the team', sendNoteBtn: 'Send', withdraw: 'Withdraw application', withdrawConfirm: 'Withdraw your application? This can’t be undone.',
      myApps: 'Your applications on this device', estimate: 'Your current estimate',
      sync_live: 'Live', sync_local: 'This device', sync_offline: 'Offline · will sync', sync_connecting: 'Connecting…',
      ws: 'Workspace {ws}', reqName: 'Please enter your name.', reqInv: 'Please enter how much you can invest.', sent: 'Sent to the Veloce team'
    },
    hi: {
      portal: 'पार्टनर पोर्टल', track: 'आवेदन ट्रैक करें', team: 'Veloce टीम? एक्सपेंशन डैशबोर्ड खोलें →',
      heroEyebrow: 'अब पूरे कर्नाटक में', heroTitle: 'अपने इलाके में Veloce स्टोर के मालिक बनें',
      heroSub: 'बताइए आपकी दुकान कहाँ होगी। दो मिनट में जानिए कि आपका इलाका खुला है या नहीं, आपका आवेदन कितना मज़बूत है, और उसे और बेहतर कैसे बनाएँ।',
      perk1: 'आपकी भाषा में प्रशिक्षण', perk2: 'दुकान मिलने के बाद लगभग 10 हफ़्तों में शुरुआत', perk3: 'आवेदन से पहले अपनी संभावना देखें',
      pinTitle: 'अपनी दुकान के पिन कोड से शुरू करें', pinHint: 'जहाँ आप स्टोर खोलना चाहते हैं उसका 6 अंकों का पिन कोड', pinBtn: 'मेरा इलाका जाँचें', pinInvalid: 'कृपया 6 अंकों का पिन कोड डालें।',
      notKA: 'Veloce अभी केवल कर्नाटक में स्टोर खोल रहा है: बेंगलुरु, मैसूरु, मंगलुरु, हुब्बल्ली-धारवाड़, बेलगावी, तुमकुरु और दावणगेरे।',
      storeHere: '{pin} में Veloce का स्टोर ({store}) पहले से है। हम एक पिन कोड में दो स्टोर नहीं खोलते।',
      takenHere: '{pin} के लिए एक और पार्टनर पहले ही चुना जा चुका है। हम एक पिन कोड में दो स्टोर नहीं खोलते।',
      outside: '{pin} अभी हमारे विस्तार क्षेत्र से बाहर है।', full: '{pin} के पास की सभी जगहें अभी भर चुकी हैं।',
      noCity: 'हम अभी {city} में नए स्टोर नहीं खोल रहे हैं। आप फिर भी आवेदन करके प्रतीक्षा सूची में शामिल हो सकते हैं।',
      openHere: 'खुशखबरी! {city} {pin} नए पार्टनर्स के लिए खुला है।', openSub: '{ter} · {prio} प्राथमिकता · {slots} जगह खाली',
      High: 'उच्च', Medium: 'मध्यम', Low: 'कम',
      altTitle: 'पास के खुले इलाके', altPick: '{pin} चुनें', waitlistBtn: 'फिर भी आवेदन करें और प्रतीक्षा सूची में जुड़ें', continueBtn: 'आवेदन जारी रखें',
      trackTitle: 'पहले ही आवेदन कर चुके हैं?', trackPh: 'आवेदन ID, जैसे WEB-1234', trackBtn: 'ट्रैक करें',
      step1: 'आपके बारे में', step2: 'पैसा और दुकान', step3: 'आपकी योजना', stepOf: 'चरण {n} / 3',
      name: 'पूरा नाम', namePh: 'जैसे कविता राव', exp: 'दुकान चलाने या संभालने के वर्ष', expHint: 'न हो तो 0',
      biz: 'आप अभी क्या करते हैं?', bizPh: 'जैसे मेरी जूतों की दुकान है',
      inv: 'आप कितना निवेश कर सकते हैं?', invUnit: '₹ लाख', invHint: '{city} में स्टोर के लिए कुल लगभग ₹{cost} लाख चाहिए (फीस, फिट-आउट, स्टॉक, डिपॉज़िट)।',
      space: 'क्या आपके पास दुकान की जगह है?', Owned: 'हाँ, अपनी है', Rented: 'हाँ, किराए की', 'Not yet identified': 'अभी नहीं',
      floor: 'कौन सी मंज़िल?', Ground: 'ग्राउंड फ्लोर', 'Mall unit': 'मॉल यूनिट', Upper: 'ऊपरी मंज़िल', 'Not known': 'पता नहीं',
      size: 'दुकान का आकार (वर्ग फुट)', launch: 'आप कब खोलना चाहते हैं?', months: '{n} महीने',
      lang: 'प्रशिक्षण की पसंदीदा भाषा', notes: 'कुछ और जो हमें जानना चाहिए?', notesPh: 'जैसे मैं दिवाली से पहले खोलना चाहता हूँ',
      back: 'पीछे', next: 'आगे', submit: 'आवेदन जमा करें', city: 'शहर', change: 'बदलें',
      chanceTitle: 'आपकी शॉर्टलिस्ट संभावना', band_strong: 'मज़बूत', band_good: 'अच्छी', band_fair: 'सुधार चाहिए', band_low: 'अभी संभावना कम',
      bs_strong: 'आप इस इलाके के लिए मज़बूत उम्मीदवार लगते हैं।', bs_good: 'अच्छा मेल है। कुछ बातें इसे और मज़बूत करेंगी।', bs_fair: 'संभव है, पर कुछ कमियाँ ठीक करनी होंगी।', bs_low: 'अभी नहीं। देखें क्या बदलने से फ़र्क पड़ेगा।',
      howScore: 'आपका स्कोर कैसे बना', f_Funds: 'पूंजी', 'f_Space readiness': 'दुकान की तैयारी', 'f_Retail experience': 'रिटेल अनुभव', 'f_Business background': 'व्यावसायिक पृष्ठभूमि', 'f_Timeline realism': 'व्यावहारिक समय-सीमा', 'f_Territory priority': 'इलाके की प्राथमिकता',
      improve: 'अपनी संभावना कैसे बढ़ाएँ', tip_funds: 'निवेश ₹{amt} लाख तक बढ़ाएँ', tip_space: 'लगभग 450 वर्ग फुट की ग्राउंड फ्लोर दुकान लें', tip_size: 'कम से कम 400 वर्ग फुट की दुकान पक्की करें',
      tip_pin: 'इसकी जगह पिन {pin} चुनें', tip_launch: '{n} महीनों में खोलने की योजना बनाएँ', tip_loan: 'बैंक लोन स्वीकृत करवाएँ', tip_commit: 'अपनी पूरी प्रतिबद्धता की पुष्टि करें', tip_conflict: 'किसी प्रतिस्पर्धी ब्रांड से अलग हों',
      tip_fulltime: 'स्टोर पूरा समय खुद चलाने की योजना बनाएँ', tip_city: 'अपना शहर पक्का करें', tip_all: 'ऊपर की सभी बातें एक साथ करें', noTips: 'सुधार की ज़रूरत नहीं। अपने दस्तावेज़ तैयार रखें।', noTipsSoft: 'बाकी अनुभव और व्यावसायिक पृष्ठभूमि है। ये समय के साथ बनते हैं और हमारा प्रशिक्षण इन्हें कवर करता है, अपने दस्तावेज़ तैयार रखें।',
      fineprint: 'यह एक लाइव अनुमान है। अंतिम निर्णय उसी इलाके के अन्य आवेदकों और आपके दस्तावेज़ों की जाँच पर भी निर्भर करता है।',
      doneTitle: 'आवेदन जमा हो गया!', doneId: 'आपकी आवेदन ID', doneSave: 'यह ID सँभालकर रखें। इससे आप आवेदन ट्रैक कर सकते हैं और हमारी टीम के सवालों के जवाब दे सकते हैं।', doneTrack: 'मेरा आवेदन ट्रैक करें', doneCopy: 'ID कॉपी करें', copied: 'कॉपी हो गया',
      trkTitle: 'आपका आवेदन', notFound: '{id} नहीं मिला। ID जाँचकर फिर कोशिश करें।', loading: 'आपका आवेदन खोजा जा रहा है…',
      st_submitted: 'जमा हुआ', st_review: 'समीक्षा में', st_decision: 'निर्णय',
      s_review: 'समीक्षा में', s_APPROVED: 'शॉर्टलिस्ट', s_CONDITIONAL: 'शर्तों के साथ शॉर्टलिस्ट', s_WAITLIST: 'प्रतीक्षा सूची में', s_HOLD: 'हमें कुछ जानकारी चाहिए', s_REJECTED: 'इस बार चयन नहीं हुआ', s_WITHDRAWN: 'वापस लिया गया',
      reviewNote: 'हमारी एक्सपेंशन टीम आपका आवेदन देख रही है। सवाल और निर्णय यहीं दिखेंगे।',
      msgFromTeam: 'Veloce का संदेश', questions: 'हमारी टीम के सवाल', noQuestions: 'अभी कोई सवाल नहीं। हम यहीं पूछेंगे।',
      answerBtn: 'जवाब भेजें', answered: 'जवाब दिया', yes: 'हाँ', no: 'अभी नहीं', replyPh: 'अपना जवाब लिखें', yourAnswer: 'आपका जवाब',
      sendNote: 'टीम को संदेश भेजें', sendNoteBtn: 'भेजें', withdraw: 'आवेदन वापस लें', withdrawConfirm: 'क्या आप आवेदन वापस लेना चाहते हैं? यह वापस नहीं होगा।',
      myApps: 'इस डिवाइस पर आपके आवेदन', estimate: 'आपका मौजूदा अनुमान',
      sync_live: 'लाइव', sync_local: 'यह डिवाइस', sync_offline: 'ऑफ़लाइन · बाद में सिंक', sync_connecting: 'जुड़ रहा है…',
      ws: 'वर्कस्पेस {ws}', reqName: 'कृपया अपना नाम लिखें।', reqInv: 'कृपया बताएँ आप कितना निवेश कर सकते हैं।', sent: 'Veloce टीम को भेज दिया'
    },
    kn: {
      portal: 'ಪಾಲುದಾರ ಪೋರ್ಟಲ್', track: 'ಅರ್ಜಿ ಸ್ಥಿತಿ ನೋಡಿ', team: 'Veloce ತಂಡವೇ? ವಿಸ್ತರಣಾ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೆರೆಯಿರಿ →',
      heroEyebrow: 'ಈಗ ಕರ್ನಾಟಕದಾದ್ಯಂತ', heroTitle: 'ನಿಮ್ಮ ಊರಿನಲ್ಲಿ Veloce ಮಳಿಗೆಯ ಮಾಲೀಕರಾಗಿ',
      heroSub: 'ನಿಮ್ಮ ಮಳಿಗೆ ಎಲ್ಲಿರುತ್ತದೆ ಎಂದು ತಿಳಿಸಿ. ಎರಡು ನಿಮಿಷದಲ್ಲಿ ನಿಮ್ಮ ಪ್ರದೇಶ ತೆರೆದಿದೆಯೇ, ನಿಮ್ಮ ಅರ್ಜಿ ಎಷ್ಟು ಬಲವಾಗಿದೆ ಮತ್ತು ಅದನ್ನು ಹೇಗೆ ಉತ್ತಮಗೊಳಿಸಬಹುದು ಎಂದು ತಿಳಿಯಿರಿ.',
      perk1: 'ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ತರಬೇತಿ', perk2: 'ಮಳಿಗೆ ಸಿಕ್ಕ ನಂತರ ಸುಮಾರು 10 ವಾರಗಳಲ್ಲಿ ಆರಂಭ', perk3: 'ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ಮೊದಲೇ ನಿಮ್ಮ ಅವಕಾಶ ನೋಡಿ',
      pinTitle: 'ನಿಮ್ಮ ಮಳಿಗೆಯ ಪಿನ್ ಕೋಡ್‌ನಿಂದ ಆರಂಭಿಸಿ', pinHint: 'ಮಳಿಗೆ ತೆರೆಯಲು ಬಯಸುವ ಸ್ಥಳದ 6 ಅಂಕಿಯ ಪಿನ್ ಕೋಡ್', pinBtn: 'ನನ್ನ ಪ್ರದೇಶ ಪರಿಶೀಲಿಸಿ', pinInvalid: 'ದಯವಿಟ್ಟು 6 ಅಂಕಿಯ ಪಿನ್ ಕೋಡ್ ನಮೂದಿಸಿ.',
      notKA: 'Veloce ಸದ್ಯ ಕರ್ನಾಟಕದಲ್ಲಿ ಮಾತ್ರ ಮಳಿಗೆಗಳನ್ನು ತೆರೆಯುತ್ತಿದೆ: ಬೆಂಗಳೂರು, ಮೈಸೂರು, ಮಂಗಳೂರು, ಹುಬ್ಬಳ್ಳಿ-ಧಾರವಾಡ, ಬೆಳಗಾವಿ, ತುಮಕೂರು ಮತ್ತು ದಾವಣಗೆರೆ.',
      storeHere: '{pin} ನಲ್ಲಿ ಈಗಾಗಲೇ Veloce ಮಳಿಗೆ ({store}) ಇದೆ. ಒಂದೇ ಪಿನ್ ಕೋಡ್‌ನಲ್ಲಿ ನಾವು ಎರಡು ಮಳಿಗೆ ತೆರೆಯುವುದಿಲ್ಲ.',
      takenHere: '{pin} ಗೆ ಈಗಾಗಲೇ ಇನ್ನೊಬ್ಬ ಪಾಲುದಾರರನ್ನು ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ. ಒಂದೇ ಪಿನ್ ಕೋಡ್‌ನಲ್ಲಿ ನಾವು ಎರಡು ಮಳಿಗೆ ತೆರೆಯುವುದಿಲ್ಲ.',
      outside: '{pin} ಸದ್ಯ ನಮ್ಮ ವಿಸ್ತರಣಾ ಪ್ರದೇಶದ ಹೊರಗಿದೆ.', full: '{pin} ಹತ್ತಿರದ ಎಲ್ಲಾ ಸ್ಥಾನಗಳು ಸದ್ಯ ಭರ್ತಿಯಾಗಿವೆ.',
      noCity: 'ಸದ್ಯ {city} ನಲ್ಲಿ ಹೊಸ ಮಳಿಗೆ ತೆರೆಯುತ್ತಿಲ್ಲ. ಆದರೂ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ ಕಾಯುವ ಪಟ್ಟಿಗೆ ಸೇರಬಹುದು.',
      openHere: 'ಸಂತೋಷದ ಸುದ್ದಿ! {city} {pin} ಹೊಸ ಪಾಲುದಾರರಿಗೆ ತೆರೆದಿದೆ.', openSub: '{ter} · {prio} ಆದ್ಯತೆ · {slots} ಸ್ಥಾನ ಖಾಲಿ',
      High: 'ಹೆಚ್ಚಿನ', Medium: 'ಮಧ್ಯಮ', Low: 'ಕಡಿಮೆ',
      altTitle: 'ಹತ್ತಿರದ ತೆರೆದ ಪ್ರದೇಶಗಳು', altPick: '{pin} ಆಯ್ಕೆಮಾಡಿ', waitlistBtn: 'ಆದರೂ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ, ಕಾಯುವ ಪಟ್ಟಿಗೆ ಸೇರಿ', continueBtn: 'ಅರ್ಜಿ ಮುಂದುವರಿಸಿ',
      trackTitle: 'ಈಗಾಗಲೇ ಅರ್ಜಿ ಸಲ್ಲಿಸಿದ್ದೀರಾ?', trackPh: 'ಅರ್ಜಿ ID, ಉದಾ. WEB-1234', trackBtn: 'ನೋಡಿ',
      step1: 'ನಿಮ್ಮ ಬಗ್ಗೆ', step2: 'ಹಣ ಮತ್ತು ಮಳಿಗೆ', step3: 'ನಿಮ್ಮ ಯೋಜನೆ', stepOf: 'ಹಂತ {n} / 3',
      name: 'ಪೂರ್ಣ ಹೆಸರು', namePh: 'ಉದಾ. ಕಾವ್ಯ ರಾವ್', exp: 'ಅಂಗಡಿ ನಡೆಸಿದ ಅಥವಾ ನಿರ್ವಹಿಸಿದ ವರ್ಷಗಳು', expHint: 'ಇಲ್ಲದಿದ್ದರೆ 0',
      biz: 'ನೀವು ಈಗ ಏನು ಮಾಡುತ್ತೀರಿ?', bizPh: 'ಉದಾ. ನಾನು ಪಾದರಕ್ಷೆ ಅಂಗಡಿ ನಡೆಸುತ್ತೇನೆ',
      inv: 'ನೀವು ಎಷ್ಟು ಹೂಡಿಕೆ ಮಾಡಬಹುದು?', invUnit: '₹ ಲಕ್ಷ', invHint: '{city} ನಲ್ಲಿ ಮಳಿಗೆಗೆ ಒಟ್ಟು ಸುಮಾರು ₹{cost} ಲಕ್ಷ ಬೇಕು (ಶುಲ್ಕ, ಒಳಾಂಗಣ, ಸ್ಟಾಕ್, ಠೇವಣಿ).',
      space: 'ನಿಮ್ಮ ಬಳಿ ಮಳಿಗೆ ಸ್ಥಳ ಇದೆಯೇ?', Owned: 'ಹೌದು, ಸ್ವಂತದ್ದು', Rented: 'ಹೌದು, ಬಾಡಿಗೆ', 'Not yet identified': 'ಇನ್ನೂ ಇಲ್ಲ',
      floor: 'ಯಾವ ಮಹಡಿ?', Ground: 'ನೆಲ ಮಹಡಿ', 'Mall unit': 'ಮಾಲ್ ಘಟಕ', Upper: 'ಮೇಲಿನ ಮಹಡಿ', 'Not known': 'ಗೊತ್ತಿಲ್ಲ',
      size: 'ಮಳಿಗೆಯ ಅಳತೆ (ಚದರ ಅಡಿ)', launch: 'ನೀವು ಯಾವಾಗ ತೆರೆಯಲು ಬಯಸುತ್ತೀರಿ?', months: '{n} ತಿಂಗಳು',
      lang: 'ತರಬೇತಿಗೆ ಆದ್ಯತೆಯ ಭಾಷೆ', notes: 'ನಾವು ತಿಳಿಯಬೇಕಾದ ಇನ್ನೇನಾದರೂ?', notesPh: 'ಉದಾ. ದೀಪಾವಳಿಗೂ ಮುನ್ನ ತೆರೆಯಬೇಕು',
      back: 'ಹಿಂದೆ', next: 'ಮುಂದೆ', submit: 'ಅರ್ಜಿ ಸಲ್ಲಿಸಿ', city: 'ನಗರ', change: 'ಬದಲಿಸಿ',
      chanceTitle: 'ನಿಮ್ಮ ಆಯ್ಕೆಯ ಅವಕಾಶ', band_strong: 'ಬಲವಾಗಿದೆ', band_good: 'ಉತ್ತಮ', band_fair: 'ಸುಧಾರಣೆ ಬೇಕು', band_low: 'ಸದ್ಯ ಕಡಿಮೆ',
      bs_strong: 'ಈ ಪ್ರದೇಶಕ್ಕೆ ನೀವು ಬಲವಾದ ಅಭ್ಯರ್ಥಿಯಂತೆ ಕಾಣುತ್ತೀರಿ.', bs_good: 'ಉತ್ತಮ ಹೊಂದಾಣಿಕೆ. ಕೆಲವು ವಿಷಯಗಳು ಇದನ್ನು ಇನ್ನಷ್ಟು ಬಲಪಡಿಸುತ್ತವೆ.', bs_fair: 'ಸಾಧ್ಯವಿದೆ, ಆದರೆ ಕೆಲವು ಕೊರತೆಗಳನ್ನು ಸರಿಪಡಿಸಬೇಕು.', bs_low: 'ಸದ್ಯ ಇಲ್ಲ. ಏನು ಬದಲಾದರೆ ಸಾಧ್ಯ ಎಂದು ನೋಡಿ.',
      howScore: 'ನಿಮ್ಮ ಅಂಕ ಹೇಗೆ ಬಂತು', f_Funds: 'ಬಂಡವಾಳ', 'f_Space readiness': 'ಮಳಿಗೆ ಸಿದ್ಧತೆ', 'f_Retail experience': 'ಚಿಲ್ಲರೆ ಅನುಭವ', 'f_Business background': 'ವ್ಯವಹಾರ ಹಿನ್ನೆಲೆ', 'f_Timeline realism': 'ವಾಸ್ತವಿಕ ಸಮಯ', 'f_Territory priority': 'ಪ್ರದೇಶದ ಆದ್ಯತೆ',
      improve: 'ನಿಮ್ಮ ಅವಕಾಶ ಹೆಚ್ಚಿಸುವುದು ಹೇಗೆ', tip_funds: 'ಹೂಡಿಕೆಯನ್ನು ₹{amt} ಲಕ್ಷಕ್ಕೆ ಹೆಚ್ಚಿಸಿ', tip_space: 'ಸುಮಾರು 450 ಚದರ ಅಡಿಯ ನೆಲ ಮಹಡಿ ಮಳಿಗೆ ಪಡೆಯಿರಿ', tip_size: 'ಕನಿಷ್ಠ 400 ಚದರ ಅಡಿಯ ಮಳಿಗೆ ಖಚಿತಪಡಿಸಿ',
      tip_pin: 'ಬದಲಿಗೆ ಪಿನ್ {pin} ಆಯ್ಕೆಮಾಡಿ', tip_launch: '{n} ತಿಂಗಳಲ್ಲಿ ತೆರೆಯಲು ಯೋಜಿಸಿ', tip_loan: 'ಬ್ಯಾಂಕ್ ಸಾಲ ಮಂಜೂರು ಮಾಡಿಸಿ', tip_commit: 'ನಿಮ್ಮ ಸಂಪೂರ್ಣ ಬದ್ಧತೆಯನ್ನು ಖಚಿತಪಡಿಸಿ', tip_conflict: 'ಸ್ಪರ್ಧಿ ಬ್ರ್ಯಾಂಡ್‌ನಿಂದ ಹೊರಬನ್ನಿ',
      tip_fulltime: 'ಮಳಿಗೆಯನ್ನು ಪೂರ್ಣ ಸಮಯ ನೀವೇ ನಡೆಸಲು ಯೋಜಿಸಿ', tip_city: 'ನಿಮ್ಮ ನಗರ ಖಚಿತಪಡಿಸಿ', tip_all: 'ಮೇಲಿನ ಎಲ್ಲವನ್ನೂ ಒಟ್ಟಿಗೆ ಮಾಡಿ', noTips: 'ಸುಧಾರಣೆ ಬೇಕಿಲ್ಲ. ದಾಖಲೆಗಳನ್ನು ಸಿದ್ಧವಾಗಿಡಿ.', noTipsSoft: 'ಉಳಿದಿರುವುದು ಅನುಭವ ಮತ್ತು ವ್ಯವಹಾರ ಹಿನ್ನೆಲೆ. ಇವು ಸಮಯದೊಂದಿಗೆ ಬೆಳೆಯುತ್ತವೆ, ನಮ್ಮ ತರಬೇತಿ ಇವನ್ನು ಒಳಗೊಳ್ಳುತ್ತದೆ; ದಾಖಲೆಗಳನ್ನು ಸಿದ್ಧವಾಗಿಡಿ.',
      fineprint: 'ಇದು ನೇರ ಅಂದಾಜು. ಅಂತಿಮ ನಿರ್ಧಾರ ಅದೇ ಪ್ರದೇಶದ ಇತರ ಅರ್ಜಿದಾರರು ಮತ್ತು ನಿಮ್ಮ ದಾಖಲೆಗಳ ಪರಿಶೀಲನೆಯನ್ನೂ ಅವಲಂಬಿಸಿದೆ.',
      doneTitle: 'ಅರ್ಜಿ ಸಲ್ಲಿಕೆಯಾಗಿದೆ!', doneId: 'ನಿಮ್ಮ ಅರ್ಜಿ ID', doneSave: 'ಈ ID ಉಳಿಸಿಕೊಳ್ಳಿ. ಅರ್ಜಿ ಸ್ಥಿತಿ ನೋಡಲು ಮತ್ತು ನಮ್ಮ ತಂಡದ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಲು ಇದನ್ನು ಬಳಸಿ.', doneTrack: 'ನನ್ನ ಅರ್ಜಿ ನೋಡಿ', doneCopy: 'ID ನಕಲಿಸಿ', copied: 'ನಕಲಾಯಿತು',
      trkTitle: 'ನಿಮ್ಮ ಅರ್ಜಿ', notFound: '{id} ಸಿಗಲಿಲ್ಲ. ID ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.', loading: 'ನಿಮ್ಮ ಅರ್ಜಿ ಹುಡುಕಲಾಗುತ್ತಿದೆ…',
      st_submitted: 'ಸಲ್ಲಿಸಲಾಗಿದೆ', st_review: 'ಪರಿಶೀಲನೆಯಲ್ಲಿ', st_decision: 'ನಿರ್ಧಾರ',
      s_review: 'ಪರಿಶೀಲನೆಯಲ್ಲಿ', s_APPROVED: 'ಆಯ್ಕೆಯಾಗಿದೆ', s_CONDITIONAL: 'ಷರತ್ತುಗಳೊಂದಿಗೆ ಆಯ್ಕೆ', s_WAITLIST: 'ಕಾಯುವ ಪಟ್ಟಿಯಲ್ಲಿ', s_HOLD: 'ನಮಗೆ ಕೆಲವು ಮಾಹಿತಿ ಬೇಕು', s_REJECTED: 'ಈ ಬಾರಿ ಆಯ್ಕೆಯಾಗಿಲ್ಲ', s_WITHDRAWN: 'ಹಿಂಪಡೆಯಲಾಗಿದೆ',
      reviewNote: 'ನಮ್ಮ ವಿಸ್ತರಣಾ ತಂಡ ನಿಮ್ಮ ಅರ್ಜಿಯನ್ನು ಪರಿಶೀಲಿಸುತ್ತಿದೆ. ಪ್ರಶ್ನೆಗಳು ಮತ್ತು ನಿರ್ಧಾರ ಇಲ್ಲೇ ಕಾಣಿಸುತ್ತವೆ.',
      msgFromTeam: 'Veloce ನಿಂದ ಸಂದೇಶ', questions: 'ನಮ್ಮ ತಂಡದ ಪ್ರಶ್ನೆಗಳು', noQuestions: 'ಇನ್ನೂ ಪ್ರಶ್ನೆಗಳಿಲ್ಲ. ಇಲ್ಲೇ ಕೇಳುತ್ತೇವೆ.',
      answerBtn: 'ಉತ್ತರ ಕಳುಹಿಸಿ', answered: 'ಉತ್ತರಿಸಲಾಗಿದೆ', yes: 'ಹೌದು', no: 'ಇನ್ನೂ ಇಲ್ಲ', replyPh: 'ನಿಮ್ಮ ಉತ್ತರ ಬರೆಯಿರಿ', yourAnswer: 'ನಿಮ್ಮ ಉತ್ತರ',
      sendNote: 'ತಂಡಕ್ಕೆ ಸಂದೇಶ ಕಳುಹಿಸಿ', sendNoteBtn: 'ಕಳುಹಿಸಿ', withdraw: 'ಅರ್ಜಿ ಹಿಂಪಡೆಯಿರಿ', withdrawConfirm: 'ನಿಮ್ಮ ಅರ್ಜಿ ಹಿಂಪಡೆಯಬೇಕೆ? ಇದನ್ನು ರದ್ದುಗೊಳಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ.',
      myApps: 'ಈ ಸಾಧನದಲ್ಲಿ ನಿಮ್ಮ ಅರ್ಜಿಗಳು', estimate: 'ನಿಮ್ಮ ಈಗಿನ ಅಂದಾಜು',
      sync_live: 'ಲೈವ್', sync_local: 'ಈ ಸಾಧನ', sync_offline: 'ಆಫ್‌ಲೈನ್ · ನಂತರ ಸಿಂಕ್', sync_connecting: 'ಸಂಪರ್ಕಿಸುತ್ತಿದೆ…',
      ws: 'ವರ್ಕ್‌ಸ್ಪೇಸ್ {ws}', reqName: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಹೆಸರು ನಮೂದಿಸಿ.', reqInv: 'ನೀವು ಎಷ್ಟು ಹೂಡಿಕೆ ಮಾಡಬಹುದು ಎಂದು ತಿಳಿಸಿ.', sent: 'Veloce ತಂಡಕ್ಕೆ ಕಳುಹಿಸಲಾಗಿದೆ'
    }
  };
  var LANGS = { en: 'English', hi: 'Hindi', kn: 'Kannada' };
  var CITY_LOCAL = {
    hi: { 'Bengaluru': 'बेंगलुरु', 'Mysuru': 'मैसूरु', 'Mangaluru': 'मंगलुरु', 'Hubballi-Dharwad': 'हुब्बल्ली-धारवाड़', 'Belagavi': 'बेलगावी', 'Tumakuru': 'तुमकुरु', 'Davanagere': 'दावणगेरे' },
    kn: { 'Bengaluru': 'ಬೆಂಗಳೂರು', 'Mysuru': 'ಮೈಸೂರು', 'Mangaluru': 'ಮಂಗಳೂರು', 'Hubballi-Dharwad': 'ಹುಬ್ಬಳ್ಳಿ-ಧಾರವಾಡ', 'Belagavi': 'ಬೆಳಗಾವಿ', 'Tumakuru': 'ತುಮಕೂರು', 'Davanagere': 'ದಾವಣಗೆರೆ' }
  };

  var st = { lang: 'en', pin: '', gate: null, step: 1, f: { name: '', experience: '', business: '', investment: '', space: 'Not yet identified', floor: 'Not known', size: '', launch: 4, notes: '', language: '' } };
  try { var sl = localStorage.getItem('veloce.lang'); if (T[sl]) st.lang = sl; } catch (e) { /* ignore */ }
  var qsl = new URLSearchParams(location.search).get('lang');
  if (T[qsl]) st.lang = qsl;
  var qst = new URLSearchParams(location.search).get('theme');
  if (qst === 'light' || qst === 'dark') document.documentElement.setAttribute('data-theme', qst);

  function t(k, v) {
    var s = (T[st.lang] && T[st.lang][k] !== undefined) ? T[st.lang][k] : (T.en[k] !== undefined ? T.en[k] : k);
    return String(s).replace(/\{(\w+)\}/g, function (_, x) { return v && v[x] !== undefined ? v[x] : ''; });
  }
  function cityName(c) { return (CITY_LOCAL[st.lang] && CITY_LOCAL[st.lang][c]) || c; }
  function langCls() { return st.lang === 'en' ? '' : st.lang; }

  // ------------------------------------------------------------------ plan (from the dashboard, or Veloce's default plan)
  var SAMPLE_PLAN = (function () {
    var d = L.parseSheets(window.SAMPLE_SHEETS).data;
    return { territories: d.territories, stores: d.stores, takenPins: {}, rubric: null };
  })();
  function plan() {
    var p = S.plan();
    var out = p && p.territories && p.territories.length ? p : SAMPLE_PLAN;
    E.setRubric(out.rubric || E.DEFAULT_RUBRIC);
    return out;
  }

  // ------------------------------------------------------------------ pin gate
  function gate(pin) {
    if (!/^\d{6}$/.test(pin)) return { kind: 'invalid' };
    var city = H.cityFromPin(pin);
    if (!city) return { kind: 'notKA' };
    var p = plan();
    var storePins = {}; p.stores.forEach(function (s) { storePins[s.pin] = s; });
    var taken = p.takenPins || {};
    var ter = p.territories.filter(function (x) { return x.pins.indexOf(pin) >= 0; })[0];
    function alts(pool) {
      var out = [];
      pool.forEach(function (x) {
        if (x.slots <= 0) return;
        x.pins.forEach(function (q) { if (q !== pin && !storePins[q] && !taken[q] && out.every(function (o) { return o.pin !== q; })) out.push({ pin: q, ter: x }); });
      });
      return out.sort(function (a, b) { return Math.abs(+a.pin - +pin) - Math.abs(+b.pin - +pin); }).slice(0, 3);
    }
    var cityTers = p.territories.filter(function (x) { return x.city === city && x.slots > 0; });
    var near = alts(ter ? [ter].concat(cityTers.filter(function (x) { return x !== ter; })) : cityTers);
    if (storePins[pin]) return { kind: 'store', city: city, store: storePins[pin], alts: near };
    if (taken[pin]) return { kind: 'taken', city: city, alts: near };
    if (ter && ter.slots > 0) return { kind: 'open', city: city, ter: ter };
    if (ter) return { kind: 'full', city: city, alts: near };
    if (cityTers.length) return { kind: 'outside', city: city, alts: near };
    return { kind: 'nocity', city: city, alts: [] };
  }

  // ------------------------------------------------------------------ live assessment
  function draftApp(id, f, pin) {
    var city = H.cityFromPin(pin);
    var a = E.normaliseApplication({ id: id, name: f.name, city: city, state: 'Karnataka', pin: pin, investment: f.investment, experience: f.experience, business: f.business,
      space: f.space, size: f.space === 'Not yet identified' ? '' : f.size, floor: f.space === 'Not yet identified' ? 'Not known' : f.floor, launch: f.launch, language: f.language || LANGS[st.lang], notes: f.notes });
    return a;
  }
  function assess(app) {
    var p = plan();
    var a = Object.assign({}, app, { id: 'PREVIEW' });
    var data = { applications: [a], territories: p.territories, stores: p.stores };
    var r = E.evaluate(data, { today: new Date() }).results[0];
    var path = E.pathToYes(data, 'PREVIEW', { today: new Date() });
    return { r: r, band: band(r.status, r.score), tips: tips(path, r) };
  }
  function band(status, score) {
    if (status === 'REJECTED') return 'low';
    if (score >= 78 && status === 'APPROVED') return 'strong';
    if (score >= 62) return 'good';
    if (score >= 45) return 'fair';
    return 'low';
  }
  var ORDER = { strong: 1, good: 2, fair: 3, low: 4 };
  function tips(path, r) {
    var cur = band(r.status, r.score);
    return (path.options || []).filter(function (o) { return o.side !== 'brand'; }).map(function (o) {
      var b = band(o.status, o.score), p = o.patch || {}, txt;
      if (o.side === 'combined') txt = t('tip_all');
      else if (p.clearedSignals) {
        var k = p.clearedSignals[p.clearedSignals.length - 1];
        txt = t({ loan: 'tip_loan', uncertain: 'tip_commit', conflict: 'tip_conflict', absentee: 'tip_fulltime' }[k] || 'tip_commit');
      }
      else if (p.investment !== undefined) txt = t('tip_funds', { amt: Math.round(p.investment) });
      else if (p.floor || p.space) txt = t('tip_space');
      else if (p.size) txt = t('tip_size');
      else if (p.pin) txt = t('tip_pin', { pin: p.pin });
      else if (p.launchMonths) txt = t('tip_launch', { n: p.launchMonths });
      else if (p.city) txt = t('tip_city');
      else return null;
      return { text: txt, band: b, gain: o.score - r.score, combo: o.side === 'combined', better: ORDER[b] < ORDER[cur] || o.score - r.score >= 3 };
    }).filter(function (x) { return x && x.better; })
      .sort(function (x, y) { return (x.combo - y.combo) || ORDER[x.band] - ORDER[y.band] || y.gain - x.gain; })
      .filter(function (x, i, arr) { return !x.combo || arr.filter(function (y) { return !y.combo; }).length > 1; }) // "all of the above" only when there are several
      .slice(0, 5);
  }

  // ------------------------------------------------------------------ rendering
  function setLang(l) {
    st.lang = l;
    try { localStorage.setItem('veloce.lang', l); } catch (e) { /* ignore */ }
    document.documentElement.lang = l;
    document.body.classList.remove('lang-hi', 'lang-kn');
    if (l !== 'en') document.body.classList.add('lang-' + l);
    document.querySelectorAll('#langs button').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-lang') === l); });
    document.querySelectorAll('[data-t]').forEach(function (el) { el.textContent = t(el.getAttribute('data-t')); });
    route();
  }
  function syncBadge() {
    var s = S.status();
    var el = $('sync');
    el.className = 'sync-badge ' + s.mode;
    el.textContent = t('sync_' + s.mode);
    el.title = s.live ? 'Google Sheets database' : 'Saved on this device';
    $('footWs').textContent = s.ws !== 'public' ? t('ws', { ws: s.ws }) : '';
    $('toDash').href = S.dashboardUrl();
  }
  function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }

  function route() {
    syncBadge();
    var h = location.hash.replace(/^#\/?/, '');
    var parts = h.split('/');
    if (parts[0] === 'apply' && st.pin) return renderApply();
    if (parts[0] === 'done' && parts[1]) return renderDone(parts[1]);
    if (parts[0] === 'track') return renderTrack(parts[1] || '');
    renderHome();
  }

  // ---------------- home + pin gate
  function renderHome() {
    var my = myApps();
    $('pt').innerHTML =
      '<section class="pt-hero ' + langCls() + '"><div class="pt-hero-copy">' +
      '<span class="eyebrow">' + esc(t('heroEyebrow')) + '</span><h1>' + esc(t('heroTitle')) + '</h1><p class="lead">' + esc(t('heroSub')) + '</p>' +
      '<ul class="pt-perks"><li>' + esc(t('perk1')) + '</li><li>' + esc(t('perk2')) + '</li><li>' + esc(t('perk3')) + '</li></ul></div>' +
      '<div class="pt-card pt-pin"><h2>' + esc(t('pinTitle')) + '</h2><p class="muted">' + esc(t('pinHint')) + '</p>' +
      '<form id="pinForm" class="pt-pin-row"><input id="pinIn" inputmode="numeric" maxlength="6" placeholder="560001" value="' + esc(st.pin) + '" aria-label="Pin code"><button class="btn primary" type="submit">' + esc(t('pinBtn')) + '</button></form>' +
      '<div id="gateOut"></div>' +
      '<div class="pt-track-mini"><b>' + esc(t('trackTitle')) + '</b><form id="miniTrack" class="pt-pin-row"><input id="miniId" placeholder="' + esc(t('trackPh')) + '" aria-label="Application ID"><button class="btn" type="submit">' + esc(t('trackBtn')) + '</button></form>' +
      (my.length ? '<div class="pt-my">' + my.map(function (id) { return '<a href="#/track/' + esc(id) + '">' + esc(id) + '</a>'; }).join('') + '</div>' : '') + '</div>' +
      '</div></section>';
    $('pinForm').addEventListener('submit', function (e) { e.preventDefault(); checkPin($('pinIn').value.trim()); });
    $('miniTrack').addEventListener('submit', function (e) { e.preventDefault(); var v = $('miniId').value.trim().toUpperCase(); if (v) go('#/track/' + v); });
    if (st.pin && st.gate) renderGate();
    setTimeout(function () { var i = $('pinIn'); if (i && !st.pin) i.focus({ preventScroll: true }); }, 50);
  }
  function checkPin(pin) {
    st.pin = pin.replace(/\D/g, '');
    st.gate = gate(st.pin);
    renderGate();
  }
  function renderGate() {
    var g = st.gate, out = $('gateOut');
    if (!out) return;
    var html = '';
    if (g.kind === 'invalid') html = '<div class="pt-gate warn">' + esc(t('pinInvalid')) + '</div>';
    else if (g.kind === 'notKA') html = '<div class="pt-gate warn">' + esc(t('notKA')) + '</div>';
    else if (g.kind === 'open') {
      html = '<div class="pt-gate ok"><b>' + esc(t('openHere', { city: cityName(g.city), pin: st.pin })) + '</b><span>' + esc(t('openSub', { ter: g.ter.id, prio: t(g.ter.priority), slots: g.ter.slots })) + '</span>' +
        '<button class="btn primary" data-go="apply">' + esc(t('continueBtn')) + ' →</button></div>';
    } else {
      var msg = g.kind === 'store' ? t('storeHere', { pin: st.pin, store: g.store.id }) : g.kind === 'taken' ? t('takenHere', { pin: st.pin }) : g.kind === 'full' ? t('full', { pin: st.pin }) : g.kind === 'outside' ? t('outside', { pin: st.pin }) : t('noCity', { city: cityName(g.city) });
      html = '<div class="pt-gate stop"><b>' + esc(msg) + '</b>';
      if (g.alts && g.alts.length) {
        html += '<span class="pt-alt-title">' + esc(t('altTitle')) + '</span><div class="pt-alts">' + g.alts.map(function (a) {
          return '<button class="pt-alt" data-pin="' + a.pin + '"><b>' + a.pin + '</b><span>' + esc(cityName(a.ter.city)) + ' · ' + esc(a.ter.id) + ' · ' + esc(t(a.ter.priority)) + '</span><em>' + esc(t('altPick', { pin: a.pin })) + '</em></button>';
        }).join('') + '</div>';
      }
      html += '<button class="btn ghost sm" data-go="apply">' + esc(t('waitlistBtn')) + '</button></div>';
    }
    out.innerHTML = html;
  }

  // ---------------- application wizard
  function renderApply() {
    var f = st.f, city = H.cityFromPin(st.pin);
    if (!f.language) f.language = LANGS[st.lang];
    var cost = E.ASSUMPTIONS.setupCost[(E.CITIES[city] || { tier: 2 }).tier];
    var steps = [t('step1'), t('step2'), t('step3')];
    var html = '<section class="pt-apply ' + langCls() + '"><div class="pt-form pt-card">' +
      '<div class="pt-steps">' + steps.map(function (s, i) { return '<span class="' + (i + 1 === st.step ? 'on' : i + 1 < st.step ? 'done' : '') + '"><i>' + (i + 1) + '</i>' + esc(s) + '</span>'; }).join('') + '</div>' +
      '<div class="pt-where"><span>' + esc(t('city')) + ': <b>' + esc(cityName(city)) + ' · ' + esc(st.pin) + '</b></span><a href="#/">' + esc(t('change')) + '</a></div>';
    if (st.step === 1) {
      html += field(t('name'), '<input data-f="name" value="' + esc(f.name) + '" placeholder="' + esc(t('namePh')) + '" autocomplete="name">') +
        field(t('exp'), '<input data-f="experience" type="number" min="0" max="50" value="' + esc(f.experience) + '" placeholder="0">', t('expHint')) +
        field(t('biz'), '<input data-f="business" value="' + esc(f.business) + '" placeholder="' + esc(t('bizPh')) + '">');
    } else if (st.step === 2) {
      html += field(t('inv'), '<div class="pt-money"><input data-f="investment" type="number" min="0" step="0.5" value="' + esc(f.investment) + '" placeholder="' + cost + '"><span>' + esc(t('invUnit')) + '</span></div>' +
        '<input type="range" min="5" max="80" step="1" data-f="investment" value="' + esc(f.investment || cost) + '" class="pt-range" aria-label="' + esc(t('inv')) + '">', t('invHint', { city: cityName(city), cost: cost })) +
        field(t('space'), seg('space', ['Owned', 'Rented', 'Not yet identified'], f.space));
      if (f.space !== 'Not yet identified') html += field(t('floor'), seg('floor', ['Ground', 'Mall unit', 'Upper', 'Not known'], f.floor)) + field(t('size'), '<input data-f="size" type="number" min="0" step="10" value="' + esc(f.size) + '" placeholder="450">');
    } else {
      html += field(t('launch'), '<div class="pt-launch"><input type="range" min="1" max="18" step="1" data-f="launch" value="' + esc(f.launch) + '" class="pt-range"><b id="launchVal">' + esc(t('months', { n: f.launch })) + '</b></div>') +
        field(t('lang'), seg('language', ['English', 'Hindi', 'Kannada'], f.language, { English: 'English', Hindi: 'हिन्दी', Kannada: 'ಕನ್ನಡ' })) +
        field(t('notes'), '<textarea data-f="notes" rows="3" placeholder="' + esc(t('notesPh')) + '">' + esc(f.notes) + '</textarea>');
    }
    html += '<p class="pt-err" id="ferr"></p><div class="pt-nav">' + (st.step > 1 ? '<button class="btn" data-step="-1">' + esc(t('back')) + '</button>' : '<span></span>') +
      (st.step < 3 ? '<button class="btn primary" data-step="1">' + esc(t('next')) + ' →</button>' : '<button class="btn primary" id="submitApp">' + esc(t('submit')) + '</button>') + '</div></div>' +
      '<aside class="pt-chance pt-card" id="chance"></aside></section>';
    $('pt').innerHTML = html;
    renderChance();
  }
  function field(label, control, hint) { return '<label class="pt-field"><span>' + esc(label) + '</span>' + control + (hint ? '<small>' + esc(hint) + '</small>' : '') + '</label>'; }
  function seg(f, opts, cur, labels) {
    return '<div class="pt-seg" data-seg="' + f + '">' + opts.map(function (o) { return '<button type="button" data-v="' + esc(o) + '" class="' + (o === cur ? 'on' : '') + '">' + esc(labels ? labels[o] : t(o)) + '</button>'; }).join('') + '</div>';
  }
  var chanceTimer;
  function renderChance() {
    clearTimeout(chanceTimer);
    chanceTimer = setTimeout(function () {
      var box = $('chance'); if (!box) return;
      var res = assess(draftApp('PREVIEW', st.f, st.pin));
      box.innerHTML = chanceHtml(res, true);
    }, 120);
  }
  function chanceHtml(res, withTips) {
    var r = res.r, b = res.band;
    var html = '<h3>' + esc(t('chanceTitle')) + '</h3><div class="pt-band band-' + b + '"><span class="pt-gauge"><i style="width:' + Math.max(6, r.score) + '%"></i></span><b>' + esc(t('band_' + b)) + '</b><small>' + esc(t('bs_' + b)) + '</small></div>';
    html += '<h4>' + esc(t('howScore')) + '</h4><div class="pt-bd">' + r.breakdown.filter(function (x) { return x.max; }).map(function (x) {
      return '<div><span>' + esc(t('f_' + x.k)) + '</span><i><em style="width:' + Math.max(0, x.pts / x.max * 100) + '%"></em></i></div>';
    }).join('') + '</div>';
    if (withTips) {
      html += '<h4>' + esc(t('improve')) + '</h4>' + (res.tips.length ? '<ul class="pt-tips">' + res.tips.map(function (x) { return '<li><span>' + esc(x.text) + '</span><b class="band-' + x.band + '">→ ' + esc(t('band_' + x.band)) + '</b></li>'; }).join('') + '</ul>' : '<p class="muted small">' + esc(t(b === 'strong' ? 'noTips' : 'noTipsSoft')) + '</p>');
    }
    return html + '<p class="pt-fine">' + esc(t('fineprint')) + '</p>';
  }
  function submitApp() {
    var f = st.f;
    if (!f.name.trim()) { st.step = 1; renderApply(); $('ferr').textContent = t('reqName'); return; }
    if (f.investment === '' || isNaN(+f.investment)) { st.step = 2; renderApply(); $('ferr').textContent = t('reqInv'); return; }
    var app = draftApp('', f, st.pin);
    delete app.id;
    app.cityRaw = app.city;
    var id = S.submit(app);
    try { var mine = JSON.parse(localStorage.getItem('veloce.myApps') || '[]'); mine.unshift(id); localStorage.setItem('veloce.myApps', JSON.stringify(mine.slice(0, 10))); } catch (e) { /* ignore */ }
    st.f = { name: '', experience: '', business: '', investment: '', space: 'Not yet identified', floor: 'Not known', size: '', launch: 4, notes: '', language: '' };
    st.step = 1;
    go('#/done/' + id);
  }
  function myApps() { try { return JSON.parse(localStorage.getItem('veloce.myApps') || '[]').filter(function (id) { return S.app(id); }); } catch (e) { return []; } }

  // ---------------- done
  function renderDone(id) {
    $('pt').innerHTML = '<section class="pt-done pt-card ' + langCls() + '"><div class="pt-check">✓</div><h1>' + esc(t('doneTitle')) + '</h1><p class="muted">' + esc(t('doneId')) + '</p>' +
      '<div class="pt-id">' + esc(id) + '</div><p>' + esc(t('doneSave')) + '</p><div class="pt-nav center"><button class="btn" id="copyId">' + esc(t('doneCopy')) + '</button><a class="btn primary" href="#/track/' + esc(id) + '">' + esc(t('doneTrack')) + ' →</a></div></section>';
    $('copyId').addEventListener('click', function () { var b = this; if (navigator.clipboard) navigator.clipboard.writeText(id).catch(function () { /* clipboard blocked: the ID stays on screen */ }); b.textContent = t('copied'); });
  }

  // ---------------- track
  var STATUS_BAND = { APPROVED: 'strong', CONDITIONAL: 'good', WAITLIST: 'fair', HOLD: 'fair', REJECTED: 'low', WITHDRAWN: 'low' };
  function renderTrack(id) {
    id = String(id || '').toUpperCase();
    if (!id) {
      var my = myApps();
      $('pt').innerHTML = '<section class="pt-card pt-narrow ' + langCls() + '"><h2>' + esc(t('trackTitle')) + '</h2><form id="trk" class="pt-pin-row"><input id="trkId" placeholder="' + esc(t('trackPh')) + '"><button class="btn primary">' + esc(t('trackBtn')) + '</button></form>' +
        (my.length ? '<p class="muted small" style="margin-top:14px">' + esc(t('myApps')) + '</p><div class="pt-my">' + my.map(function (x) { return '<a href="#/track/' + esc(x) + '">' + esc(x) + '</a>'; }).join('') + '</div>' : '') + '</section>';
      $('trk').addEventListener('submit', function (e) { e.preventDefault(); var v = $('trkId').value.trim().toUpperCase(); if (v) go('#/track/' + v); });
      return;
    }
    var a = S.app(id);
    if (!a) {
      var waiting = S.status().mode === 'connecting';
      $('pt').innerHTML = '<section class="pt-card pt-narrow ' + langCls() + '"><p>' + esc(waiting ? t('loading') : t('notFound', { id: id })) + '</p><a class="btn" href="#/track">' + esc(t('track')) + '</a></section>';
      return;
    }
    var d = S.decision(id);
    var status = a.withdrawn ? 'WITHDRAWN' : d ? d.status : 'review';
    var stepState = [true, true, !!d || a.withdrawn];
    var html = '<section class="pt-track ' + langCls() + '"><div class="pt-card"><div class="pt-track-head"><div><small class="muted">' + esc(t('trkTitle')) + '</small><h1>' + esc(a.name || id) + '</h1><span class="muted">' + esc(id) + ' · ' + esc(cityName(a.city)) + ' ' + esc(a.pin) + '</span></div>' +
      '<span class="pt-status band-' + (STATUS_BAND[status] || 'neutral') + '">' + esc(t('s_' + status)) + '</span></div>' +
      '<div class="pt-timeline">' + [t('st_submitted'), t('st_review'), t('st_decision')].map(function (s, i) { return '<span class="' + (stepState[i] ? 'done' : '') + '"><i>' + (stepState[i] ? '✓' : i + 1) + '</i>' + esc(s) + '</span>'; }).join('') + '</div>';
    if (d && M) {
      var msg = M.draft(d, LANGS[st.lang]);
      html += '<div class="pt-msg"><b>' + esc(t('msgFromTeam')) + '</b><div class="bubble ' + langCls() + '">' + esc(msg.text) + '</div></div>';
    } else if (!a.withdrawn) {
      html += '<p class="pt-review">' + esc(t('reviewNote')) + '</p>';
    }
    html += '</div>';

    // questions
    var qs = a.messages.filter(function (m) { return m.from === 'team'; });
    html += '<div class="pt-card"><h2>' + esc(t('questions')) + '</h2>';
    if (!qs.length) html += '<p class="muted">' + esc(t('noQuestions')) + '</p>';
    qs.forEach(function (m) {
      var reply = a.messages.filter(function (x) { return x.replyTo === m.id; })[0];
      html += '<div class="pt-q' + (m.answered ? ' answered' : '') + '"><p class="pt-q-text">' + esc(Q.text(m.key, LANGS[st.lang], m.text)) + '</p>';
      if (m.answered) {
        var qt = (Q.Q[m.key] || {}).type, shown = reply && reply.text ? reply.text : '';
        if (qt === 'yesno') shown = /Yes$/.test(shown) ? t('yes') : t('no'); // the stored summary is for the team; show the applicant their own language
        html += '<p class="pt-q-ans">✓ ' + esc(t('answered')) + (shown ? ': ' + esc(shown) : '') + '</p>';
      }
      else if (!a.withdrawn) html += answerWidget(m, a);
      html += '</div>';
    });
    if (!a.withdrawn) html += '<div class="pt-q note"><label class="pt-field"><span>' + esc(t('sendNote')) + '</span><textarea id="noteTxt" rows="2" placeholder="' + esc(t('replyPh')) + '"></textarea></label><button class="btn sm" id="sendNote">' + esc(t('sendNoteBtn')) + '</button></div>';
    html += '</div>';

    if (!d && !a.withdrawn) html += '<div class="pt-card"><h2>' + esc(t('estimate')) + '</h2>' + chanceHtml(assess(a), true) + '</div>';
    if (!a.withdrawn) html += '<div class="pt-withdraw"><button class="btn ghost sm" id="withdrawBtn">' + esc(t('withdraw')) + '</button></div>';
    html += '</section>';
    $('pt').innerHTML = html;
    wireTrack(a);
  }
  function answerWidget(m, a) {
    var q = Q.Q[m.key] || Q.Q.custom, w = '<div class="pt-ans" data-q="' + m.id + '" data-key="' + esc(m.key) + '">';
    if (q.type === 'pin') w += '<input data-a="pin" inputmode="numeric" maxlength="6" value="' + esc(a.pin) + '">';
    else if (q.type === 'number') w += '<div class="pt-money"><input data-a="num" type="number" min="0" step="0.5" value="' + esc(a[q.field] === null || a[q.field] === undefined ? '' : a[q.field]) + '"><span>' + esc(q.unit === 'lakh' ? t('invUnit') : q.unit === 'months' ? t('months', { n: '' }).trim() : '') + '</span></div>';
    else if (q.type === 'space') w += seg('aspace', ['Owned', 'Rented', 'Not yet identified'], a.space) + seg('afloor', ['Ground', 'Mall unit', 'Upper', 'Not known'], a.floor) + '<input data-a="size" type="number" min="0" step="10" placeholder="' + esc(t('size')) + '" value="' + esc(a.size || '') + '">';
    else if (q.type === 'yesno') return w + '<div class="pt-nav"><button class="btn primary sm" data-yn="yes">' + esc(t('yes')) + '</button><button class="btn sm" data-yn="no">' + esc(t('no')) + '</button></div></div>';
    else w += '<textarea data-a="text" rows="2" placeholder="' + esc(t('replyPh')) + '"></textarea>';
    return w + '<button class="btn primary sm" data-send>' + esc(t('answerBtn')) + '</button></div>';
  }
  function wireTrack(a) {
    document.querySelectorAll('.pt-ans').forEach(function (box) {
      var msgId = box.getAttribute('data-q'), key = box.getAttribute('data-key'), q = Q.Q[key] || Q.Q.custom;
      box.addEventListener('click', function (e) {
        var sb = e.target.closest('.pt-seg button');
        if (sb) { sb.parentNode.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b === sb); }); return; }
        var yn = e.target.closest('[data-yn]');
        if (yn) {
          var yes = yn.getAttribute('data-yn') === 'yes';
          var note = key === 'loan' ? (yes ? 'Loan sanctioned.' : 'Loan not yet sanctioned.') : key === 'commitment' ? (yes ? 'Will run full-time.' : 'May not run full-time.') : (yes ? 'Yes.' : 'Not yet.');
          var patch = yes ? { clearedSignals: q.signals || [], noteAppend: note } : { noteAppend: note };
          var topic = key === 'loan' ? 'Loan sanctioned: ' : key === 'commitment' ? 'Will run full-time: ' : '';
          S.answer(a.id, msgId, patch, topic + (yes ? 'Yes' : 'Not yet'));
          return;
        }
        if (!e.target.closest('[data-send]')) return;
        var patch2 = {}, summary = '';
        if (q.type === 'pin') {
          var pin = H.normPin(box.querySelector('[data-a="pin"]').value);
          if (!pin) return;
          patch2 = { pin: pin, pinRaw: pin }; var c = H.cityFromPin(pin); if (c) { patch2.city = c; patch2.cityRaw = c; }
          summary = 'Pin code: ' + pin;
        } else if (q.type === 'number') {
          var v = box.querySelector('[data-a="num"]').value;
          if (v === '') return;
          patch2[q.field] = +v;
          summary = { investment: 'Investment: ₹' + v + ' L', launchMonths: 'Target launch: ' + v + ' months', experience: 'Retail experience: ' + v + ' yrs' }[q.field];
        } else if (q.type === 'space') {
          var sp = box.querySelector('[data-seg="aspace"] .on'), fl = box.querySelector('[data-seg="afloor"] .on'), sz = box.querySelector('[data-a="size"]').value;
          patch2 = { space: sp ? sp.getAttribute('data-v') : a.space, floor: fl ? fl.getAttribute('data-v') : a.floor, size: sz ? +sz : null };
          if (patch2.space === 'Not yet identified') { patch2.floor = 'Not known'; patch2.size = null; }
          summary = 'Space: ' + patch2.space + (patch2.space !== 'Not yet identified' ? ', ' + patch2.floor + (patch2.size ? ', ' + patch2.size + ' sq ft' : '') : '');
        } else {
          var txt = box.querySelector('[data-a="text"]').value.trim();
          if (!txt) return;
          patch2 = { noteAppend: txt }; summary = txt;
        }
        S.answer(a.id, msgId, patch2, summary);
      });
    });
    var sn = $('sendNote');
    if (sn) sn.addEventListener('click', function () {
      var txt = $('noteTxt').value.trim();
      if (!txt) return;
      S.answer(a.id, null, { noteAppend: txt }, txt);
      toast(t('sent'));
    });
    var wd = $('withdrawBtn');
    if (wd) wd.addEventListener('click', function () { if (confirm(t('withdrawConfirm'))) S.withdraw(a.id); });
  }
  function toast(msg) {
    var el = document.createElement('div'); el.className = 'toast'; el.textContent = msg; document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 2600);
  }

  // ------------------------------------------------------------------ events
  document.addEventListener('click', function (e) {
    var b;
    if ((b = e.target.closest('#langs [data-lang]'))) { setLang(b.getAttribute('data-lang')); return; }
    if ((b = e.target.closest('.pt-alt'))) { $('pinIn').value = b.getAttribute('data-pin'); checkPin(b.getAttribute('data-pin')); return; }
    if ((b = e.target.closest('[data-go="apply"]'))) { st.step = 1; go('#/apply'); return; }
    if ((b = e.target.closest('.pt-form .pt-seg button'))) {
      var f = b.parentNode.getAttribute('data-seg');
      st.f[f] = b.getAttribute('data-v');
      if (f === 'space') renderApply();
      else { b.parentNode.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); }); renderChance(); }
      return;
    }
    if ((b = e.target.closest('[data-step]'))) {
      var dir = +b.getAttribute('data-step');
      if (dir > 0 && st.step === 1 && !st.f.name.trim()) { $('ferr').textContent = t('reqName'); return; }
      if (dir > 0 && st.step === 2 && (st.f.investment === '' || isNaN(+st.f.investment))) { $('ferr').textContent = t('reqInv'); return; }
      st.step = Math.min(3, Math.max(1, st.step + dir)); renderApply(); window.scrollTo({ top: 0, behavior: 'smooth' }); return;
    }
    if ((b = e.target.closest('#submitApp'))) { submitApp(); return; }
  });
  document.addEventListener('input', function (e) {
    var el = e.target.closest('.pt-form [data-f]');
    if (!el) return;
    var f = el.getAttribute('data-f');
    st.f[f] = el.value;
    if (f === 'investment') document.querySelectorAll('[data-f="investment"]').forEach(function (x) { if (x !== el) x.value = el.value; });
    if (f === 'launch') { st.f.launch = +el.value; var lv = $('launchVal'); if (lv) lv.textContent = t('months', { n: el.value }); }
    renderChance();
  });
  window.addEventListener('hashchange', route);
  S.subscribe(function (why) {
    syncBadge();
    if (why === 'mode') return;
    var h = location.hash;
    var active = document.activeElement;
    if (active && /INPUT|TEXTAREA/.test(active.tagName) && active.value) return; // don't wipe what someone is typing
    if (/^#\/track\//.test(h)) route();
    else if ((h === '' || h === '#/') && st.gate && why === 'remote') { st.gate = gate(st.pin); renderGate(); } // plan or taken pins changed
    else if (h === '#/apply' && why === 'remote') renderChance(); // rubric may have changed
  });

  setLang(st.lang);

  // Demo links: ?pin=560034 runs the pin check; &prefill opens a filled-in application at step 2
  var qsp = new URLSearchParams(location.search);
  if (/^\d{6}$/.test(qsp.get('pin') || '')) {
    checkPin(qsp.get('pin'));
    if (qsp.has('prefill')) {
      st.f = { name: 'Kavya Rao', experience: '4', business: 'Runs a gift and stationery shop', investment: '28', space: 'Rented', floor: 'Upper', size: '500', launch: 4, notes: '', language: LANGS[st.lang] };
      st.step = +qsp.get('prefill') || 2;
      go('#/apply');
    }
  }
})();
