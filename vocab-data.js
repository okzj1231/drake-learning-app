// Shared vocabulary data, used by vocab.html, dashboard.html, index.html and api/chat.js
const VOCAB = {
  greetings: {
    label: "Greetings",
    words: [
      { en: "Hello", ja: "こんにちは", say: "heh-LOH", ex: "Hello! How are you today?" },
      { en: "Thank you", ja: "ありがとう", say: "THANK yoo", ex: "Thank you for your help." },
      { en: "Goodbye", ja: "さようなら", say: "good-BYE", ex: "Goodbye! See you tomorrow." },
      { en: "Excuse me", ja: "すみません", say: "ik-SKYOOZ mee", ex: "Excuse me, where is the station?" },
      { en: "Please", ja: "お願いします", kana: "おねがいします", say: "PLEEZ", ex: "Can I have some water, please?" },
      { en: "Good morning", ja: "おはようございます", say: "good MOR-ning", ex: "Good morning! Did you sleep well?" },
      { en: "Good night", ja: "おやすみなさい", say: "good NITE", ex: "Good night. Sleep well!" },
      { en: "Nice to meet you", ja: "はじめまして", say: "NICE tuh MEET yoo", ex: "Hi, I'm Ken. Nice to meet you." }
    ]
  },
  food: {
    label: "Food",
    words: [
      { en: "Water", ja: "水", kana: "みず", say: "WAW-ter", ex: "Can I have a glass of water?" },
      { en: "Rice", ja: "ご飯", kana: "ごはん", say: "RISE", ex: "I eat rice every day." },
      { en: "Menu", ja: "メニュー", say: "MEN-yoo", ex: "Can I see the menu, please?" },
      { en: "Delicious", ja: "おいしい", say: "dih-LISH-us", ex: "This soup is delicious!" },
      { en: "Breakfast", ja: "朝ごはん", kana: "あさごはん", say: "BREK-fust", ex: "I eat breakfast at seven." },
      { en: "The check", ja: "お会計", kana: "おかいけい", say: "thuh CHEK", ex: "Can we have the check, please?" },
      { en: "Vegetables", ja: "野菜", kana: "やさい", say: "VEJ-tuh-bulz", ex: "I want to eat more vegetables." },
      { en: "Spicy", ja: "辛い", kana: "からい", say: "SPY-see", ex: "Is this curry spicy?" }
    ]
  },
  travel: {
    label: "Travel",
    words: [
      { en: "Airport", ja: "空港", kana: "くうこう", say: "AIR-port", ex: "The airport is very busy today." },
      { en: "Ticket", ja: "切符", kana: "きっぷ", say: "TIK-it", ex: "I need a ticket to Osaka." },
      { en: "Station", ja: "駅", kana: "えき", say: "STAY-shun", ex: "Where is the nearest station?" },
      { en: "Hotel", ja: "ホテル", say: "hoh-TEL", ex: "Our hotel is near the beach." },
      { en: "Passport", ja: "パスポート", say: "PASS-port", ex: "Please show me your passport." },
      { en: "Map", ja: "地図", kana: "ちず", say: "MAP", ex: "Can you show me on the map?" },
      { en: "Luggage", ja: "荷物", kana: "にもつ", say: "LUG-ij", ex: "My luggage is very heavy." },
      { en: "Reservation", ja: "予約", kana: "よやく", say: "rez-er-VAY-shun", ex: "I have a reservation for two nights." }
    ]
  },
  business: {
    label: "Business",
    words: [
      { en: "Meeting", ja: "会議", kana: "かいぎ", say: "MEE-ting", ex: "The meeting starts at ten." },
      { en: "Schedule", ja: "予定", kana: "よてい", say: "SKEJ-ool", ex: "Let me check my schedule." },
      { en: "Colleague", ja: "同僚", kana: "どうりょう", say: "KOL-eeg", ex: "My colleague is from Canada." },
      { en: "Deadline", ja: "締め切り", kana: "しめきり", say: "DED-line", ex: "The deadline is next Friday." },
      { en: "Presentation", ja: "プレゼン", say: "prez-en-TAY-shun", ex: "I have a presentation tomorrow." },
      { en: "Contract", ja: "契約", kana: "けいやく", say: "KON-trakt", ex: "Please sign the contract here." },
      { en: "Business card", ja: "名刺", kana: "めいし", say: "BIZ-nis kard", ex: "Here is my business card." },
      { en: "Email", ja: "メール", say: "EE-mayl", ex: "I will send you an email." }
    ]
  }
};

// Also loadable from Node (api/chat.js uses it to build the tutor's word list)
if (typeof module !== "undefined") module.exports = VOCAB;
