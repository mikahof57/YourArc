export type Language = 'de' | 'en';

const LANGUAGE_KEY = 'arc_app_language';

export function getStoredLanguage(): Language {
  try {
    const lang = localStorage.getItem(LANGUAGE_KEY);
    if (lang === 'en' || lang === 'de') return lang;
  } catch (e) {
    // Fallback
  }
  return 'en';
}

export function setStoredLanguage(lang: Language): void {
  try {
    localStorage.setItem(LANGUAGE_KEY, lang);
  } catch (e) {
    // Ignore
  }
}

export const TRANSLATIONS = {
  de: {
    introLabel: "Dein Start in MY ARC",
    introReplay: "App-Einführung erneut anzeigen",
    introSkip: "Überspringen",
    introBack: "Zurück",
    introNext: "Weiter",
    introFinish: "Los geht’s",
    introSaving: "Wird gespeichert…",
    introError: "Das Speichern hat nicht geklappt. Bitte versuche es erneut.",
    introStatsTitle: "Deine Stats",
    introStatsBody: "Das sind deine sechs Stats. Sie zeigen, wie sich dein Charakter in den wichtigsten Bereichen entwickelt.",
    introTasksTitle: "Deine Tagesaufgaben",
    introTasksBody: "Jeden Tag bekommst du Aufgaben für deine aktiven Stats. Erledige sie, um deine Werte zu steigern und deinen Charakter weiterzuentwickeln.",
    introQuoteTitle: "Tägliche Motivation",
    introQuoteBody: "Auf der Übersicht begleitet dich jeden Tag ein Gedanke. Unter Einstellungen → Motivation wählst du die Quellen deiner Zitate.",
    introMissionsTitle: "Missionen",
    introMissionsBody: "Wähle eine Mission für ein größeres Ziel. Erfülle ihre Bedingungen und erhalte nach Abschluss deine Belohnung.",
    introShopTitle: "Shop & Design",
    introShopBody: "Mit Credits schaltest du Skins für deinen Charakter frei. Missionen und Erfolge bringen dir weitere Credits. Wenn du möchtest, such dir im Shop deinen ersten Skin aus.",
    introReadyTitle: "Du bist bereit",
    introReadyBody: "Starte mit deinen Tagesaufgaben und baue deinen eigenen ARC auf. Im Menü findest du Einstellungen, Kalender, Statistik und Wochenplan. Der ARC App Hub ist für kommende Begleit-Apps reserviert.",
    introTask: "Tagesaufgabe",
    introDone: "Erledigen",
    introGrowth: "Stat steigt",
    introProgress: "Fortschritt",
    introQuote: "Ein kleiner Schritt zählt.",
    introSources: "Einstellungen · Motivation · Zitate-Quelle",
    introMission: "Dein nächstes Ziel",
    introMissionProgress: "Schritt für Schritt",
    introStartingCredits: "Du startest mit 100 Credits.",
    introSkin: "Dein Look",
    introHome: "Übersicht",
    introMissions: "Missionen",
    introHub: "ARC App Hub",
    introShop: "Shop & Design",
    introMenu: "Menü",
    introSoon: "Demnächst",
    introPreview: "So sieht es aus",
    // App Header & Branding
    appTitle: 'MY ARC',
    appSubtitle: 'CYBERPUNK CHARACTER SYSTEM',
    credits: 'Credits',
    settings: 'Einstellungen',
    community: 'ARC App Hub',
    shop: 'Shop & Design',
    calendar: 'Kalender',
    level: 'LEVEL',
    consecutiveDays: 'Tage-Streak',
    newCharacter: 'Neuen Charakter erstellen',
    login: 'Anmelden',
    activeStatus: 'STATUS: AKTIV',
    soundOn: 'Ton ausschalten',
    soundOff: 'Ton einschalten',
    stats: 'Statistik',
    appHubTitle: 'ARC App Hub',
    appHubSubtitle: 'Sechs lokale Schnittstellen für das kommende ARC Begleit-App-Ökosystem.',
    appHubCompanionSlots: 'Begleit-App-Slots',
    appHubLocalProtocol: 'LOKALES APP-PROTOKOLL',
    appHubLocalExplanation: 'Jede künftige Begleit-App ist fest mit einem ARC-Statuswert verbunden. Bis zur Veröffentlichung bleiben alle Schnittstellen sicher deaktiviert.',
    appHubSlot: 'SLOT',
    appHubPlaceholderLabel: 'ARC BEGLEIT-APP',
    appHubAssociatedStat: 'ZUGEORDNETER STATUSWERT',
    appHubStatus_coming_soon: 'DEMÄCHST',
    appHubStatus_available: 'VERFÜGBAR',
    appHubStatus_installed: 'INSTALLIERT',
    appHubStatus_connected: 'VERBUNDEN',
    appHubComingSoonAction: 'DEMÄCHST VERFÜGBAR',
    appHubAction_available: 'INSTALLATION VERFÜGBAR',
    appHubAction_installed: 'LOKALE VERBINDUNG AUSSTEHEND',
    appHubAction_connected: 'LOKAL VERBUNDEN',

    // HUD & Stats
    dailyProtocols: 'TÄGLICHE PROTOKOLLE & AKTIONEN',
    clickToComplete: 'KLICKE ZUM ABSCHLIESSEN',
    statusDone: 'ERLEDIGT',
    statusOpen: 'OFFEN',
    dailyQuote: 'MOTIVATIONS-IMPULS DES TAGES',
    changeCategory: 'Kategorie Ändern',
    statusAttributes: 'STATUS ATTRIBUTE',
    target100: 'ZIEL: 100%',

    // Task Modal
    statValue: 'STATUSWERT',
    dailyTaskTitle: 'Tages-Aufgabe:',
    close: 'Schließen',
    cancel: 'Abbrechen',
    markDone: 'Erledigt',
    alreadyDone: 'Bereits Erledigt',

    // Settings Modal
    systemSettings: 'SYSTEM EINSTELLUNGEN',
    tabStats: 'Statuswerte & Aufgaben',
    tabProfile: 'Profil',
    tabMotivation: 'Motivation',
    tabBottomBar: 'Untere Leiste',
    tabDesign: 'Design & Animationen',
    tabLanguage: 'Sprache / Language',
    languageSettingLabel: 'App-Sprache auswählen (Language)',
    german: 'Deutsch (DE)',
    english: 'English (EN)',

    // Profile Settings
    profileTitle: 'Profil & Charakter Daten Anpassen',
    nameLabel: 'Name / Codename',
    genderLabel: 'Geschlecht',
    male: '♂ Männlich',
    female: '♀ Weiblich',
    weightLabel: 'Gewicht (kg)',
    heightLabel: 'Größe (cm)',
    unlockedSkins: 'Freigeschaltete Premium-Skins',
    saveAndClose: 'Speichern & Schließen',

    // Stats Management
    manageStats: 'Statuswerte verwalten',
    newStat: 'Neuer Statuswert',
    addCustomTask: 'Eigene Aufgabe hinzufügen',
    reorderNotice: 'Ziehe Aufgaben per Drag & Drop in den Mülleimer unten zum Löschen.',
    restoreDeleted: 'Gelöschte Aufgaben wiederherstellen',

    // Calendar
    privateCalendar: 'Privater Kalender',
    groupCalendar: 'Gruppenkalender',
    createGroupCalendar: 'Gruppenkalender erstellen',
    addEntry: 'Neuer Eintrag',
    appointments: 'Termine & Ziele',
    noEventsToday: 'Keine Einträge für dieses Datum',

    // Common
    loading: 'Lade...',
    save: 'Speichern',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    success: 'Erfolgreich',
    error: 'Fehler',
  },
  en: {
    introLabel: "Welcome to MY ARC",
    introReplay: "Replay app introduction",
    introSkip: "Skip",
    introBack: "Back",
    introNext: "Next",
    introFinish: "Let’s go",
    introSaving: "Saving…",
    introError: "Could not save. Please try again.",
    introStatsTitle: "Your stats",
    introStatsBody: "Meet your six stats. They show how your character develops across the key areas of your life.",
    introTasksTitle: "Your daily tasks",
    introTasksBody: "Each day brings tasks for your active stats. Complete them to improve your stats and develop your character.",
    introQuoteTitle: "Daily motivation",
    introQuoteBody: "Find a daily thought on your Overview. Choose your quote sources under Settings → Motivation.",
    introMissionsTitle: "Missions",
    introMissionsBody: "Choose a mission for a bigger goal. Meet its requirements and receive your reward when it is complete.",
    introShopTitle: "Shop & Design",
    introShopBody: "Use Credits to unlock skins for your character. Missions and achievements earn you more Credits. Pick your first skin in the Shop whenever you like.",
    introReadyTitle: "You’re ready",
    introReadyBody: "Start with your daily tasks and build your own ARC. Find Settings, Calendar, Statistics and Weekly Routine in Menu. The ARC App Hub is reserved for upcoming companion apps.",
    introTask: "Daily task",
    introDone: "Complete",
    introGrowth: "Stat improves",
    introProgress: "Progress",
    introQuote: "A small step counts.",
    introSources: "Settings · Motivation · Quote Sources",
    introMission: "Your next goal",
    introMissionProgress: "Step by step",
    introStartingCredits: "You start with 100 Credits.",
    introSkin: "Your look",
    introHome: "Overview",
    introMissions: "Missions",
    introHub: "ARC App Hub",
    introShop: "Shop & Design",
    introMenu: "Menu",
    introSoon: "Coming soon",
    introPreview: "A quick preview",
    // App Header & Branding
    appTitle: 'MY ARC',
    appSubtitle: 'CYBERPUNK CHARACTER SYSTEM',
    credits: 'Credits',
    settings: 'Settings',
    community: 'ARC App Hub',
    shop: 'Shop & Design',
    calendar: 'Calendar',
    level: 'LEVEL',
    consecutiveDays: 'Days Streak',
    newCharacter: 'Create New Character',
    login: 'Login',
    activeStatus: 'STATUS: ACTIVE',
    soundOn: 'Mute Sound',
    soundOff: 'Unmute Sound',
    stats: 'Stats',
    appHubTitle: 'ARC App Hub',
    appHubSubtitle: 'Six local interfaces for the upcoming ARC companion-app ecosystem.',
    appHubCompanionSlots: 'Companion app slots',
    appHubLocalProtocol: 'LOCAL APP PROTOCOL',
    appHubLocalExplanation: 'Each future companion app is permanently associated with one ARC stat. All interfaces remain safely disabled until release.',
    appHubSlot: 'SLOT',
    appHubPlaceholderLabel: 'ARC COMPANION APP',
    appHubAssociatedStat: 'ASSOCIATED ARC STAT',
    appHubStatus_coming_soon: 'COMING SOON',
    appHubStatus_available: 'AVAILABLE',
    appHubStatus_installed: 'INSTALLED',
    appHubStatus_connected: 'CONNECTED',
    appHubComingSoonAction: 'COMING SOON',
    appHubAction_available: 'INSTALLATION AVAILABLE',
    appHubAction_installed: 'AWAITING LOCAL CONNECTION',
    appHubAction_connected: 'LOCALLY CONNECTED',

    // HUD & Stats
    dailyProtocols: 'DAILY PROTOCOLS & ACTIONS',
    clickToComplete: 'CLICK TO COMPLETE',
    statusDone: 'COMPLETED',
    statusOpen: 'OPEN',
    dailyQuote: 'DAILY MOTIVATIONAL PROTOCOL',
    changeCategory: 'Change Category',
    statusAttributes: 'STAT ATTRIBUTES',
    target100: 'GOAL: 100%',

    // Task Modal
    statValue: 'STAT VALUE',
    dailyTaskTitle: 'Daily Task:',
    close: 'Close',
    cancel: 'Cancel',
    markDone: 'Mark Done',
    alreadyDone: 'Already Done',

    // Settings Modal
    systemSettings: 'SYSTEM SETTINGS',
    tabStats: 'Stats & Tasks',
    tabProfile: 'Profile',
    tabMotivation: 'Motivation',
    tabBottomBar: 'Bottom Bar',
    tabDesign: 'Design & FX',
    tabLanguage: 'Language / Sprache',
    languageSettingLabel: 'Select App Language (Sprache)',
    german: 'Deutsch (DE)',
    english: 'English (EN)',

    // Profile Settings
    profileTitle: 'Customize Profile & Character Data',
    nameLabel: 'Name / Codename',
    genderLabel: 'Gender',
    male: '♂ Male',
    female: '♀ Female',
    weightLabel: 'Weight (kg)',
    heightLabel: 'Height (cm)',
    unlockedSkins: 'Unlocked Premium Skins',
    saveAndClose: 'Save & Close',

    // Stats Management
    manageStats: 'Manage Stats',
    newStat: 'New Stat',
    addCustomTask: 'Add Custom Task',
    reorderNotice: 'Drag & drop tasks into the trash below to delete.',
    restoreDeleted: 'Restore Deleted Tasks',

    // Calendar
    privateCalendar: 'Private Calendar',
    groupCalendar: 'Group Calendar',
    createGroupCalendar: 'Create Group Calendar',
    addEntry: 'New Entry',
    appointments: 'Events & Goals',
    noEventsToday: 'No entries for this date',

    // Common
    loading: 'Loading...',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    success: 'Success',
    error: 'Error',
  },
};

export function t(key: keyof typeof TRANSLATIONS['de'], lang: Language | string = 'en'): string {
  const currentLang: Language = lang === 'de' ? 'de' : 'en';
  return TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS['de'][key] || key;
}

export function translateStatName(name: string, lang: Language | string = 'en'): string {
  if (!name) return name;
  const currentLang: Language = lang === 'de' ? 'de' : 'en';
  const n = name.trim().toLowerCase();
  if (currentLang === 'de') {
    switch (n) {
      case 'knowledge': return 'Wissen';
      case 'strength':
      case 'muscle':
      case 'muscles': return 'Muskeln';
      case 'mind':
      case 'spirit': return 'Geist';
      case 'agility':
      case 'flexibility': return 'Beweglichkeit';
      case 'wealth':
      case 'money': return 'Geld';
      default: return name;
    }
  } else {
    switch (n) {
      case 'wissen': return 'Knowledge';
      case 'muskeln': return 'Strength';
      case 'geist': return 'Mind';
      case 'beweglichkeit': return 'Agility';
      case 'geld': return 'Wealth';
      default: return name;
    }
  }
}
