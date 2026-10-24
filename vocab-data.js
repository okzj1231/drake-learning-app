// Shared vocabulary data, used by vocab.html, dashboard.html, index.html and api/chat.js
// it: Italian translation. say: pronunciation spelled the way an Italian would read it
// (CAPITALS = stressed syllable).
const VOCAB = {
  greetings: {
    label: "Greetings",
    words: [
      { en: "Hello", it: "Ciao / Salve", say: "he-LOU", ex: "Hello! How are you today?" },
      { en: "Thank you", it: "Grazie", say: "THENK iu", ex: "Thank you for your help." },
      { en: "Goodbye", it: "Arrivederci", say: "gud-BAI", ex: "Goodbye! See you tomorrow." },
      { en: "Excuse me", it: "Mi scusi", say: "ex-SKIUS mi", ex: "Excuse me, where is the station?" },
      { en: "Please", it: "Per favore", say: "PLIIS", ex: "Can I have some water, please?" },
      { en: "Good morning", it: "Buongiorno", say: "gud MOR-ning", ex: "Good morning! Did you sleep well?" },
      { en: "Good night", it: "Buonanotte", say: "gud NAIT", ex: "Good night. Sleep well!" },
      { en: "Nice to meet you", it: "Piacere di conoscerti", say: "NAIS tu MIIT iu", ex: "Hi, I'm Marco. Nice to meet you." }
    ]
  },
  food: {
    label: "Food",
    words: [
      { en: "Water", it: "Acqua", say: "UO-ter", ex: "Can I have a glass of water?" },
      { en: "Rice", it: "Riso", say: "RAIS", ex: "I eat rice every day." },
      { en: "Menu", it: "Menù", say: "ME-niu", ex: "Can I see the menu, please?" },
      { en: "Delicious", it: "Delizioso", say: "di-LI-scias", ex: "This soup is delicious!" },
      { en: "Breakfast", it: "Colazione", say: "BREK-fast", ex: "I eat breakfast at seven." },
      { en: "The check", it: "Il conto", say: "dhe CEK", ex: "Can we have the check, please?" },
      { en: "Vegetables", it: "Verdure", say: "VE-gi-ta-bols", ex: "I want to eat more vegetables." },
      { en: "Spicy", it: "Piccante", say: "SPAI-si", ex: "Is this curry spicy?" }
    ]
  },
  travel: {
    label: "Travel",
    words: [
      { en: "Airport", it: "Aeroporto", say: "ER-port", ex: "The airport is very busy today." },
      { en: "Ticket", it: "Biglietto", say: "TI-chet", ex: "I need a ticket to London." },
      { en: "Station", it: "Stazione", say: "STEI-scion", ex: "Where is the nearest station?" },
      { en: "Hotel", it: "Albergo / Hotel", say: "hou-TEL", ex: "Our hotel is near the beach." },
      { en: "Passport", it: "Passaporto", say: "PAS-port", ex: "Please show me your passport." },
      { en: "Map", it: "Mappa / Cartina", say: "MEP", ex: "Can you show me on the map?" },
      { en: "Luggage", it: "Bagagli", say: "LA-ghigi", ex: "My luggage is very heavy." },
      { en: "Reservation", it: "Prenotazione", say: "re-ser-VEI-scion", ex: "I have a reservation for two nights." }
    ]
  },
  business: {
    label: "Business",
    words: [
      { en: "Meeting", it: "Riunione", say: "MII-ting", ex: "The meeting starts at ten." },
      { en: "Schedule", it: "Agenda / Programma", say: "SKE-giul", ex: "Let me check my schedule." },
      { en: "Colleague", it: "Collega", say: "CO-liig", ex: "My colleague is from Canada." },
      { en: "Deadline", it: "Scadenza", say: "DED-lain", ex: "The deadline is next Friday." },
      { en: "Presentation", it: "Presentazione", say: "pre-sen-TEI-scion", ex: "I have a presentation tomorrow." },
      { en: "Contract", it: "Contratto", say: "CON-trakt", ex: "Please sign the contract here." },
      { en: "Business card", it: "Biglietto da visita", say: "BIS-nis card", ex: "Here is my business card." },
      { en: "Email", it: "Email", say: "II-meil", ex: "I will send you an email." }
    ]
  }
};

// Also loadable from Node (api/chat.js uses it to build the tutor's word list)
if (typeof module !== "undefined") module.exports = VOCAB;
