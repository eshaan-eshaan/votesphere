import React, { createContext, useContext, useState } from "react";

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

const translations = {
  en: {
    navOverview: "Overview",
    navKiosk: "Kiosk Demo",
    navAdmin: "Admin View",
    navArchitecture: "Architecture",
    // Landing
    landingTitle: "End‑to‑End Encrypted & Inclusive Voting System",
    landingSubtitle: "A secure, transparent, and device‑independent voting platform designed for Indian SMEs, universities, NGOs, and housing societies. Combines client‑side encryption, server‑blind architecture, and tamper‑proof ledger storage.",
    btnKioskDemo: "Try Kiosk Demo",
    btnAdminDash: "View Admin Dashboard",
    whyTitle: "Why This System?",
    whySubtitle: "Existing organizational voting is centralized, vulnerable, and excludes those without smartphones.",
    featureE2E: "End‑to‑End Encryption",
    featureE2EDesc: "Votes are encrypted at the kiosk using public‑key cryptography before transmission. Servers never see plaintext ballots.",
    featureServerBlind: "Server‑Blind Voting",
    featureServerBlindDesc: "Backend infrastructure only handles ciphertext and metadata. Even if compromised, votes remain confidential.",
    featureInclusive: "Inclusive Access",
    featureInclusiveDesc: "Secure kiosks and assisted terminals let every voter participate without requiring personal smartphones or devices.",
    featureLedger: "Tamper‑Proof Ledger",
    featureLedgerDesc: "Encrypted votes are anchored to an immutable ledger or blockchain for complete transparency and auditability.",
    targetMarket: "Target Market",
    // Kiosk
    kioskTitle: "Secure Voting Kiosk Demo",
    kioskSubtitle: "Experience the complete voter journey: identity verification, ballot selection, and client‑side encryption before submission.",
    step1Title: "Identity Verification (Smart Card / Biometric)",
    step1Desc: "In a real deployment, this would authenticate via smart card reader, fingerprint scanner, or Aadhaar‑based biometric. For this demo, we use a mock Voter ID input.",
    voterIdPlaceholder: "Enter Voter ID (e.g., V12345)",
    btnVerify: "Verify Identity",
    step2Title: "Cast Your Vote – Society Chairperson Election 2026",
    step2Desc: "Select one candidate below. Your choice will be encrypted on this device before being transmitted to the backend.",
    btnCastVote: "Cast Encrypted Vote",
    encryptionPanel: "Client‑Side Encryption Panel",
    voteSuccess: "Your vote has been encrypted and submitted successfully (demo).",
    receiptTitle: "Vote Receipt",
    receiptDesc: "Save this receipt for your records. You can use the Ballot ID to verify your vote was counted (without revealing your choice).",
    // Admin
    adminTitle: "Admin Dashboard – Society Chairperson Election 2026",
    adminSubtitle: "Real‑time overview of encrypted ballots, turnout metrics, and tamper‑proof ledger timeline.",
    totalVoters: "Total Voters",
    votesCast: "Votes Cast",
    turnoutPercent: "Turnout %",
    ledgerTitle: "Tamper‑Proof Ledger Timeline (Concept)",
  },
  hi: {
    navOverview: "अवलोकन",
    navKiosk: "कियोस्क डेमो",
    navAdmin: "एडमिन व्यू",
    navArchitecture: "आर्किटेक्चर",
    // Landing
    landingTitle: "एंड-टू-एंड एन्क्रिप्टेड और समावेशी वोटिंग सिस्टम",
    landingSubtitle: "भारतीय SMEs, विश्वविद्यालयों, NGOs और हाउसिंग सोसाइटी के लिए एक सुरक्षित, पारदर्शी और डिवाइस-स्वतंत्र वोटिंग प्लेटफॉर्म। क्लाइंट-साइड एन्क्रिप्शन, सर्वर-ब्लाइंड आर्किटेक्चर और टेम्पर-प्रूफ लेजर स्टोरेज को जोड़ता है।",
    btnKioskDemo: "कियोस्क डेमो आज़माएं",
    btnAdminDash: "एडमिन डैशबोर्ड देखें",
    whyTitle: "यह सिस्टम क्यों?",
    whySubtitle: "मौजूदा संगठनात्मक वोटिंग केंद्रीकृत, कमजोर है और स्मार्टफोन के बिना लोगों को बाहर करती है।",
    featureE2E: "एंड-टू-एंड एन्क्रिप्शन",
    featureE2EDesc: "वोट कियोस्क पर पब्लिक-की क्रिप्टोग्राफी का उपयोग करके ट्रांसमिशन से पहले एन्क्रिप्ट किए जाते हैं। सर्वर कभी भी प्लेनटेक्स्ट बैलट नहीं देखते।",
    featureServerBlind: "सर्वर-ब्लाइंड वोटिंग",
    featureServerBlindDesc: "बैकएंड इंफ्रास्ट्रक्चर केवल सिफरटेक्स्ट और मेटाडेटा को हैंडल करता है। समझौता किए जाने पर भी, वोट गोपनीय रहते हैं।",
    featureInclusive: "समावेशी पहुंच",
    featureInclusiveDesc: "सुरक्षित कियोस्क और सहायक टर्मिनल प्रत्येक मतदाता को व्यक्तिगत स्मार्टफोन या उपकरणों की आवश्यकता के बिना भाग लेने देते हैं।",
    featureLedger: "टेम्पर-प्रूफ लेजर",
    featureLedgerDesc: "एन्क्रिप्टेड वोट पूर्ण पारदर्शिता और ऑडिटेबिलिटी के लिए अपरिवर्तनीय लेजर या ब्लॉकचेन पर एंकर किए जाते हैं।",
    targetMarket: "लक्षित बाजार",
    // Kiosk
    kioskTitle: "सुरक्षित वोटिंग कियोस्क डेमो",
    kioskSubtitle: "पूरी मतदाता यात्रा का अनुभव करें: पहचान सत्यापन, मतपत्र चयन, और सबमिशन से पहले क्लाइंट-साइड एन्क्रिप्शन।",
    step1Title: "पहचान सत्यापन (स्मार्ट कार्ड / बायोमेट्रिक)",
    step1Desc: "वास्तविक परिनियोजन में, यह स्मार्ट कार्ड रीडर, फिंगरप्रिंट स्कैनर, या आधार-आधारित बायोमेट्रिक के माध्यम से प्रमाणित करेगा। इस डेमो के लिए, हम मॉक वोटर आईडी इनपुट का उपयोग करते हैं।",
    voterIdPlaceholder: "वोटर आईडी दर्ज करें (उदा. V12345)",
    btnVerify: "पहचान सत्यापित करें",
    step2Title: "अपना वोट डालें – सोसाइटी चेयरपर्सन चुनाव 2026",
    step2Desc: "नीचे एक उम्मीदवार चुनें। आपकी पसंद बैकएंड में प्रसारित होने से पहले इस डिवाइस पर एन्क्रिप्ट की जाएगी।",
    btnCastVote: "एन्क्रिप्टेड वोट डालें",
    encryptionPanel: "क्लाइंट-साइड एन्क्रिप्शन पैनल",
    voteSuccess: "आपका वोट सफलतापूर्वक एन्क्रिप्ट और सबमिट किया गया (डेमो)।",
    receiptTitle: "वोट रसीद",
    receiptDesc: "अपने रिकॉर्ड के लिए इस रसीद को सहेजें। आप बैलट आईडी का उपयोग यह सत्यापित करने के लिए कर सकते हैं कि आपका वोट गिना गया था (अपनी पसंद को प्रकट किए बिना)।",
    // Admin
    adminTitle: "एडमिन डैशबोर्ड – सोसाइटी चेयरपर्सन चुनाव 2026",
    adminSubtitle: "एन्क्रिप्टेड बैलट, टर्नआउट मेट्रिक्स और टेम्पर-प्रूफ लेजर टाइमलाइन का रीयल-टाइम अवलोकन।",
    totalVoters: "कुल मतदाता",
    votesCast: "डाले गए वोट",
    turnoutPercent: "टर्नआउट %",
    ledgerTitle: "टेम्पर-प्रूफ लेजर टाइमलाइन (अवधारणा)",
  },
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("en");

  const t = (key) => translations[language][key] || key;

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "hi" : "en"));
  };

  return (
    <LanguageContext.Provider value={{ language, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
