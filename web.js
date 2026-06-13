let deferredInstallPrompt = null;

function updateInstallButton() {
  const installButton = document.querySelector(".install-app-btn");
  if (!installButton) return;

  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  installButton.classList.toggle("show", !isStandalone);
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  updateInstallButton();
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  updateInstallButton();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
}

document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");
  const translations = {
    en: {
      label: "Language",
      menu: "Menu",
      close: "Close",
      hero_location: "Saharsa, Bihar",
      hero_title: "Welcome to Lagma Village",
      hero_text: "A historic and vibrant village shaped by agriculture, education, temples, ponds, and community spirit.",
      hero_primary: "Explore Lagma",
      hero_secondary: "Village Services",
      achievements_label: "Achievements",
      achievements_title: "Proud stories from the village",
      achievements_text: "Lagma's strength is visible in its students, public service, farming families, and residents who continue to contribute to village life from near and far.",
      gold_badge: "Gold Medal | Sruti Kumari | Weightlifting",
      achievement_medal: "<strong>Weightlifting:</strong> Sruti Kumari won a gold medal and made Lagma proud.",
      achievement_education: "<strong>Education:</strong> Students continue to perform well in exams and careers.",
      achievement_service: "<strong>Service:</strong> Many villagers contribute through government and private work.",
      achievement_community: "<strong>Community:</strong> People come together for festivals, development, and support."
    },
    hi: {
      label: "भाषा",
      menu: "मेनू",
      close: "बंद करें",
      hero_location: "सहरसा, बिहार",
      hero_title: "लगमा गांव में आपका स्वागत है",
      hero_text: "खेती, शिक्षा, मंदिर, तालाब और सामुदायिक भावना से जुड़ा एक ऐतिहासिक गांव।",
      hero_primary: "लगमा देखें",
      hero_secondary: "गांव की सेवाएं",
      achievements_label: "उपलब्धियां",
      achievements_title: "गांव की गौरव भरी कहानियां",
      achievements_text: "लगमा की ताकत उसके विद्यार्थियों, जनसेवा, किसान परिवारों और गांव से जुड़े लोगों में दिखती है।",
      gold_badge: "स्वर्ण पदक | श्रुति कुमारी | वेटलिफ्टिंग",
      achievement_medal: "<strong>वेटलिफ्टिंग:</strong> श्रुति कुमारी ने स्वर्ण पदक जीतकर लगमा का नाम रोशन किया।",
      achievement_education: "<strong>शिक्षा:</strong> विद्यार्थी परीक्षा और करियर में अच्छा प्रदर्शन कर रहे हैं।",
      achievement_service: "<strong>सेवा:</strong> कई ग्रामीण सरकारी और निजी कार्यों से योगदान देते हैं।",
      achievement_community: "<strong>समुदाय:</strong> लोग त्योहार, विकास और सहयोग के लिए साथ आते हैं।"
    },
    mai: {
      label: "भाषा",
      menu: "मेनू",
      close: "बंद करू",
      hero_location: "सहरसा, बिहार",
      hero_title: "लगमा गाम में अहां के स्वागत अछि",
      hero_text: "खेती, शिक्षा, मंदिर, पोखरि आ सामुदायिक भावना सँ जुड़ल एक ऐतिहासिक गाम।",
      hero_primary: "लगमा देखू",
      hero_secondary: "गामक सेवा",
      achievements_label: "उपलब्धि",
      achievements_title: "गामक गौरवक कहानी",
      achievements_text: "लगमाक ताकत ओकर विद्यार्थी, जनसेवा, किसान परिवार आ गाम सँ जुड़ल लोक मे देखाइत अछि।",
      gold_badge: "स्वर्ण पदक | श्रुति कुमारी | वेटलिफ्टिंग",
      achievement_medal: "<strong>वेटलिफ्टिंग:</strong> श्रुति कुमारी स्वर्ण पदक जीत लगमाक गौरव बढ़ौलनि।",
      achievement_education: "<strong>शिक्षा:</strong> विद्यार्थी परीक्षा आ करियर मे नीक प्रदर्शन कए रहल छथि।",
      achievement_service: "<strong>सेवा:</strong> बहुत ग्रामीण सरकारी आ निजी काज सँ योगदान दैत छथि।",
      achievement_community: "<strong>समुदाय:</strong> लोक पर्व, विकास आ सहयोग लेल संग अबैत छथि।"
    }
  };
  const languageNames = {
    en: "अंग्रेजी",
    hi: "हिंदी",
    mai: "मैथिली"
  };
  const staticTranslations = {
    "Lagma Village": { hi: "लगमा गांव", mai: "लगमा गाम" },
    "Lagma Village. All rights reserved.": { hi: "लगमा गांव। सर्वाधिकार सुरक्षित।", mai: "लगमा गाम। सभ अधिकार सुरक्षित।" },
    "English": { hi: "अंग्रेजी", mai: "अंग्रेजी" },
    "Home": { hi: "होम", mai: "मुख्य पृष्ठ" },
    "About": { hi: "परिचय", mai: "परिचय" },
    "Services": { hi: "सेवाएं", mai: "सेवा" },
    "Online Services": { hi: "ऑनलाइन सेवाएं", mai: "ऑनलाइन सेवा" },
    "Gallery": { hi: "गैलरी", mai: "गैलरी" },
    "Notices": { hi: "सूचनाएं", mai: "सूचना" },
    "Contact": { hi: "संपर्क", mai: "संपर्क" },
    "Back to Home": { hi: "होम पर वापस जाएं", mai: "मुख्य पृष्ठ पर वापस जाउ" },
    "Back to Services": { hi: "सेवाओं पर वापस जाएं", mai: "सेवा पर वापस जाउ" },
    "Latest Update": { hi: "ताजा अपडेट", mai: "नवीन अपडेट" },
    "Village information, facilities, photos, and notices are now available in one place.": { hi: "गांव की जानकारी, सुविधाएं, फोटो और सूचनाएं अब एक ही जगह उपलब्ध हैं।", mai: "गामक जानकारी, सुविधा, फोटो आ सूचना आब एकहि ठाम उपलब्ध अछि।" },
    "View notices": { hi: "सूचनाएं देखें", mai: "सूचना देखू" },
    "Quick access": { hi: "त्वरित पहुंच", mai: "जल्दी पहुंच" },
    "Find what you need faster": { hi: "जरूरी जानकारी जल्दी पाएं", mai: "जरूरी जानकारी जल्दी पाउ" },
    "Public Services": { hi: "सार्वजनिक सेवाएं", mai: "सार्वजनिक सेवा" },
    "Village Gallery": { hi: "गांव की गैलरी", mai: "गामक गैलरी" },
    "Notice Board": { hi: "सूचना पट्ट", mai: "सूचना पट्ट" },
    "Contact Info": { hi: "संपर्क जानकारी", mai: "संपर्क जानकारी" },
    "Service finder": { hi: "सेवा खोज", mai: "सेवा खोज" },
    "Search village services": { hi: "गांव की सेवाएं खोजें", mai: "गामक सेवा खोजू" },
    "School, Panchayat, Vasudha Kendra, farming, health, banking, and market details quickly find karein.": { hi: "स्कूल, पंचायत, वसुधा केंद्र, खेती, स्वास्थ्य, बैंकिंग और बाजार की जानकारी जल्दी खोजें।", mai: "स्कूल, पंचायत, वसुधा केंद्र, खेती, स्वास्थ्य, बैंकिंग आ बाजारक जानकारी जल्दी खोजू।" },
    "Search": { hi: "खोजें", mai: "खोजू" },
    "Type: Aadhaar, school, bank, panchayat...": { hi: "लिखें: आधार, स्कूल, बैंक, पंचायत...", mai: "लिखू: आधार, स्कूल, बैंक, पंचायत..." },
    "Select language": { hi: "भाषा चुनें", mai: "भाषा चुनू" },
    "Facilities": { hi: "सुविधाएं", mai: "सुविधा" },
    "Important village services": { hi: "गांव की महत्वपूर्ण सेवाएं", mai: "गामक महत्वपूर्ण सेवा" },
    "View All Services": { hi: "सभी सेवाएं देखें", mai: "सभ सेवा देखू" },
    "Open Gallery": { hi: "गैलरी खोलें", mai: "गैलरी खोलू" },
    "Online services": { hi: "ऑनलाइन सेवाएं", mai: "ऑनलाइन सेवा" },
    "Vasudha Kendra digital services": { hi: "वसुधा केंद्र डिजिटल सेवाएं", mai: "वसुधा केंद्र डिजिटल सेवा" },
    "Gaon ke logon ke liye Aadhaar, PAN, certificates, bill payment, tickets, banking support, aur sarkari yojana registration ek hi jagah.": { hi: "गांव के लोगों के लिए आधार, पैन, प्रमाण पत्र, बिल भुगतान, टिकट, बैंकिंग सहायता और सरकारी योजना पंजीकरण एक ही जगह।", mai: "गामक लोक लेल आधार, पैन, प्रमाण पत्र, बिल भुगतान, टिकट, बैंकिंग सहायता आ सरकारी योजना पंजीकरण एकहि ठाम।" },
    "Vasudha Kendra": { hi: "वसुधा केंद्र", mai: "वसुधा केंद्र" },
    "Vasudha Kendra par uplabdh sabhi digital aur sarkari online sevaayein.": { hi: "वसुधा केंद्र पर उपलब्ध सभी डिजिटल और सरकारी ऑनलाइन सेवाएं।", mai: "वसुधा केंद्र पर उपलब्ध सभ डिजिटल आ सरकारी ऑनलाइन सेवा।" },
    "Bihar RTPS": { hi: "बिहार आरटीपीएस", mai: "बिहार आरटीपीएस" },
    "RTPS Bihar": { hi: "बिहार आरटीपीएस", mai: "बिहार आरटीपीएस" },
    "Caste, income, residence certificate portal": { hi: "जाति, आय, निवास प्रमाण पत्र पोर्टल", mai: "जाति, आय, निवास प्रमाण पत्र पोर्टल" },
    "Bihar Government ke official ServicePlus portal par caste, income, residence, NCL, EWS aur anya RTPS services ke liye online apply, status track aur certificate download ki suvidha milti hai.": { hi: "बिहार सरकार के आधिकारिक सर्विसप्लस पोर्टल पर जाति, आय, निवास, एनसीएल, ईडब्ल्यूएस और अन्य आरटीपीएस सेवाओं के लिए ऑनलाइन आवेदन, स्थिति जांच और प्रमाण पत्र डाउनलोड की सुविधा मिलती है।", mai: "बिहार सरकारक आधिकारिक सर्विसप्लस पोर्टल पर जाति, आय, निवास, एनसीएल, ईडब्ल्यूएस आ आन आरटीपीएस सेवा लेल ऑनलाइन आवेदन, स्थिति जांच आ प्रमाण पत्र डाउनलोडक सुविधा भेटैत अछि।" },
    "Open RTPS Portal": { hi: "आरटीपीएस पोर्टल खोलें", mai: "आरटीपीएस पोर्टल खोलू" },
    "Old RTPS Site": { hi: "पुरानी आरटीपीएस साइट", mai: "पुरान आरटीपीएस साइट" },
    "Bihar Bhumi": { hi: "बिहार भूमि", mai: "बिहार भूमि" },
    "Land records, Jamabandi, mutation, and Bhu-Lagaan": { hi: "भूमि रिकॉर्ड, जमाबंदी, दाखिल-खारिज और भू-लगान", mai: "भूमि अभिलेख, जमाबंदी, दाखिल-खारिज आ भू-लगान" },
    "Bihar Government ke official Bihar Bhumi portal par land records, Jamabandi register, mutation application/status, Bhu-Lagaan payment, Bhu-Manchitra, e-Mapi aur Bhu-Abhilekh services milti hain.": { hi: "बिहार सरकार के आधिकारिक बिहार भूमि पोर्टल पर भूमि रिकॉर्ड, जमाबंदी पंजी, दाखिल-खारिज आवेदन/स्थिति, भू-लगान भुगतान, भू-मानचित्र, ई-मापी और भू-अभिलेख सेवाएं मिलती हैं।", mai: "बिहार सरकारक आधिकारिक बिहार भूमि पोर्टल पर भूमि अभिलेख, जमाबंदी पंजी, दाखिल-खारिज आवेदन/स्थिति, भू-लगान भुगतान, भू-मानचित्र, ई-मापी आ भू-अभिलेख सेवा भेटैत अछि।" },
    "Open Bihar Bhumi": { hi: "बिहार भूमि खोलें", mai: "बिहार भूमि खोलू" },
    "Bhu-Abhilekh": { hi: "भू-अभिलेख", mai: "भू-अभिलेख" },
    "Caste certificate": { hi: "जाति प्रमाण पत्र", mai: "जाति प्रमाण पत्र" },
    "Income certificate": { hi: "आय प्रमाण पत्र", mai: "आय प्रमाण पत्र" },
    "Residence certificate": { hi: "निवास प्रमाण पत्र", mai: "निवास प्रमाण पत्र" },
    "Application status": { hi: "आवेदन स्थिति", mai: "आवेदन स्थिति" },
    "Certificate download": { hi: "प्रमाण पत्र डाउनलोड", mai: "प्रमाण पत्र डाउनलोड" },
    "Jamabandi register": { hi: "जमाबंदी पंजी", mai: "जमाबंदी पंजी" },
    "Mutation apply/status": { hi: "दाखिल-खारिज आवेदन/स्थिति", mai: "दाखिल-खारिज आवेदन/स्थिति" },
    "Bhu-Lagaan payment": { hi: "भू-लगान भुगतान", mai: "भू-लगान भुगतान" },
    "Bhu-Manchitra": { hi: "भू-मानचित्र", mai: "भू-मानचित्र" },
    "Rural Digital Service Centre": { hi: "ग्रामीण डिजिटल सेवा केंद्र", mai: "ग्रामीण डिजिटल सेवा केंद्र" },
    "Digital support for Lagma": { hi: "लगमा के लिए डिजिटल सहायता", mai: "लगमा लेल डिजिटल सहायता" },
    "Vasudha Kendra Lagma": { hi: "वसुधा केंद्र लगमा", mai: "वसुधा केंद्र लगमा" },
    "Operator: Prince Mishra": { hi: "संचालक: प्रिंस मिश्रा", mai: "संचालक: प्रिंस मिश्रा" },
    "Prince Mishra": { hi: "प्रिंस मिश्रा", mai: "प्रिंस मिश्रा" },
    "Mobile: 7677773236": { hi: "मोबाइल: 7677773236", mai: "मोबाइल: 7677773236" },
    "Gaon ke logon ke liye ek hi jagah par sabhi online aur digital sevaayein.": { hi: "गांव के लोगों के लिए एक ही जगह पर सभी ऑनलाइन और डिजिटल सेवाएं।", mai: "गामक लोक लेल एकहि ठाम सभ ऑनलाइन आ डिजिटल सेवा।" },
    "Service provider": { hi: "सेवा प्रदाता", mai: "सेवा प्रदाता" },
    "Online form, certificate, recharge, bill payment, ticket booking, banking support, aur digital services ke liye sampark karein.": { hi: "ऑनलाइन फॉर्म, प्रमाण पत्र, रिचार्ज, बिल भुगतान, टिकट बुकिंग, बैंकिंग सहायता और डिजिटल सेवाओं के लिए संपर्क करें।", mai: "ऑनलाइन फॉर्म, प्रमाण पत्र, रिचार्ज, बिल भुगतान, टिकट बुकिंग, बैंकिंग सहायता आ डिजिटल सेवा लेल संपर्क करू।" },
    "Get Directions": { hi: "दिशा देखें", mai: "दिशा देखू" },
    "Location": { hi: "स्थान", mai: "स्थान" },
    "Vasudha Kendra direction": { hi: "वसुधा केंद्र का रास्ता", mai: "वसुधा केंद्रक रास्ता" },
    "Map se Vasudha Kendra Lagma ke liye direction dekh sakte hain.": { hi: "मैप से वसुधा केंद्र लगमा के लिए दिशा देख सकते हैं।", mai: "मैप सँ वसुधा केंद्र लगमा लेल दिशा देखि सकैत छी।" },
    "Education": { hi: "शिक्षा", mai: "शिक्षा" },
    "Digital": { hi: "डिजिटल", mai: "डिजिटल" },
    "Governance": { hi: "शासन", mai: "शासन" },
    "Health": { hi: "स्वास्थ्य", mai: "स्वास्थ्य" },
    "Agriculture": { hi: "कृषि", mai: "कृषि" },
    "Banking": { hi: "बैंकिंग", mai: "बैंकिंग" },
    "Land Records": { hi: "भूमि रिकॉर्ड", mai: "भूमि अभिलेख" },
    "Market": { hi: "बाजार", mai: "बाजार" },
    "Community": { hi: "समुदाय", mai: "समुदाय" },
    "Middle School": { hi: "मध्य विद्यालय", mai: "मध्य विद्यालय" },
    "Bihar Bhumi Portal": { hi: "बिहार भूमि पोर्टल", mai: "बिहार भूमि पोर्टल" },
    "Ward No. 7 me established school, students aur local education support.": { hi: "वार्ड नंबर 7 में स्थित विद्यालय, विद्यार्थियों और स्थानीय शिक्षा सहायता की जानकारी।", mai: "वार्ड नंबर 7 मे स्थित विद्यालय, विद्यार्थी आ स्थानीय शिक्षा सहायता केर जानकारी।" },
    "Aadhaar, PAN, certificate, bill payment, ticket booking, form fill-up.": { hi: "आधार, पैन, प्रमाण पत्र, बिल भुगतान, टिकट बुकिंग और फॉर्म भराई।", mai: "आधार, पैन, प्रमाण पत्र, बिल भुगतान, टिकट बुकिंग आ फॉर्म भराई।" },
    "ServicePlus Certificate Portal": { hi: "सर्विसप्लस प्रमाण पत्र पोर्टल", mai: "सर्विसप्लस प्रमाण पत्र पोर्टल" },
    "Caste, income, residence, NCL, EWS certificate apply, status and download.": { hi: "जाति, आय, निवास, एनसीएल, ईडब्ल्यूएस प्रमाण पत्र आवेदन, स्थिति और डाउनलोड।", mai: "जाति, आय, निवास, एनसीएल, ईडब्ल्यूएस प्रमाण पत्र आवेदन, स्थिति आ डाउनलोड।" },
    "Panchayat Services": { hi: "पंचायत सेवाएं", mai: "पंचायत सेवा" },
    "Certificates, public schemes, local development aur governance support.": { hi: "प्रमाण पत्र, सार्वजनिक योजनाएं, स्थानीय विकास और शासन सहायता।", mai: "प्रमाण पत्र, सार्वजनिक योजना, स्थानीय विकास आ शासन सहायता।" },
    "Health Support": { hi: "स्वास्थ्य सहायता", mai: "स्वास्थ्य सहायता" },
    "ASHA, ANM aur nearby healthcare facilities ki jankari.": { hi: "आशा, एएनएम और नजदीकी स्वास्थ्य सुविधाओं की जानकारी।", mai: "आशा, एएनएम आ नजदीकी स्वास्थ्य सुविधाक जानकारी।" },
    "Farming and Irrigation": { hi: "खेती और सिंचाई", mai: "खेती आ सिंचाई" },
    "Paddy, wheat, maize, mustard, irrigation aur seasonal crop information.": { hi: "धान, गेहूं, मक्का, सरसों, सिंचाई और मौसमी फसल की जानकारी।", mai: "धान, गहूम, मकई, सरिसों, सिंचाई आ मौसमी फसलक जानकारी।" },
    "Bank and KYC": { hi: "बैंक और केवाईसी", mai: "बैंक आ केवाईसी" },
    "Banking support, KYC update, account opening aur money transfer.": { hi: "बैंकिंग सहायता, केवाईसी अपडेट, खाता खोलना और मनी ट्रांसफर।", mai: "बैंकिंग सहायता, केवाईसी अपडेट, खाता खोलब आ मनी ट्रांसफर।" },
    "Jamabandi, mutation, Bhu-Lagaan, Bhu-Manchitra aur Bhu-Abhilekh services.": { hi: "जमाबंदी, दाखिल-खारिज, भू-लगान, भू-मानचित्र और भू-अभिलेख सेवाएं।", mai: "जमाबंदी, दाखिल-खारिज, भू-लगान, भू-मानचित्र आ भू-अभिलेख सेवा।" },
    "Local Market and Gas": { hi: "स्थानीय बाजार और गैस", mai: "स्थानीय बाजार आ गैस" },
    "Daily essentials, gas service aur local shop contact.": { hi: "दैनिक जरूरतें, गैस सेवा और स्थानीय दुकान संपर्क।", mai: "दैनिक जरूरत, गैस सेवा आ स्थानीय दोकान संपर्क।" },
    "Village announcements, meeting updates aur public messages.": { hi: "गांव की घोषणाएं, बैठक अपडेट और सार्वजनिक संदेश।", mai: "गामक घोषणा, बैठक अपडेट आ सार्वजनिक संदेश।" },
    "No matching service found. Try Aadhaar, school, bank, health, panchayat, or market.": { hi: "मिलती-जुलती सेवा नहीं मिली। आधार, स्कूल, बैंक, स्वास्थ्य, पंचायत या बाजार खोजें।", mai: "मिलैत-जुलैत सेवा नहि भेटल। आधार, स्कूल, बैंक, स्वास्थ्य, पंचायत वा बाजार खोजू।" },
    "Aadhaar": { hi: "आधार", mai: "आधार" },
    "PAN Card": { hi: "पैन कार्ड", mai: "पैन कार्ड" },
    "Certificates": { hi: "प्रमाण पत्र", mai: "प्रमाण पत्र" },
    "Bill Payment": { hi: "बिल भुगतान", mai: "बिल भुगतान" },
    "Ticket Booking": { hi: "टिकट बुकिंग", mai: "टिकट बुकिंग" },
    "Form Fill-up": { hi: "फॉर्म भराई", mai: "फॉर्म भराई" },
    "Aadhaar Update & Correction": { hi: "आधार अपडेट और सुधार", mai: "आधार अपडेट आ सुधार" },
    "PAN Card Apply & Correction": { hi: "पैन कार्ड आवेदन और सुधार", mai: "पैन कार्ड आवेदन आ सुधार" },
    "Bank KYC Update": { hi: "बैंक केवाईसी अपडेट", mai: "बैंक केवाईसी अपडेट" },
    "New Bank Account Opening": { hi: "नया बैंक खाता खोलना", mai: "नव बैंक खाता खोलब" },
    "Mobile Number Linking": { hi: "मोबाइल नंबर लिंकिंग", mai: "मोबाइल नंबर लिंकिंग" },
    "Birth Certificate Apply": { hi: "जन्म प्रमाण पत्र आवेदन", mai: "जन्म प्रमाण पत्र आवेदन" },
    "Caste Certificate": { hi: "जाति प्रमाण पत्र", mai: "जाति प्रमाण पत्र" },
    "Income Certificate": { hi: "आय प्रमाण पत्र", mai: "आय प्रमाण पत्र" },
    "Residence Certificate": { hi: "निवास प्रमाण पत्र", mai: "निवास प्रमाण पत्र" },
    "Voter ID Services": { hi: "वोटर आईडी सेवाएं", mai: "वोटर आईडी सेवा" },
    "Ration Card Apply": { hi: "राशन कार्ड आवेदन", mai: "राशन कार्ड आवेदन" },
    "Pension Application": { hi: "पेंशन आवेदन", mai: "पेंशन आवेदन" },
    "Scholarship Form Fill-up": { hi: "छात्रवृत्ति फॉर्म भराई", mai: "छात्रवृत्ति फॉर्म भराई" },
    "PM Kisan Registration": { hi: "पीएम किसान पंजीकरण", mai: "पीएम किसान पंजीकरण" },
    "Government Scheme Registration": { hi: "सरकारी योजना पंजीकरण", mai: "सरकारी योजना पंजीकरण" },
    "Land Records: Bhumi, Lagaan, Mutation": { hi: "भूमि रिकॉर्ड: भूमि, लगान, दाखिल-खारिज", mai: "भूमि अभिलेख: भूमि, लगान, दाखिल-खारिज" },
    "Jamabandi and Bhu-Lagaan": { hi: "जमाबंदी और भू-लगान", mai: "जमाबंदी आ भू-लगान" },
    "Electricity Bill Payment": { hi: "बिजली बिल भुगतान", mai: "बिजली बिल भुगतान" },
    "Water Bill Payment": { hi: "पानी बिल भुगतान", mai: "पानि बिल भुगतान" },
    "Mobile Recharge": { hi: "मोबाइल रिचार्ज", mai: "मोबाइल रिचार्ज" },
    "DTH Recharge": { hi: "डीटीएच रिचार्ज", mai: "डीटीएच रिचार्ज" },
    "Online Form Filling": { hi: "ऑनलाइन फॉर्म भरना", mai: "ऑनलाइन फॉर्म भरब" },
    "Print, Scan & Photocopy": { hi: "प्रिंट, स्कैन और फोटोकॉपी", mai: "प्रिंट, स्कैन आ फोटोकॉपी" },
    "Email Services": { hi: "ईमेल सेवाएं", mai: "ईमेल सेवा" },
    "Train Ticket Booking": { hi: "ट्रेन टिकट बुकिंग", mai: "ट्रेन टिकट बुकिंग" },
    "Flight Ticket Booking": { hi: "फ्लाइट टिकट बुकिंग", mai: "फ्लाइट टिकट बुकिंग" },
    "Bus Ticket Booking": { hi: "बस टिकट बुकिंग", mai: "बस टिकट बुकिंग" },
    "Insurance Services": { hi: "बीमा सेवाएं", mai: "बीमा सेवा" },
    "Money Transfer": { hi: "मनी ट्रांसफर", mai: "मनी ट्रांसफर" },
    "Resume & Document Preparation": { hi: "रिज्यूमे और दस्तावेज तैयारी", mai: "रिज्यूमे आ दस्तावेज तैयारी" },
    "Call: 7677773236": { hi: "कॉल: 7677773236", mai: "कॉल: 7677773236" },
    "Open details": { hi: "विवरण खोलें", mai: "विवरण खोलू" }
  };
  const textSources = [];
  const attrSources = [];
  const seenTextNodes = new WeakSet();
  const seenAttrElements = new WeakSet();

  function getActiveTranslation(language) {
    return translations[language] || translations.en;
  }

  function translateValue(value, language) {
    if (language === "en") return value;
    return staticTranslations[value]?.[language] || value;
  }

  function collectTextSources(root = document.body) {
    if (!root) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || ["SCRIPT", "STYLE", "OPTION"].includes(parent.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        if (parent.closest("[data-i18n], [data-i18n-html]")) {
          return NodeFilter.FILTER_REJECT;
        }
        return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });

    let node = walker.nextNode();
    while (node) {
      if (!seenTextNodes.has(node)) {
        seenTextNodes.add(node);
        textSources.push({ node, original: node.nodeValue.trim() });
      }
      node = walker.nextNode();
    }

    root.querySelectorAll?.("[placeholder], [aria-label], [title]").forEach((element) => {
      if (seenAttrElements.has(element)) return;
      seenAttrElements.add(element);
      attrSources.push({
        element,
        placeholder: element.getAttribute("placeholder"),
        ariaLabel: element.getAttribute("aria-label"),
        title: element.getAttribute("title")
      });
    });
  }

  function translateStaticText(language) {
    textSources.forEach(({ node, original }) => {
      const translated = translateValue(original, language);
      const leading = node.nodeValue.match(/^\s*/)[0];
      const trailing = node.nodeValue.match(/\s*$/)[0];
      node.nodeValue = `${leading}${translated}${trailing}`;
    });

    attrSources.forEach(({ element, placeholder, ariaLabel, title }) => {
      if (placeholder !== null) element.setAttribute("placeholder", translateValue(placeholder, language));
      if (ariaLabel !== null) element.setAttribute("aria-label", translateValue(ariaLabel, language));
      if (title !== null) element.setAttribute("title", translateValue(title, language));
    });
  }

  function applyLanguage(language) {
    const active = translations[language] ? language : "en";
    const copy = getActiveTranslation(active);

    document.documentElement.lang = active;

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.getAttribute("data-i18n");
      if (copy[key]) element.textContent = copy[key];
    });

    document.querySelectorAll("[data-i18n-html]").forEach((element) => {
      const key = element.getAttribute("data-i18n-html");
      if (copy[key]) element.innerHTML = copy[key];
    });

    collectTextSources();
    translateStaticText(active);

    if (menuButton) {
      const isOpen = nav && nav.classList.contains("open");
      menuButton.textContent = isOpen ? copy.close : copy.menu;
    }

    localStorage.setItem("lagma-language", active);
  }

  const header = document.querySelector(".site-header");
  if (header) {
    const installButton = document.createElement("button");
    installButton.className = "install-app-btn";
    installButton.type = "button";
    installButton.textContent = "Install LAGMA APP";
    installButton.setAttribute("aria-label", "Install LAGMA APP");
    installButton.addEventListener("click", async () => {
      if (!deferredInstallPrompt) {
        window.alert("App install karne ke liye browser menu kholen aur 'Install app' ya 'Add to Home screen' select karein.");
        return;
      }

      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      updateInstallButton();
    });
    header.appendChild(installButton);
    updateInstallButton();

    const languageWrap = document.createElement("label");
    languageWrap.className = "language-switcher";
    languageWrap.innerHTML = `
      <span>${translations.en.label}</span>
      <select aria-label="Select language">
        ${Object.entries(languageNames).map(([code, name]) => `<option value="${code}">${name}</option>`).join("")}
      </select>
    `;
    header.appendChild(languageWrap);

    const languageSelect = languageWrap.querySelector("select");
    const savedLanguage = localStorage.getItem("lagma-language") || "en";
    languageSelect.value = translations[savedLanguage] ? savedLanguage : "en";
    collectTextSources();
    applyLanguage(languageSelect.value);
    languageWrap.querySelector("span").textContent = getActiveTranslation(languageSelect.value).label;

    languageSelect.addEventListener("change", () => {
      applyLanguage(languageSelect.value);
      languageWrap.querySelector("span").textContent = getActiveTranslation(languageSelect.value).label;
    });
  }

  if (!document.querySelector(".whatsapp-float")) {
    const whatsappFloat = document.createElement("a");
    whatsappFloat.className = "whatsapp-float";
    whatsappFloat.href = "https://wa.me/917011504426?text=Namaste%2C%20mujhe%20Lagma%20Village%20website%20ke%20baare%20me%20jankari%20chahiye.";
    whatsappFloat.target = "_blank";
    whatsappFloat.rel = "noopener";
    whatsappFloat.setAttribute("aria-label", "WhatsApp par juriye");
    whatsappFloat.textContent = "WhatsApp";
    document.body.appendChild(whatsappFloat);
  }

  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      const language = localStorage.getItem("lagma-language") || "en";
      const copy = getActiveTranslation(language);
      menuButton.setAttribute("aria-expanded", String(isOpen));
      menuButton.textContent = isOpen ? copy.close : copy.menu;
    });

    nav.addEventListener("click", (event) => {
      if (event.target instanceof HTMLAnchorElement) {
        const language = localStorage.getItem("lagma-language") || "en";
        nav.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.textContent = getActiveTranslation(language).menu;
      }
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ block: "start" });
    });
  });

  const serviceSearch = document.querySelector("#service-search");
  const serviceResults = document.querySelector("#service-results");
  if (serviceSearch && serviceResults) {
    const services = [
      {
        category: "Education",
        title: "Middle School",
        text: "Ward No. 7 me established school, students aur local education support.",
        link: "services.html"
      },
      {
        category: "Digital",
        title: "Vasudha Kendra",
        text: "Aadhaar, PAN, certificate, bill payment, ticket booking, form fill-up.",
        link: "online-services.html"
      },
      {
        category: "RTPS Bihar",
        title: "ServicePlus Certificate Portal",
        text: "Caste, income, residence, NCL, EWS certificate apply, status and download.",
        link: "https://serviceonline.bihar.gov.in/"
      },
      {
        category: "Governance",
        title: "Panchayat Services",
        text: "Certificates, public schemes, local development aur governance support.",
        link: "services.html"
      },
      {
        category: "Health",
        title: "Health Support",
        text: "ASHA, ANM aur nearby healthcare facilities ki jankari.",
        link: "services.html"
      },
      {
        category: "Agriculture",
        title: "Farming and Irrigation",
        text: "Paddy, wheat, maize, mustard, irrigation aur seasonal crop information.",
        link: "services.html"
      },
      {
        category: "Banking",
        title: "Bank and KYC",
        text: "Banking support, KYC update, account opening aur money transfer.",
        link: "online-services.html"
      },
      {
        category: "Land Records",
        title: "Bihar Bhumi Portal",
        text: "Jamabandi, mutation, Bhu-Lagaan, Bhu-Manchitra aur Bhu-Abhilekh services.",
        link: "https://biharbhumi.bihar.gov.in/Biharbhumi/"
      },
      {
        category: "Market",
        title: "Local Market and Gas",
        text: "Daily essentials, gas service aur local shop contact.",
        link: "services.html"
      },
      {
        category: "Community",
        title: "Notice Board",
        text: "Village announcements, meeting updates aur public messages.",
        link: "notification.html"
      }
    ];

    const renderServices = (query = "") => {
      const normalizedQuery = query.trim().toLowerCase();
      const matches = services.filter((service) => {
        const searchable = `${service.category} ${service.title} ${service.text}`.toLowerCase();
        return !normalizedQuery || searchable.includes(normalizedQuery);
      });

      serviceResults.innerHTML = "";

      if (!matches.length) {
        serviceResults.innerHTML = '<p class="service-empty">No matching service found. Try Aadhaar, school, bank, health, panchayat, or market.</p>';
        collectTextSources(serviceResults);
        translateStaticText(localStorage.getItem("lagma-language") || "en");
        return;
      }

      const fragment = document.createDocumentFragment();
      matches.forEach((service) => {
        const card = document.createElement("article");
        card.className = "service-result-card";
        card.innerHTML = `
          <span></span>
          <h3></h3>
          <p></p>
          <a class="text-link" href=""></a>
        `;
        card.querySelector("span").textContent = service.category;
        card.querySelector("h3").textContent = service.title;
        card.querySelector("p").textContent = service.text;
        card.querySelector("a").href = service.link;
        if (service.link.startsWith("http")) {
          card.querySelector("a").target = "_blank";
          card.querySelector("a").rel = "noopener";
        }
        card.querySelector("a").textContent = "Open details";
        fragment.appendChild(card);
      });
      serviceResults.appendChild(fragment);
      collectTextSources(serviceResults);
      translateStaticText(localStorage.getItem("lagma-language") || "en");
    };

    renderServices();
    serviceSearch.addEventListener("input", () => renderServices(serviceSearch.value));
  }

  const dynamicGalleryGrid = document.querySelector(".photo-gallery-grid[data-gallery-end]");
  if (dynamicGalleryGrid) {
    const start = Number(dynamicGalleryGrid.dataset.galleryStart || 1);
    const end = Number(dynamicGalleryGrid.dataset.galleryEnd || 500);
    const extension = dynamicGalleryGrid.dataset.galleryExtension || "jpeg";
    const counter = document.querySelector("#gallery-photo-count");
    let visiblePhotos = 0;

    const updateCounter = () => {
      if (counter) counter.textContent = String(visiblePhotos);
    };

    const fragment = document.createDocumentFragment();
    for (let photoNumber = start; photoNumber <= end; photoNumber += 1) {
      const image = document.createElement("img");
      image.src = `${photoNumber}.${extension}`;
      image.alt = `Lagma village photo ${photoNumber}`;
      image.loading = "lazy";
      image.decoding = "async";

      image.addEventListener("load", () => {
        visiblePhotos += 1;
        updateCounter();
      }, { once: true });

      image.addEventListener("error", () => {
        image.remove();
      }, { once: true });

      fragment.appendChild(image);
    }

    dynamicGalleryGrid.appendChild(fragment);
    updateCounter();
  }

  const uploadForm = document.querySelector("#gallery-upload-form");
  if (uploadForm) {
    const photoInput = uploadForm.querySelector("#gallery-photo-input");
    const preview = uploadForm.querySelector("#gallery-upload-preview");
    const status = uploadForm.querySelector("#gallery-upload-status");
    const submitButton = uploadForm.querySelector("button[type='submit']");
    const fallbackLink = uploadForm.querySelector(".whatsapp-photo-btn");
    const maxPhotoSize = 8 * 1024 * 1024;
    let previewUrl = "";

    const setUploadStatus = (message, type = "") => {
      if (!status) return;
      status.textContent = message;
      status.classList.toggle("is-success", type === "success");
      status.classList.toggle("is-error", type === "error");
    };

    const clearPreviewUrl = () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = "";
    };

    const getUploadFieldValue = (fieldName) => {
      const field = uploadForm.elements.namedItem(fieldName);
      return field ? String(field.value || "").replace(/[|=]/g, " ").trim() : "";
    };

    photoInput?.addEventListener("change", () => {
      clearPreviewUrl();
      const file = photoInput.files?.[0];
      setUploadStatus("");

      if (!file) {
        if (preview) preview.innerHTML = "<span>Preview yahan dikhega</span>";
        return;
      }

      if (!file.type.startsWith("image/")) {
        photoInput.value = "";
        if (preview) preview.innerHTML = "<span>Preview yahan dikhega</span>";
        setUploadStatus("Kripya JPG, PNG ya WEBP photo select karein.", "error");
        return;
      }

      if (file.size > maxPhotoSize) {
        photoInput.value = "";
        if (preview) preview.innerHTML = "<span>Preview yahan dikhega</span>";
        setUploadStatus("Photo 8 MB se chhoti honi chahiye.", "error");
        return;
      }

      previewUrl = URL.createObjectURL(file);
      if (preview) preview.innerHTML = `<img src="${previewUrl}" alt="Selected photo preview">`;
    });

    uploadForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const endpoint = uploadForm.dataset.uploadEndpoint?.trim();
      const cloudinaryCloud = uploadForm.dataset.cloudinaryCloud?.trim();
      const cloudinaryUploadPreset = uploadForm.dataset.cloudinaryUploadPreset?.trim();
      const reviewWhatsapp = uploadForm.dataset.reviewWhatsapp?.trim();
      const file = photoInput?.files?.[0];

      if (!file) {
        setUploadStatus("Pehle photo choose karein.", "error");
        return;
      }

      if (!endpoint && (!cloudinaryCloud || !cloudinaryUploadPreset)) {
        setUploadStatus("Upload setup hona baaki hai. Abhi WhatsApp khulega, wahan photo attach karke bhej dein.", "error");
        fallbackLink?.click();
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = "Uploading...";
      setUploadStatus("Photo upload ho rahi hai...");

      try {
        let uploadedPhotoUrl = "";

        if (cloudinaryCloud && cloudinaryUploadPreset) {
          const cloudinaryData = new FormData();
          cloudinaryData.append("file", file);
          cloudinaryData.append("upload_preset", cloudinaryUploadPreset);
          cloudinaryData.append("tags", "lagma-village-gallery,website-upload");
          cloudinaryData.append("context", [
            `name=${getUploadFieldValue("name")}`,
            `contact=${getUploadFieldValue("contact")}`,
            `caption=${getUploadFieldValue("caption")}`,
            "source=Lagma Village website gallery",
          ].join("|"));

          const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryCloud}/image/upload`, {
            method: "POST",
            body: cloudinaryData,
          });

          if (!cloudinaryResponse.ok) throw new Error("Cloudinary upload failed");
          const cloudinaryResult = await cloudinaryResponse.json();
          uploadedPhotoUrl = cloudinaryResult.secure_url || "";
        } else {
          const formData = new FormData(uploadForm);
          formData.append("source", "Lagma Village website gallery");

          const response = await fetch(endpoint, {
            method: "POST",
            body: formData,
          });

          if (!response.ok) throw new Error("Upload failed");
        }

        uploadForm.reset();
        clearPreviewUrl();
        if (preview) preview.innerHTML = "<span>Preview yahan dikhega</span>";
        setUploadStatus("Photo mil gayi. Review ke liye WhatsApp message khul raha hai.", "success");

        if (reviewWhatsapp && uploadedPhotoUrl) {
          const reviewMessage = [
            "Lagma Village gallery ke liye nayi photo upload hui hai.",
            `Photo link: ${uploadedPhotoUrl}`,
            "Kripya review karke approved photo gallery me add kar dijiye.",
          ].join("\n");
          window.open(`https://wa.me/${reviewWhatsapp}?text=${encodeURIComponent(reviewMessage)}`, "_blank", "noopener");
        }
      } catch (error) {
        setUploadStatus("Upload nahi ho payi. Kripya dobara try karein ya WhatsApp se photo bhejein.", "error");
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Upload photo";
      }
    });
  }

  const galleryGrids = document.querySelectorAll(".gallery-grid");
  if (galleryGrids.length) {
    const lightbox = document.createElement("div");
    lightbox.className = "lightbox";
    lightbox.innerHTML = `
      <button type="button" aria-label="Close image preview">&times;</button>
      <img src="" alt="Selected gallery image">
    `;
    document.body.appendChild(lightbox);

    const previewImage = lightbox.querySelector("img");
    const closeButton = lightbox.querySelector("button");
    const closeLightbox = () => {
      lightbox.classList.remove("show");
      document.body.style.overflow = "";
    };

    galleryGrids.forEach((grid) => {
      grid.addEventListener("click", (event) => {
        const image = event.target.closest("img");
        if (!image) return;

        previewImage.src = image.src;
        previewImage.alt = image.alt;
        lightbox.classList.add("show");
        document.body.style.overflow = "hidden";
      });
    });

    closeButton.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeLightbox();
    });
  }

  const likeButtons = document.querySelectorAll(".site-like-button");
  likeButtons.forEach((button) => {
    const likeKey = button.dataset.likeKey || "lagma-website-like";
    const label = button.querySelector(".site-like-text");
    const setLiked = () => {
      button.classList.add("is-liked");
      button.disabled = true;
      button.setAttribute("aria-pressed", "true");
      if (label) label.textContent = "Thanks for liking";
    };

    button.setAttribute("aria-pressed", "false");
    if (localStorage.getItem(likeKey) === "yes") {
      setLiked();
      return;
    }

    button.addEventListener("click", () => {
      localStorage.setItem(likeKey, "yes");
      setLiked();

      if (typeof window.gtag === "function") {
        window.gtag("event", "website_like", {
          event_category: "engagement",
          event_label: document.title,
          page_path: window.location.pathname
        });
      }
    });
  });

  const shareButtons = document.querySelectorAll(".share-site-btn");
  shareButtons.forEach((button) => {
    const originalText = button.textContent;
    const shareData = {
      title: "Lagma Village Website",
      text: "Lagma Village ki official website dekhein.",
      url: window.location.origin && window.location.origin !== "null"
        ? `${window.location.origin}${window.location.pathname}`
        : window.location.href
    };

    button.addEventListener("click", async () => {
      try {
        if (navigator.share) {
          await navigator.share(shareData);
          return;
        }

        await navigator.clipboard.writeText(shareData.url);
        button.textContent = "Link copied";
        window.setTimeout(() => {
          button.textContent = originalText;
        }, 1800);
      } catch (error) {
        if (error?.name === "AbortError") return;
        window.prompt("Website link copy karein:", shareData.url);
      }
    });
  });

  const year = document.querySelector("#year");
  if (year) year.textContent = new Date().getFullYear();
});
