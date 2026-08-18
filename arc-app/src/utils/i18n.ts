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
    // App Header & Branding
    appTitle: 'MY ARC',
    appSubtitle: 'CYBERPUNK CHARACTER SYSTEM',
    credits: 'Credits',
    settings: 'Einstellungen',
    community: 'Community & Clans',
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
    chat: 'Chat',

    // Register / Auth
    registerTitle: 'MY ARC REGISTRIERUNG',
    registerSubtitle: 'Erstelle dein operatives Cyber-Profil',
    usernameLabel: 'Benutzername / Operativer Name',
    usernamePlaceholder: 'z.B. CyberRunner99',
    emailLabel: 'E-Mail-Adresse',
    emailPlaceholder: 'dein.name@domain.com',
    passwordLabel: 'Passwort',
    passwordPlaceholder: '••••••••••••',
    submitRegister: 'Account Erstellen & Starten',
    registerSuccess: 'Registrierung erfolgreich! Willkommen bei MY ARC.',
    registerError: 'Registrierungsfehler. Bitte überprüfe deine Eingaben.',
    alreadyHaveAccount: 'Bereits einen Account? Als Gast fortfahren',
    continueAsGuest: 'Als Gast fortfahren',

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
    freeAvatars: 'Kostenlose Standard-Profilbilder',
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
    // App Header & Branding
    appTitle: 'MY ARC',
    appSubtitle: 'CYBERPUNK CHARACTER SYSTEM',
    credits: 'Credits',
    settings: 'Settings',
    community: 'Community & Clans',
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
    chat: 'Chat',

    // Register / Auth
    registerTitle: 'MY ARC REGISTRATION',
    registerSubtitle: 'Create your operative Cyber Profile',
    usernameLabel: 'Username / Operative Handle',
    usernamePlaceholder: 'e.g. CyberRunner99',
    emailLabel: 'Email Address',
    emailPlaceholder: 'your.name@domain.com',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••••••',
    submitRegister: 'Create Account & Start',
    registerSuccess: 'Registration successful! Welcome to MY ARC.',
    registerError: 'Registration error. Please check your inputs.',
    alreadyHaveAccount: 'Already have an account? Continue as guest',
    continueAsGuest: 'Continue as Guest',

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
    freeAvatars: 'Free Standard Avatars',
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

