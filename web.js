document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");
  const translations = {
    en: {
      label: "Language",
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
      hero_location: "सहरसा, बिहार",
      hero_title: "लगमा गांव में आपका स्वागत है",
      hero_text: "खेती, शिक्षा, मंदिर, तालाब और सामुदायिक भावना से जुड़ा एक ऐतिहासिक और जीवंत गांव।",
      hero_primary: "लगमा देखें",
      hero_secondary: "गांव की सेवाएं",
      achievements_label: "उपलब्धियां",
      achievements_title: "गांव की गर्व भरी कहानियां",
      achievements_text: "लगमा की ताकत उसके छात्रों, जनसेवा, किसान परिवारों और गांव से जुड़े रहने वाले लोगों में दिखती है।",
      gold_badge: "स्वर्ण पदक | श्रुति कुमारी | वेटलिफ्टिंग",
      achievement_medal: "<strong>वेटलिफ्टिंग:</strong> श्रुति कुमारी ने स्वर्ण पदक जीतकर लगमा का नाम रोशन किया।",
      achievement_education: "<strong>शिक्षा:</strong> छात्र परीक्षा और करियर में लगातार अच्छा प्रदर्शन कर रहे हैं।",
      achievement_service: "<strong>सेवा:</strong> कई ग्रामीण सरकारी और निजी क्षेत्रों में योगदान देते हैं।",
      achievement_community: "<strong>समुदाय:</strong> लोग त्योहार, विकास और सहयोग के लिए साथ आते हैं।"
    },
    mai: {
      label: "भाषा",
      hero_location: "सहरसा, बिहार",
      hero_title: "लगमा गाम मे अहां के स्वागत अछि",
      hero_text: "खेती, शिक्षा, मंदिर, पोखरि आ सामुदायिक भावनासं जुड़ल ऐतिहासिक आ जीवंत गाम।",
      hero_primary: "लगमा देखू",
      hero_secondary: "गामक सेवा",
      achievements_label: "उपलब्धि",
      achievements_title: "गामक गर्वक कहानी",
      achievements_text: "लगमा केर ताकत ओकर छात्र, जनसेवा, किसान परिवार आ गाम सं जुड़ल लोकनि मे देखाइत अछि।",
      gold_badge: "स्वर्ण पदक | श्रुति कुमारी | वेटलिफ्टिंग",
      achievement_medal: "<strong>वेटलिफ्टिंग:</strong> श्रुति कुमारी स्वर्ण पदक जीत कए लगमा के गौरवान्वित केलनि।",
      achievement_education: "<strong>शिक्षा:</strong> छात्र परीक्षा आ करियर मे नीक प्रदर्शन कए रहल छथि।",
      achievement_service: "<strong>सेवा:</strong> बहुत ग्रामीण सरकारी आ निजी क्षेत्र मे योगदान दैत छथि।",
      achievement_community: "<strong>समुदाय:</strong> लोकनि पर्व, विकास आ सहयोग लेल संग अबैत छथि।"
    },
    bn: {
      label: "ভাষা",
      hero_location: "সহরসা, বিহার",
      hero_title: "লাগমা গ্রামে স্বাগতম",
      hero_text: "কৃষি, শিক্ষা, মন্দির, পুকুর এবং সাম্প্রদায়িক চেতনায় গড়া একটি ঐতিহাসিক ও প্রাণবন্ত গ্রাম।",
      hero_primary: "লাগমা দেখুন",
      hero_secondary: "গ্রামের পরিষেবা",
      achievements_label: "অর্জন",
      achievements_title: "গ্রামের গর্বের গল্প",
      achievements_text: "লাগমার শক্তি তার ছাত্রছাত্রী, জনসেবা, কৃষক পরিবার এবং গ্রামের সঙ্গে যুক্ত মানুষের মধ্যে দেখা যায়।",
      gold_badge: "স্বর্ণপদক | শ্রুতি কুমারী | ভারোত্তোলন",
      achievement_medal: "<strong>ভারোত্তোলন:</strong> শ্রুতি কুমারী স্বর্ণপদক জিতে লাগমাকে গর্বিত করেছেন।",
      achievement_education: "<strong>শিক্ষা:</strong> ছাত্রছাত্রীরা পরীক্ষা ও কর্মজীবনে ভালো ফল করছে।",
      achievement_service: "<strong>সেবা:</strong> অনেক গ্রামবাসী সরকারি ও বেসরকারি কাজে অবদান রাখছেন।",
      achievement_community: "<strong>সমাজ:</strong> উৎসব, উন্নয়ন ও সহযোগিতায় মানুষ একসঙ্গে আসে।"
    },
    ur: {
      label: "زبان",
      hero_location: "سہرسہ، بہار",
      hero_title: "لگما گاؤں میں خوش آمدید",
      hero_text: "زراعت، تعلیم، مندروں، تالابوں اور اجتماعی جذبے سے جڑا ایک تاریخی اور زندہ دل گاؤں۔",
      hero_primary: "لگما دیکھیں",
      hero_secondary: "گاؤں کی خدمات",
      achievements_label: "کامیابیاں",
      achievements_title: "گاؤں کی فخر بھری کہانیاں",
      achievements_text: "لگما کی طاقت اس کے طلبہ، عوامی خدمت، کسان خاندانوں اور گاؤں سے جڑے لوگوں میں نظر آتی ہے۔",
      gold_badge: "سونے کا تمغہ | شروتی کماری | ویٹ لفٹنگ",
      achievement_medal: "<strong>ویٹ لفٹنگ:</strong> شروتی کماری نے سونے کا تمغہ جیت کر لگما کا نام روشن کیا۔",
      achievement_education: "<strong>تعلیم:</strong> طلبہ امتحانات اور کیریئر میں اچھی کارکردگی دکھا رہے ہیں۔",
      achievement_service: "<strong>خدمت:</strong> کئی دیہاتی سرکاری اور نجی شعبوں میں حصہ ڈال رہے ہیں۔",
      achievement_community: "<strong>برادری:</strong> لوگ تہوار، ترقی اور مدد کے لیے اکٹھے ہوتے ہیں۔"
    },
    ta: {
      label: "மொழி",
      hero_location: "சஹர்சா, பீகார்",
      hero_title: "லக்மா கிராமத்திற்கு வரவேற்கிறோம்",
      hero_text: "விவசாயம், கல்வி, கோவில்கள், குளங்கள் மற்றும் சமூக உணர்வால் உருவான வரலாற்றுச் சிறப்புமிக்க கிராமம்.",
      hero_primary: "லக்மாவை அறிக",
      hero_secondary: "கிராம சேவைகள்",
      achievements_label: "சாதனைகள்",
      achievements_title: "கிராமத்தின் பெருமைக் கதைகள்",
      achievements_text: "லக்மாவின் வலிமை அதன் மாணவர்கள், பொதுச் சேவை, விவசாயக் குடும்பங்கள் மற்றும் கிராமத்துடன் இணைந்த மக்களில் தெரிகிறது.",
      gold_badge: "தங்கப் பதக்கம் | ஸ்ருதி குமாரி | பளுதூக்குதல்",
      achievement_medal: "<strong>பளுதூக்குதல்:</strong> ஸ்ருதி குமாரி தங்கப் பதக்கம் வென்று லக்மாவை பெருமைப்படுத்தினார்.",
      achievement_education: "<strong>கல்வி:</strong> மாணவர்கள் தேர்வுகளிலும் தொழிலிலும் சிறப்பாக செயல்படுகின்றனர்.",
      achievement_service: "<strong>சேவை:</strong> பலர் அரசு மற்றும் தனியார் துறைகளில் பங்களிக்கின்றனர்.",
      achievement_community: "<strong>சமூகம்:</strong> திருவிழா, வளர்ச்சி மற்றும் உதவிக்கு மக்கள் ஒன்றிணைகின்றனர்."
    },
    te: {
      label: "భాష",
      hero_location: "సహర్సా, బీహార్",
      hero_title: "లగ్మా గ్రామానికి స్వాగతం",
      hero_text: "వ్యవసాయం, విద్య, దేవాలయాలు, చెరువులు మరియు సమాజ భావనతో తీర్చిదిద్దిన చారిత్రక గ్రామం.",
      hero_primary: "లగ్మాను చూడండి",
      hero_secondary: "గ్రామ సేవలు",
      achievements_label: "సాధనలు",
      achievements_title: "గ్రామ గర్వ కథలు",
      achievements_text: "లగ్మా బలం దాని విద్యార్థులు, ప్రజాసేవ, రైతు కుటుంబాలు మరియు గ్రామంతో అనుబంధం ఉన్న ప్రజల్లో కనిపిస్తుంది.",
      gold_badge: "బంగారు పతకం | శృతి కుమారి | వెయిట్ లిఫ్టింగ్",
      achievement_medal: "<strong>వెయిట్ లిఫ్టింగ్:</strong> శృతి కుమారి బంగారు పతకం గెలిచి లగ్మాకు గర్వకారణమయ్యారు.",
      achievement_education: "<strong>విద్య:</strong> విద్యార్థులు పరీక్షలు మరియు వృత్తిలో మంచి ప్రదర్శన చేస్తున్నారు.",
      achievement_service: "<strong>సేవ:</strong> అనేక మంది గ్రామస్తులు ప్రభుత్వ మరియు ప్రైవేట్ రంగాల్లో సేవలందిస్తున్నారు.",
      achievement_community: "<strong>సమాజం:</strong> పండుగలు, అభివృద్ధి, సహాయానికి ప్రజలు కలిసివస్తారు."
    },
    mr: {
      label: "भाषा",
      hero_location: "सहरसा, बिहार",
      hero_title: "लगमा गावात आपले स्वागत आहे",
      hero_text: "शेती, शिक्षण, मंदिरे, तलाव आणि सामुदायिक भावनेने घडलेले ऐतिहासिक आणि जिवंत गाव.",
      hero_primary: "लगमा पाहा",
      hero_secondary: "गाव सेवा",
      achievements_label: "यश",
      achievements_title: "गावाच्या अभिमानाच्या गोष्टी",
      achievements_text: "लगमाची ताकद त्याच्या विद्यार्थ्यांमध्ये, सार्वजनिक सेवेत, शेतकरी कुटुंबांत आणि गावाशी जोडलेल्या लोकांत दिसते.",
      gold_badge: "सुवर्ण पदक | श्रुती कुमारी | वेटलिफ्टिंग",
      achievement_medal: "<strong>वेटलिफ्टिंग:</strong> श्रुती कुमारीने सुवर्ण पदक जिंकून लगमाचा मान वाढवला.",
      achievement_education: "<strong>शिक्षण:</strong> विद्यार्थी परीक्षा आणि करिअरमध्ये चांगली कामगिरी करत आहेत.",
      achievement_service: "<strong>सेवा:</strong> अनेक गावकरी सरकारी आणि खासगी क्षेत्रात योगदान देतात.",
      achievement_community: "<strong>समुदाय:</strong> लोक सण, विकास आणि मदतीसाठी एकत्र येतात."
    },
    gu: {
      label: "ભાષા",
      hero_location: "સહરસા, બિહાર",
      hero_title: "લગ્મા ગામમાં આપનું સ્વાગત છે",
      hero_text: "ખેતી, શિક્ષણ, મંદિરો, તળાવો અને સામૂહિક ભાવનાથી ઘડાયેલું ઐતિહાસિક અને જીવંત ગામ.",
      hero_primary: "લગ્મા જુઓ",
      hero_secondary: "ગામની સેવાઓ",
      achievements_label: "સિદ્ધિઓ",
      achievements_title: "ગામની ગૌરવભરી વાતો",
      achievements_text: "લગ્માની શક્તિ તેના વિદ્યાર્થીઓ, જાહેર સેવા, ખેડૂત પરિવારો અને ગામ સાથે જોડાયેલા લોકોમાં દેખાય છે.",
      gold_badge: "સુવર્ણ પદક | શ્રુતિ કુમારી | વેઇટલિફ્ટિંગ",
      achievement_medal: "<strong>વેઇટલિફ્ટિંગ:</strong> શ્રુતિ કુમારીએ સુવર્ણ પદક જીતીને લગ્માને ગૌરવ અપાવ્યું.",
      achievement_education: "<strong>શિક્ષણ:</strong> વિદ્યાર્થીઓ પરીક્ષાઓ અને કારકિર્દીમાં સારું પ્રદર્શન કરે છે.",
      achievement_service: "<strong>સેવા:</strong> ઘણા ગ્રામજનો સરકારી અને ખાનગી ક્ષેત્રમાં યોગદાન આપે છે.",
      achievement_community: "<strong>સમુદાય:</strong> લોકો તહેવારો, વિકાસ અને મદદ માટે સાથે આવે છે."
    },
    pa: {
      label: "ਭਾਸ਼ਾ",
      hero_location: "ਸਹਰਸਾ, ਬਿਹਾਰ",
      hero_title: "ਲਗਮਾ ਪਿੰਡ ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ",
      hero_text: "ਖੇਤੀ, ਸਿੱਖਿਆ, ਮੰਦਰਾਂ, ਤਲਾਬਾਂ ਅਤੇ ਸਮੂਹਕ ਭਾਵਨਾ ਨਾਲ ਬਣਿਆ ਇੱਕ ਇਤਿਹਾਸਕ ਅਤੇ ਜੀਵੰਤ ਪਿੰਡ।",
      hero_primary: "ਲਗਮਾ ਵੇਖੋ",
      hero_secondary: "ਪਿੰਡ ਸੇਵਾਵਾਂ",
      achievements_label: "ਉਪਲਬਧੀਆਂ",
      achievements_title: "ਪਿੰਡ ਦੀਆਂ ਮਾਣ ਵਾਲੀਆਂ ਕਹਾਣੀਆਂ",
      achievements_text: "ਲਗਮਾ ਦੀ ਤਾਕਤ ਇਸਦੇ ਵਿਦਿਆਰਥੀਆਂ, ਜਨਸੇਵਾ, ਕਿਸਾਨ ਪਰਿਵਾਰਾਂ ਅਤੇ ਪਿੰਡ ਨਾਲ ਜੁੜੇ ਲੋਕਾਂ ਵਿੱਚ ਦਿਖਦੀ ਹੈ।",
      gold_badge: "ਸੋਨੇ ਦਾ ਤਮਗਾ | ਸ਼੍ਰੁਤੀ ਕੁਮਾਰੀ | ਵੇਟਲਿਫਟਿੰਗ",
      achievement_medal: "<strong>ਵੇਟਲਿਫਟਿੰਗ:</strong> ਸ਼੍ਰੁਤੀ ਕੁਮਾਰੀ ਨੇ ਸੋਨੇ ਦਾ ਤਮਗਾ ਜਿੱਤ ਕੇ ਲਗਮਾ ਦਾ ਮਾਣ ਵਧਾਇਆ।",
      achievement_education: "<strong>ਸਿੱਖਿਆ:</strong> ਵਿਦਿਆਰਥੀ ਇਮਤਿਹਾਨਾਂ ਅਤੇ ਕਰੀਅਰ ਵਿੱਚ ਚੰਗਾ ਪ੍ਰਦਰਸ਼ਨ ਕਰ ਰਹੇ ਹਨ।",
      achievement_service: "<strong>ਸੇਵਾ:</strong> ਕਈ ਪਿੰਡ ਵਾਸੀ ਸਰਕਾਰੀ ਅਤੇ ਨਿੱਜੀ ਖੇਤਰਾਂ ਵਿੱਚ ਯੋਗਦਾਨ ਪਾਉਂਦੇ ਹਨ।",
      achievement_community: "<strong>ਸਮੂਹ:</strong> ਲੋਕ ਤਿਉਹਾਰਾਂ, ਵਿਕਾਸ ਅਤੇ ਮਦਦ ਲਈ ਇਕੱਠੇ ਹੁੰਦੇ ਹਨ।"
    }
  };
  const languageNames = {
    en: "English",
    hi: "Hindi",
    mai: "Maithili",
    bn: "Bengali",
    ur: "Urdu",
    ta: "Tamil",
    te: "Telugu",
    mr: "Marathi",
    gu: "Gujarati",
    pa: "Punjabi"
  };

  function applyLanguage(language) {
    const active = translations[language] ? language : "en";
    document.documentElement.lang = active;
    document.documentElement.dir = active === "ur" ? "rtl" : "ltr";

    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.getAttribute("data-i18n");
      if (translations[active][key]) element.textContent = translations[active][key];
    });

    document.querySelectorAll("[data-i18n-html]").forEach((element) => {
      const key = element.getAttribute("data-i18n-html");
      if (translations[active][key]) element.innerHTML = translations[active][key];
    });

    localStorage.setItem("lagma-language", active);
  }

  const header = document.querySelector(".site-header");
  if (header) {
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
    applyLanguage(languageSelect.value);

    languageSelect.addEventListener("change", () => {
      applyLanguage(languageSelect.value);
      const active = translations[languageSelect.value] || translations.en;
      languageWrap.querySelector("span").textContent = active.label;
    });
    languageWrap.querySelector("span").textContent = translations[languageSelect.value].label;
  }

  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
      menuButton.textContent = isOpen ? "Close" : "Menu";
    });

    nav.addEventListener("click", (event) => {
      if (event.target instanceof HTMLAnchorElement) {
        nav.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.textContent = "Menu";
      }
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  const dynamicGallery = document.querySelector("[data-gallery-limit]");
  if (dynamicGallery) {
    const limit = Number(dynamicGallery.getAttribute("data-gallery-limit")) || 100;
    const extension = dynamicGallery.getAttribute("data-gallery-extension") || "jpeg";
    const loadedCount = document.querySelector("#gallery-loaded-count");
    let foundPhotos = 0;

    for (let index = 1; index <= limit; index++) {
      const slot = document.createElement("figure");
      slot.className = "gallery-slot";

      const image = document.createElement("img");
      image.src = `${index}.${extension}`;
      image.alt = `Lagma village photo ${index}`;
      image.loading = "lazy";

      const placeholder = document.createElement("figcaption");
      placeholder.className = "gallery-placeholder";
      placeholder.innerHTML = `<strong>Photo ${index}</strong><span>Add ${index}.${extension}</span>`;

      image.addEventListener("load", () => {
        foundPhotos += 1;
        slot.classList.add("has-photo");
        if (loadedCount) loadedCount.textContent = foundPhotos;
      });

      image.addEventListener("error", () => {
        image.remove();
        slot.classList.add("is-empty");
      });

      slot.append(image, placeholder);
      dynamicGallery.appendChild(slot);
    }
  }

  const galleryImages = document.querySelectorAll(".gallery-grid img");
  if (galleryImages.length) {
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

    galleryImages.forEach((image) => {
      image.addEventListener("click", () => {
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

  const scrollTop = document.createElement("button");
  scrollTop.className = "scroll-top";
  scrollTop.type = "button";
  scrollTop.textContent = "^";
  scrollTop.setAttribute("aria-label", "Scroll to top");
  document.body.appendChild(scrollTop);

  window.addEventListener("scroll", () => {
    scrollTop.classList.toggle("show", window.scrollY > 450);
  });

  scrollTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  const year = document.querySelector("#year");
  if (year) {
    year.textContent = new Date().getFullYear();
  }
});
