import { TaskItem } from '../types';
import { Language, translateStatName } from '../utils/i18n';

export function getTierIndex(valuePercent: number): number {
  const percent = Math.max(0, Math.min(100, valuePercent));
  return Math.min(12, Math.floor(percent / 8));
}

export function getTierInfo(tierIndex: number, lang: Language | string = 'de'): {
  tierIndex: number;
  levelNumber: number;
  minPercent: number;
  maxPercent: number;
  label: string;
} {
  const currentLang = lang === 'en' ? 'en' : 'de';
  const levelNumber = tierIndex + 1;
  const minPercent = tierIndex * 8;
  const maxPercent = tierIndex === 12 ? 100 : minPercent + 7;
  const labelText = currentLang === 'en' ? 'Level' : 'Stufe';
  return {
    tierIndex,
    levelNumber,
    minPercent,
    maxPercent,
    label: `${labelText} ${levelNumber} (${minPercent}% - ${maxPercent}%)`,
  };
}

// 13 Tiers total (0 to 12)
// Tier 0-11: 28 tasks each (336) + Tier 12: 29 tasks = 365 tasks total per stat

const STAT_THEMED_TASK_PATTERNS: Record<
  string,
  {
    titles: string[][]; // 13 tiers of title themes
    descriptions: string[][]; // 13 tiers of description templates
  }
> = {
  wissen: {
    titles: [
      // Tier 0 (0-7%)
      [
        'Lesen & Einblick',
        'Begriff lernen',
        'Kurzartikel lesen',
        'Sachbuch anfangen',
        'Wissens-Notiz',
        'Dokumentation 10 Min',
        'Podcast Reinhören',
      ],
      // Tier 1 (8-15%)
      [
        'Sachbuch 15 Min',
        'Fachthema Anreißer',
        'Vokabeln & Begriffe',
        'Lern-Podcast 15 Min',
        'Wissens-Zusammenfassung',
        'Spiegel / Zeit Artikel',
        'Online-Kurs Modul 1',
      ],
      // Tier 2 (16-23%)
      [
        'Kapitel intensiv lesen',
        'Mindmap erstellen',
        '3 Kern-Konzepte',
        'Fach-Blog durcharbeiten',
        'Recherche-Session 20 Min',
        'Lernkarten schreiben',
        'Audiobook 20 Min',
      ],
      // Tier 3 (24-31%)
      [
        'Sachbuch 25 Min',
        'Fachartikel analysieren',
        'Zusammenfassung verfassen',
        'Dokumentation 30 Min',
        'Methode erlernen',
        'Wissens-Quiz erstellen',
        'Biografie studieren',
      ],
      // Tier 4 (32-39%)
      [
        'Deep Reading 30 Min',
        'Komplexes Thema recherchieren',
        'Fachtext vergleichen',
        'Lern-Session mit Notizen',
        'Wissenschafts-Podcast 30 Min',
        'Expertise-Note schreiben',
        'Formel / Gesetz verstehen',
      ],
      // Tier 5 (40-47%)
      [
        'Sachbuch 35 Min & Notizen',
        'Fachbuch Kapitel analysieren',
        'Online-Kurs Lektion 40 Min',
        'Wissens-Synthese schreiben',
        'Recherche-Dossier erstellen',
        'Glossar mit 15 Begriffen',
        'Debatte studieren',
      ],
      // Tier 6 (48-55%)
      [
        'Fachtext Deep Dive 40 Min',
        'Wissenschaftliche Studie lesen',
        'Akademischen Artikel zusammenfassen',
        'Komplexes Modell zeichnen',
        'Kritisches Essay entwerfen',
        'Lern-Protokoll 45 Min',
        'Fachbegriffe Meistern',
      ],
      // Tier 7 (56-63%)
      [
        'Sachbuch 45 Min im Fokus',
        'Fallstudie durcharbeiten',
        'Wissens-Architektur bauen',
        'Paper-Analyse verfassen',
        'Expert-Lecture 45 Min',
        'Theorie-Systematisierung',
        'Literatur-Recherche',
      ],
      // Tier 8 (64-71%)
      [
        'Studie Deep Dive 50 Min',
        'Sachbuch 50 Min durcharbeiten',
        'Methodik kritisch prüfen',
        'Wissens-Graph zeichnen',
        'Fachaufsatz verfassen',
        'Intensiv-Kurs Absolvieren',
        'Gedächtnis-Protokoll',
      ],
      // Tier 9 (72-79%)
      [
        'Experten-Buch 60 Min',
        'Wissenschaftliches Paper analysieren',
        'Komplexes System dokumentieren',
        'Forschungsstand zusammenfassen',
        'Master-Note verfassen',
        'Theorie-Synthese 60 Min',
        'Lehrbuch-Kapitel meistern',
      ],
      // Tier 10 (80-87%)
      [
        'Intensives Studium 75 Min',
        'Fachliteratur-Vergleich',
        'Wissenschafts-Dossier 75 Min',
        'Komplexe Analyse ausarbeiten',
        'Eigenes Lernskript verfassen',
        'Forschungsfrage beantworten',
        'Experten-Modell konstruieren',
      ],
      // Tier 11 (88-95%)
      [
        'Meister-Lernsession 90 Min',
        'Monografie durcharbeiten',
        'Umfassendes Fach-Dossier',
        'Wissenschaftliches Paper zerlegen',
        'Lehrvortrag vorbereiten',
        'Theorie-Analyse 90 Min',
        'Wissens-Enzyklopädie Eintrag',
      ],
      // Tier 12 (96-100%)
      [
        'Elite Studium 2 Stunden',
        'Vollständige Monografie-Analyse',
        'Master-Thesis Konzept',
        'Wissenschaftliches Manifest',
        'Komplexes Fachgebiet durchdringen',
        'Lehrskript für Dritte verfassen',
        'Wissens-Ultra-Marathon',
      ],
    ],
    descriptions: [
      [
        'Lies 5 bis 10 Minuten in einem Buch deiner Wahl.',
        'Lerne 3 neue Fachbegriffe und notiere ihre Bedeutung.',
        'Lies einen interessanten Kurzartikel im Internet.',
        'Notiere dir eine Frage, die du heute recherchieren willst.',
      ],
      [
        'Lies 15 Minuten konzentriert in einem Sachbuch.',
        'Höre 15 Minuten einen Wissens-Podcast.',
        'Lerne 5 neue Vokabeln oder Fachbegriffe.',
        'Fasse das Gelesene in 2 Sätzen zusammen.',
      ],
      [
        'Lies 20 Minuten ohne Smartphone-Ablenkung.',
        'Erstelles eine kurze Mindmap zu einem Fachthema.',
        'Schreibe 3 Kernerkenntnisse des Tages auf.',
        'Arbeite 20 Minuten ein Lehrbuch-Kapitel durch.',
      ],
      [
        'Lies 25 Minuten in einem Fach- oder Strategiebuch.',
        'Schaue eine 30-minütige wissenschaftliche Dokumentation.',
        'Schreibe eine strukturierte Zusammenfassung eines Artikels.',
        'Analysiere ein biologisches oder technisches Konzept.',
      ],
      [
        'Absolviere 30 Minuten fokussierte Lese- und Recherchezeit.',
        'Erstelle Karteikarten für 10 komplexe Begriffe.',
        'Höre einen 30-minütigen Experten-Podcast und mache Notizen.',
        'Erkläre ein schwieriges Thema schriftlich in einfachen Worten.',
      ],
      [
        'Lies 35 Minuten im Sachbuch und markiere Kernpassagen.',
        'Erstelle ein digitales Recherche-Dossier zu einem Fachthema.',
        'Absolviere 40 Minuten in einem Online-Lernkurs.',
        'Schreibe 1 Seite Zusammenfassung über ein Fachbuch.',
      ],
      [
        '40 Minuten Deep-Work-Lesen ohne jede Unterbrechung.',
        'Lies eine wissenschaftliche Studie und verstehe das Fazit.',
        'Erstelle eine visuelle Übersicht über ein komplexes Thema.',
        'Lerne 15 neue Vokabeln oder Fachausdrücke auswendig.',
      ],
      [
        '45 Minuten intensive Lese-Session in anspruchsvoller Literatur.',
        'Analysiere eine Fallstudie und verfasse Lösungsansätze.',
        'Schreibe ein detailliertes Lern-Protokoll mit Stichpunkten.',
        'Durchdringe die Grundlagen einer neuen Technologie oder Theorie.',
      ],
      [
        '50 Minuten fokussiertes Studium eines Fachbuchs.',
        'Vergleiche 2 unterschiedliche Theorien und schreibe Vor- und Nachteile auf.',
        'Erstelle ein präzises Wissens-Chart mit allen Zusammenhängen.',
        'Höre eine universitäre Vorlesung online mit Mitschrift.',
      ],
      [
        '60 Minuten ununterbrochenes Deep Dive Lesen.',
        'Analysiere ein komplexes Research Paper von Anfang bis Ende.',
        'Schreibe eine 2-seitige Zusammenfassung eines Fachthemas.',
        'Konstruiere eine umfassende Wissens-Matrix.',
      ],
      [
        '75 Minuten wissenschaftliche Recherche und Aufarbeitung.',
        'Arbeite ein komplettes Buchkapitel auf universitärem Niveau durch.',
        'Entwirf eine wissenschaftliche Fragestellung und liefere Argumente.',
        'Schreibe ein eigenes kleines Lernskript zu einem Themengebiet.',
      ],
      [
        '90 Minuten intensives Experten-Studium ohne Pausen.',
        'Erstelle eine umfassende Facharbeit oder ein Lehr-Manuskript.',
        'Analysiere 3 verschiedene Forschungsarbeiten und vergleiche sie.',
        'Systematisiere ein komplettes Themengebiet in Notizen.',
      ],
      [
        '120 Minuten fokussierter Wissens-Marathon auf höchstem Niveau.',
        'Durchdringe ein hochkomplexes Fachgebiet vollständig.',
        'Verfasse ein meisterhaftes Manifest oder Fach-Skript.',
        'Mastere 50 Fachbegriffe und halte einen Testvortrag vor dir selbst.',
      ],
    ],
  },
  muskeln: {
    titles: [
      // Tier 0
      ['10 Liegestütze', '15 Kniebeugen', '20 Sek Plank', 'Light Warmup', '10 Ausfallschritte', 'Stretches', 'Körper-Aktivierung'],
      // Tier 1
      ['20 Liegestütze', '30 Kniebeugen', '45 Sek Plank', 'Core Workout 10 Min', 'Zirkel 1', 'Liegestütz-Sätze', 'Kniebeugen-Routine'],
      // Tier 2
      ['30 Liegestütze', '40 Kniebeugen', '60 Sek Plank', '20 Min Workout', '3 Sätze Burpees', 'Beinkraft Basis', 'Oberkörper-Impuls'],
      // Tier 3
      ['40 Liegestütze', '50 Kniebeugen', '90 Sek Plank', 'Calisthenics Session', 'HIIT Zirkel 20 Min', 'Dips & Liegestütze', 'Core Blast'],
      // Tier 4
      ['50 Liegestütze', '60 Kniebeugen', '2 Min Plank', '30 Min Krafttraining', 'Push-Day Routine', 'Pull-Up Session', 'Bein-Zirkel'],
      // Tier 5
      ['60 Liegestütze', '80 Kniebeugen', '2.5 Min Plank', '35 Min Intensiv-Workout', 'Calisthenics Advanced', 'Core & Tabata', 'Dips & Klimmzüge'],
      // Tier 6
      ['75 Liegestütze', '100 Kniebeugen', '3 Min Plank', '40 Min Hantel-Training', 'Ganzkörper-Power', '30 Burpees', 'Oberkörper-Pump'],
      // Tier 7
      ['85 Liegestütze', '120 Kniebeugen', '3.5 Min Plank', '45 Min Kraft-Workout', 'Heavy Push Protocol', 'Klimmzug & Dips Blast', 'Leg-Day Extreme'],
      // Tier 8
      ['100 Liegestütze', '150 Kniebeugen', '4 Min Plank', '50 Min Heavy Lifting', 'Crossfit Benchmark Workout', 'Calisthenics Master', 'Ganzkörper-Zerstörung'],
      // Tier 9
      ['120 Liegestütze', '180 Kniebeugen', '5 Min Plank', '60 Min Krafttraining', 'Profi Calisthenics Routine', '50 Burpees Challenge', 'Heavy Dumbbell Session'],
      // Tier 10
      ['150 Liegestütze', '200 Kniebeugen', '75 Min Kraft-Marathon', 'Heavy Compound Lifts', 'Spartan Workout 75 Min', 'Klimmzug-Protokoll 50 Reps', 'Leg Day Brutal'],
      // Tier 11
      ['200 Liegestütze Challenge', '250 Kniebeugen', '90 Min Heavy Workout', 'Elite Calisthenics Routine', '100 Burpees Challenge', 'Ganzkörper-Beast-Mode', 'Kniebeugen-Protokoll'],
      // Tier 12
      ['300 Liegestütze Marathon', '300 Kniebeugen & Dips', '120 Min Power-Athletik', '1000 Rep Challenge', 'Titan Workout Protocol', 'Iron Body Session', 'Ultimate Muscle Overload'],
    ],
    descriptions: [
      ['Absolviere 10 sauber ausgeführte Liegestütze verteilt oder am Stück.', 'Mache 15 kontrollierte Kniebeugen.', 'Halte 20 Sekunden die Plank-Position.', 'Mache ein kurzes 5-Minuten Aufwärmen.'],
      ['Absolviere 20 Liegestütze in 2 Sätzen.', 'Mache 30 Kniebeugen mit voller Tiefe.', 'Halte 45 Sekunden den Unterarmstütz.', 'Führe 10 Ausfallschritte pro Bein aus.'],
      ['Absolviere 30 Liegestütze über den Tag verteilt.', 'Mache 40 Kniebeugen.', 'Halte 60 Sekunden die Plank.', 'Mach 3 Sätze à 10 Dips an einer Stuhlkante.'],
      ['Absolviere 40 Liegestütze in sauberer Form.', 'Mache 50 Kniebeugen.', 'Halte 90 Sekunden Plank.', 'Mach ein 20-minütiges Bodyweight Workout.'],
      ['Absolviere 50 Liegestütze in 3 bis 4 Sätzen.', 'Mache 60 Kniebeugen.', '2 Minuten Plank am Stück oder in 2 Sätzen.', '30 Minuten intensives Krafttraining im Gym oder zuhause.'],
      ['Absolviere 60 Liegestütze.', 'Mache 80 Kniebeugen.', '2,5 Minuten Unterarmstütz.', '35 Minuten Kurzhantel- oder Calisthenics-Training.'],
      ['Absolviere 75 Liegestütze verteilt auf Sätze.', 'Mache 100 Kniebeugen am Tag.', '3 Minuten Plank halten.', '40 Minuten schwere Grundübungen oder Eigengewicht.'],
      ['Absolviere 85 Liegestütze.', 'Mache 120 Kniebeugen.', '45 Minuten echtes Muskelaufbautraining.', '30 sauber ausgeführte Burpees.'],
      ['Absolviere 100 Liegestütze am Tag.', 'Mache 150 Kniebeugen.', '50 Minuten intensives Krafttraining.', '4 Minuten Plank kumuliert.'],
      ['Absolviere 120 Liegestütze.', 'Mache 180 Kniebeugen.', '60 Minuten Gym oder Calisthenics Session.', '50 Burpees auf Zeit.'],
      ['Absolviere 150 Liegestütze über den Tag.', 'Mache 200 Kniebeugen.', '75 Minuten maximales Hypertrophie-Training.', '50 Klimmzüge oder Dips kumuliert.'],
      ['Absolviere 200 Liegestütze am Tag.', 'Mache 250 Kniebeugen.', '90 Minuten schweres Ganzkörpertraining.', '100 Burpees Challenge.'],
      ['Absolviere 300 Liegestütze über den Tag verteilt.', 'Mache 300 Kniebeugen.', '120 Minuten ultimatives Power-Workout.', '1000 Wiederholungen Challenge (verschiedene Übungen).'],
    ],
  },
  geist: {
    titles: [
      // Tier 0
      ['3 Min Stille', '1 Dankbarkeit', 'Tiefe Atemzüge', 'Kurze Pause', 'Digital Detox 15 Min', 'Achtsamer Moment', 'Tee trinken ohne Handy'],
      // Tier 1
      ['5 Min Meditation', '3 Dankbarkeiten', 'Box Breathing', 'Kühles Gesichtswasser', 'Gedanken aufschreiben', 'Spaziergang ohne Musik', 'Fokus-Timer 15 Min'],
      // Tier 2
      ['10 Min Meditation', 'Journaling Basis', 'Atemübung 4-7-8', '1 Min Kalte Dusche', 'Stoizismus Zitat', 'Stille Reflexion', 'Kein Social Media morgens'],
      // Tier 3
      ['12 Min Meditation', 'Tages-Journaling', '2 Min Kalte Dusche', 'Gedanken-Reset', 'Klassische Musik 20 Min', 'Achtsame Pause', 'Reflexion der Ziele'],
      // Tier 4
      ['15 Min Meditation', 'Stoic Journaling', '3 Min Kalte Dusche', 'Dopamin-Fasten 2 Std', 'Atemmeditation 15 Min', 'Mentaler Schutzwall', 'Ego-Check'],
      // Tier 5
      ['20 Min Meditation', 'Intensives Journaling', 'Abendliche Reflexion', 'Kaltes Bad / Eisdusche', 'Fokus ohne Ablenkung 1 Std', 'Ethisches Tagebuch', 'Mentaler Reset'],
      // Tier 6
      ['25 Min Stille', 'Tiefen-Meditation', 'Kalte Dusche 4 Min', 'Sorgen-Analyse', 'Visualisierung der Zukunft', 'Digital Detox halber Tag', 'Mindset-Schulung'],
      // Tier 7
      ['30 Min Meditation', 'Stoiker-Protokoll', 'Eisdusche 5 Min', 'Meditation im Gehen', 'Gedanken-Choreografie', 'Schattenarbeit Journaling', 'Mentale Härte Übung'],
      // Tier 8
      ['35 Min Meditation', 'Tiefen-Journaling 20 Min', 'Dopamin Detox ganzer Tag', 'Mind-Control Protocol', 'Mentaler Test unter Stress', 'Achtsamkeits-Retreat 1 Std', 'Resilienz-Protokoll'],
      // Tier 9
      ['45 Min Meditation', 'Reflexion des Lebens', 'Eisbad / 5 Min Eiskalt', 'Fokus-State 2 Stunden', 'Philosophische Analyse', 'Achtsamkeits-Prüfung', 'Stoiker-Manifest'],
      // Tier 10
      ['60 Min Meditation', 'Zen-Meditation', 'Radikaler Digital Detox', 'Mentale Festung aufbauen', 'Tiefen-Reflexion 40 Min', 'Kälte-Exposition Extreme', 'Selbstbeherrschungs-Test'],
      // Tier 11
      ['75 Min Stille & Meditation', 'Große Journal-Analyse', '24 Std Dopamin Fasten', 'Kloster-Protokoll 1 Tag', 'Ultra-Mentaler Fokus', 'Tiefste Selbstreflexion', 'Schatten-Integration'],
      // Tier 12
      ['90 Min Meditation', 'Meister-Stille 2 Stunden', '36 Std Fasten & Besinnung', 'Mentaler Zustand der Unerschütterlichkeit', 'Absolute Gedanken-Kontrolle', 'Zen-Master Session', 'Philosophisches Großwerk'],
    ],
    descriptions: [
      ['Setze dich 3 Minuten ruhig hin und schließe die Augen.', 'Schreibe 1 Sache auf, für die du dankbar bist.', 'Mache 5 tiefste Atemzüge in den Bauch.', 'Sitz 5 Minuten ohne Bildschirme am Fenster.'],
      ['Meditiere 5 Minuten mit Timer.', 'Schreibe 3 Dinge auf, für die du dankbar bist.', 'Mache 3 Minuten Box-Breathing (4s ein, 4s halten, 4s aus, 4s halten).', 'Schreibe deine aktuellen Gedanken unzensiert auf.'],
      ['Meditiere 10 Minuten in absoluter Stille.', 'Führe eine morgendliche Journaling-Session durch.', 'Beende deine Dusche mit 60 Sekunden eiskaltem Wasser.', 'Verzichte die ersten 30 Minuten nach dem Aufstehen auf das Smartphone.'],
      ['Meditiere 12 Minuten geführt oder frei.', 'Schreibe deine Tagesziele und deine größte Hürde auf.', '2 Minuten eiskalte Dusche.', 'Höre 20 Minuten entspannende Wellen- oder Klassik-Sounds.'],
      ['15 Minuten Meditation ohne jede Bewegung.', 'Schreibe ein stoisches Tagebuch über deine Reaktionen.', '3 Minuten eiskaltes Wasser am Ende der Dusche.', 'Verzichte 2 Stunden lang auf alle sozialen Medien & Videos.'],
      ['20 Minuten tiefe Meditation.', 'Führe ein intensives Abend-Journaling durch (Was lief gut? Was nicht?).', 'Verzichte einen halben Tag auf verarbeitete Reize.', 'Visualisiere 10 Minuten deine wichtigsten Erfolge.'],
      ['25 Minuten Stille.', 'Schreibe deine größten Ängste/Sorgen auf und widerlege sie rational.', '4 Minuten eiskalt duschen.', 'Verzichte ab 18 Uhr auf alle Bildschirme.'],
      ['30 Minuten Meditation im Sitzen.', 'Erstelle ein Manifest deiner persönlichen Werte.', '5 Minuten eiskaltes Wasser.', 'Verzichte einen ganzen Tag auf Konsummedien.'],
      ['35 Minuten Meditation.', '20 Minuten tiefes Schreibgespräch mit dir selbst.', 'Führe einen kompletten Tag Dopamin-Detox durch.', 'Absolviere eine Achtsamkeitspraxis beim Gehen.'],
      ['45 Minuten tiefe Meditation.', 'Analysiere deine Lebensentscheidungen der letzten 12 Monate.', 'Gönne dir ein Eisbad oder 5 Minuten eisige Dusche.', '2 Stunden ununterbrochene Gedankenruhe.'],
      ['60 Minuten Meditation in einem Block.', 'Führe einen kompletten Tag ohne Smartphone/PC durch.', 'Erarbeite ein schriftliches Philosophie-Dossier.', 'Übe radikale Gelassenheit in einer Stresssituation.'],
      ['75 Minuten Meditation.', '24 Stunden Fasten & geistige Einkehr.', 'Verfasse eine tiefgreifende Lebens-Analyse.', 'Halte 12 Stunden absolute Sprache-Stille (Silent Day).'],
      ['90 Minuten meisterhafte Meditation.', 'Verbringe einen ganzen Tag in Stille und Einkehr.', '36 Stunden Fasten & geistige Erneuerung.', 'Erreiche absolute unerschütterliche Seelenruhe (Ataraxie).'],
    ],
  },
  beweglichkeit: {
    titles: [
      // Tier 0
      ['Nacken dehnen', 'Schulterkreisen', '5 Min Stretch', '3000 Schritte', 'Hüftöffner kurz', 'Gelenke mobilisieren', 'Handgelenk-Mobility'],
      // Tier 1
      ['10 Min Mobility', '5000 Schritte', 'Wirbelsäule drehen', 'Beinstrecker Dehnung', 'Morgen-Stretch 10 Min', 'Fußgelenke mobilisieren', 'Spaziergang 15 Min'],
      // Tier 2
      ['15 Min Dehn-Routine', '7000 Schritte', 'Hüft-Mobility', 'Brustöffner & Schultern', 'Beinrückseite dehnen', 'Abend-Stretch', 'Faszien-Rolle 10 Min'],
      // Tier 3
      ['20 Min Dehnprogramm', '8000 Schritte', 'Deep Squat Hold 2 Min', 'Rücken-Entlastung', 'Mobility Zirkel', 'Dynamisches Dehnen', 'Faszien-Massage'],
      // Tier 4
      ['25 Min Yoga Flow', '10.000 Schritte', 'Hüftbeuger Deep Stretch', 'Schulter-Mobility Advanced', 'Faszien-Training 15 Min', 'Spagat-Vorbereitung', 'Posturales Training'],
      // Tier 5
      ['30 Min Yoga Session', '11.000 Schritte', 'Ganzkörper-Mobility', 'Wirbelsäulen-Flexibilität', 'Faszien-Rolle 20 Min', 'Brustwirbelsäule mobilisieren', 'Aktives Dehnen'],
      // Tier 6
      ['35 Min Dehnen & Yoga', '12.000 Schritte', 'Hüft & Spagat Session 20 Min', 'Core & Mobility', 'Schulter-Flexibilität 20 Min', 'Barfuß-Spaziergang', 'Haltungs-Korrektur Workout'],
      // Tier 7
      ['40 Min Intensiv-Stretch', '13.000 Schritte', 'Advanced Yoga Flow', 'Faszien-Behandlung 25 Min', 'Bein & Hüft-Flexibilität', 'Rücken-Gesundheit Zirkel', 'Dynamische Gelenk-Routine'],
      // Tier 8
      ['45 Min Yoga / Mobility', '14.000 Schritte', 'Hüftbeuger & Spagat 30 Min', 'Ganzkörper-Flexibilität', 'Tiefen-Faszientraining', 'Brust & Schulter-Stretch 30 Min', 'Mobility-Meisterschaft'],
      // Tier 9
      ['50 Min Yoga Master', '15.000 Schritte', 'Brücke & Rückbeugen', 'Spagat-Training 35 Min', 'Faszien & Triggerpunkte', 'Intensiver Ganzkörper-Stretch', 'Gelenk-Gesundheit Protocol'],
      // Tier 10
      ['60 Min Yoga Session', '18.000 Schritte Marathon', 'Spagat & Hüft-Mastery 45 Min', 'Tiefen-Dehnung Ganzkörper', 'Schulter & BWS Flexibilität 45 Min', 'Haltungs-Transformation', 'Faszien-Komplettbehandlung'],
      // Tier 11
      ['75 Min Yoga Flow & Stretch', '20.000 Schritte Challenge', 'Extremes Beweglichkeits-Training', 'Meister-Flexibilität 60 Min', 'Ganzkörper-Restoration', 'Tiefe Bindegewebs-Massage', 'Anatomische Flexibilität'],
      // Tier 12
      ['90 Min Yoga & Mobility Ultra', '25.000 Schritte Mega-Challenge', 'Spagat Vollendung Protocol', 'Ganzkörper-Geschmeidigkeit 90 Min', 'Meister der Körperbeherrschung', 'Körper-Restoration Ultra', 'Beweglichkeits-Marathon'],
    ],
    descriptions: [
      ['Dehne 5 Minuten lang deinen Nacken und die Schultern.', 'Kreise Schultern und Handgelenke bewusst.', 'Mache einen kurzen 5-minütigen Spaziergang.', 'Absolviere 3000 Schritte heute.'],
      ['Absolviere eine 10-minütige Mobility-Routine.', 'Gehe heute mindestens 5000 Schritte.', 'Dehne die Oberschenkelvorderseite und Hüfte.', 'Führe 10 Katzen-Kuh Bewegungen für die Wirbelsäule aus.'],
      ['Dehne 15 Minuten lang deinen gesamten Körper.', 'Gehe heute mindestens 7000 Schritte.', 'Nutze eine Faszienrolle für die Beine (10 Min).', 'Halte eine tiefe Hocke (Deep Squat) für 2 Minuten.'],
      ['Absolviere eine 20-minütige Dehn-Session.', 'Gehe heute mindestens 8000 Schritte.', 'Dehne intensiv Hüftbeuger und Hamstrings.', 'Mobilisiere die Brustwirbelsäule mit Rotationen.'],
      ['Absolviere ein 25-minütiges Yoga-Video.', 'Erreiche heute das Ziel von 10.000 Schritten.', 'Bearbeite verklebte Faszien an Waden und Rücken.', 'Übe 15 Minuten gezielte Hüftöffner.'],
      ['30 Minuten Yoga oder Dehnen am Stück.', 'Gehe heute 11.000 Schritte an frischer Luft.', 'Bearbeite 20 Minuten Beine und Rücken mit der Blackroll.', 'Dehne intensiv Schultern und Brustmuskulatur.'],
      ['35 Minuten intensive Mobility-Session.', 'Erreiche 12.000 Schritte über den Tag.', 'Führe 20 Minuten Spagat-Vorbereitungsübungen aus.', 'Führe ein Korrekturprogramm für aufrechte Haltung durch.'],
      ['40 Minuten tiefes Dehnen aller Muskelgruppen.', 'Gehe heute 13.000 Schritte.', '25 Minuten Faszien- und Triggerpunktbehandlung.', 'Dehne intensiv den unteren Rücken und die Hüfte.'],
      ['45 Minuten Yoga Flow oder Athleten-Mobility.', 'Gehe 14.000 Schritte.', '30 Minuten fokussiertes Hüft- und Spagat-Training.', 'Verbessere deine Brücke und Rückbeuge.'],
      ['50 Minuten Yoga auf fortgeschrittenem Niveau.', '15.000 Schritte am Tag.', '35 Minuten Spagat- und Beinstrecker-Dehnung.', 'Vollständiges Faszien-Anatomie-Programm.'],
      ['60 Minuten intensive Dehn- und Mobility-Praxis.', '18.000 Schritte Marsch oder Lauf.', '45 Minuten Hüft- und Schulter-Öffnung.', 'Richte deine Körperhaltung durch gezieltes Training aus.'],
      ['75 Minuten umfassender Yoga- und Stretch-Block.', '20.000 Schritte Challenge an einem Tag.', 'Erreiche maximale Beweglichkeit in allen Gelenken.', 'Deep Tissue Selbst-Massage & Stretching.'],
      ['90 Minuten ultiimatives Flexibilitäts-Programm.', '25.000 Schritte Mega-Challenge.', 'Vollständiges Spagat- und Brücken-Protokoll.', 'Maximale körperliche Geschmeidigkeit und schmerzfreie Gelenke.'],
    ],
  },
  business: {
    titles: [
      // Tier 0
      ['Idee notieren', 'To-Do Liste ordnen', '1 E-Mail schreiben', 'Arbeitsplatz aufräumen', '1 Kontakt pflegen', 'Prozess durchdenken', '5 Min Fokus'],
      // Tier 1
      ['15 Min Fokus-Arbeit', 'Wichtige Mail verfassen', 'Tages-Prioritäten setzen', 'Netzwerk-Nachricht', 'Dokument strukturieren', '20 Min Recherche', 'Kosten-Check'],
      // Tier 2
      ['20 Min Deep Work', 'Prozess dokumentieren', '1 Angebot entwerfen', 'LinkedIn / Kontaktaufnahme', 'Kunden-Feedback auswerten', 'Workflow optimieren', 'Strategie-Notiz'],
      // Tier 3
      ['25 Min Pomodoro', 'SOP erstellen', '2 Kontakte anschreiben', 'Projekt-Planung', 'Aufgaben delegieren/ordnen', '30 Min Business-Lesen', 'Landingpage-Text entwerfen'],
      // Tier 4
      ['30 Min Ungestörte Arbeit', 'Verkaufs-Skript verfassen', '3 Akquise-Mails', 'Prozess-Automatisierung', 'Finanz-Modell skizzieren', 'Konkurrenz-Analyse 30 Min', 'Branding-Konzept'],
      // Tier 5
      ['40 Min Deep Work', 'SOP Handbuch Kapitel', 'System-Architektur', 'Kunden-Outreach 5 Kontakte', 'Marketing-Funnel entwerfen', 'Produkt-Features definieren', 'Business-Canvas'],
      // Tier 6
      ['45 Min Fokus-Block', 'Pitch Deck Folien', 'Akquise-Anrufe / Nachrichten', 'Website-Inhalte überarbeiten', 'Strategie-Papier 45 Min', 'Kennzahlen-Dashboard', 'Prozess-Review'],
      // Tier 7
      ['50 Min Deep Work', 'Vertrags-Entwurf / SOPs', '10 Akquise-Kontakte', 'Marketing-Kampagne planen', 'Operations-Optimierung', 'Angebots-Pipeline füllen', 'Neues Angebot launchen'],
      // Tier 8
      ['60 Min Deep Work Block', 'Komplette SOP-Serie', '15 gezielte B2B-Anfragen', 'Umsatz-Strategie ausarbeiten', 'Funnel-Test durchführen', 'Produkt-Prototyp bauen', 'Systematische Netzwerkarbeit'],
      // Tier 9
      ['75 Min High-Value Work', 'Pitch Deck fertigstellen', '20 Akquise-Nachrichten', 'Automatisierungs-Pipeline bauen', 'Skalierungs-Konzept', 'Unternehmens-Audit', 'Kunden-Offensive'],
      // Tier 10
      ['90 Min Deep Work Sprint', 'System-Architektur komplettieren', 'Grosskunden-Pitch vorbereiten', 'Vollständige Funnel-Architektur', 'Unternehmens-Strategie 2026', 'Skalierungs-Engine bauen', 'Master-Operations Plan'],
      // Tier 11
      ['120 Min Power-Business Sprint', 'Vollständiges Produkt-Launch Konzept', '30 B2B Outreach Kontaktaufnahmen', 'Unternehmens-Prozesse automatisieren', 'Mastermind Strategie-Dossier', 'M&A / Skalierungs-Analyse', 'Vollwertiger Business-Plan'],
      // Tier 12
      ['180 Min Ultra Deep Work Marathon', 'Vollständiges Unternehmens-System bauen', 'Enterprise Outreach Offensive', 'Skalierung auf automatisierte Systeme', 'Vollständige Produkt-Transformation', 'Umsatz-Verdopplungs-Plan', 'Ultimate Business Empire Protocol'],
    ],
    descriptions: [
      ['Schreibe eine Geschäftsidee oder Optimierung auf.', 'Ordne deine 3 wichtigsten Aufgaben für den Tag.', 'Verfasse 1 wichtige geschäftliche E-Mail.', 'Räume deinen Schreibtisch für klaren Fokus auf.'],
      ['Arbeite 15 Minuten ohne Smartphone an deinem Hauptprojekt.', 'Sende eine professionelle Nachricht an einen Kontakt.', 'Erstelle eine Liste mit deinen Kern-Prioritäten.', 'Recherchiere 20 Minuten zu einem Markt.'],
      ['20 Minuten ununterbrochenes Arbeiten an einer wichtigen Aufgabe.', 'Schreibe eine Standard-Arbeitsanweisung (SOP) für einen Schritt.', 'Schreibe ein Angebot oder ein Konzept-Draft.', 'Optimiere einen täglichen Arbeitsablauf.'],
      ['Arbeite einen 25-Minuten Pomodoro-Block mit 100% Fokus.', 'Schreibe 2 potenzielle Kunden oder Partner an.', 'Erstelle einen detaillierten Meilenstein-Plan.', 'Lies 30 Minuten in einem Fachbuch über Unternehmertum.'],
      ['30 Minuten absolut ungestörte Arbeitszeit (No Notifications).', 'Schreibe ein überzeugendes Verkaufs- oder Pitch-Skript.', 'Verfasse 3 gezielte Akquise-Mails.', 'Automatisiere eine wiederkehrende digitale Aufgabe.'],
      ['40 Minuten Deep Work an deinem Umsatz-Treiber.', 'Dokumentiere ein komplettes Unternehmungssystem in einer SOP.', 'Plane einen mehrstufigen Marketing-Funnel.', 'Kontaktiere 5 potenzielle Kunden oder Geschäftspartner.'],
      ['45 Minuten glasklarer Arbeitsfokus auf wertschöpfende Aufgaben.', 'Erstelle oder überarbeite 5 Folien deines Pitch Decks.', 'Führe Akquise-Gespräche oder schreibe direkte Anfragen.', 'Analysiere deine wichtigsten Unternehmens-KPIs.'],
      ['50 Minuten Deep Work.', 'Kontaktiere 10 qualifizierte Geschäftskontakte.', 'Optimiere deine gesamte Angebots- und Preisstruktur.', 'Plane eine komplette Marketing- und Vertriebs-Kampagne.'],
      ['60 Minuten intensiver Arbeits-Sprint.', 'Schreibe 15 gezielte B2B-Anfragen.', 'Baue einen funktionierenden digitalen Prototyp oder Landingpage.', 'Erstelle eine vollständige Umsatz-Skalierungs-Strategie.'],
      ['75 Minuten ununterbrochene High-Value Execution.', 'Fertige ein investor-ready Pitch Deck oder Strategiepapier an.', 'Schreibe 20 individuelle B2B-Outreach Nachrichten.', 'Baue eine komplexe No-Code/Code Automatisierungs-Pipeline.'],
      ['90 Minuten kompromissloser Deep Work Sprint.', 'Bereite einen Großkunden-Pitch oder Investoren-Termin vor.', 'Implementiere ein vollständig strukturiertes Operations-System.', 'Erstelle ein meisterhaftes Skalierungskonzept.'],
      ['120 Minuten hochkonzentrierter Business-Power-Block.', 'Sende 30 gezielte Vertriebs-Anfragen raus.', 'Erstelle das vollständige Launch-Konzept für ein Produkt.', 'Automatisiere 80% deiner administrativen Prozesse.'],
      ['180 Minuten ultimativer Business-Marathon.', 'Erarbeite das vollständige Fundament für ein skalierbares Unternehmen.', 'Schließe ein Großprojekt von der Idee bis zur Marktreife ab.', 'Baue ein vollautomatisiertes Kundengewinnungs-System.'],
    ],
  },
  geld: {
    titles: [
      // Tier 0
      ['Ausgaben eintragen', '1 Abo prüfen', 'Kleingeld sparen', 'Kontostand checken', 'Finanz-Tipp lesen', 'Preise vergleichen', '5 Min Spar-Fokus'],
      // Tier 1
      ['Tages-Ausgaben erfassen', 'Unnötiges Abo kündigen', '5€ ins Sparschwein / Depot', 'Budget-Check', 'Finanz-Artikel lesen', 'Günstigere Alternative suchen', 'Einkaufszettel strikt einhalten'],
      // Tier 2
      ['Finanz-Tagebuch', '10€ Investition', 'Fixkosten-Analyse', 'Sparquote berechnen', 'Finanz-Podcast 20 Min', 'Vertrag vergleichen', 'Haushaltsbuch führen'],
      // Tier 3
      ['Haushaltsbuch-Review', '20€ Investieren / Sparen', 'Versicherungen prüfen', 'Einkommens-Idee skizzieren', 'Finanzbuch 25 Min lesen', 'Depot-Übersicht', 'Verhandlungs-Vorbereitung'],
      // Tier 4
      ['Monats-Budget erstellen', '50€ Sparen/Anlegen', 'Strom/Internet Vertrag vergleichen', 'Zusatzverdienst-Möglichkeit prüfen', 'Aktien/ETF Analyse 30 Min', 'Notgroschen-Check', 'Steuer-Belege ordnen'],
      // Tier 5
      ['Fixkosten um 20€ senken', '100€ Spar-Impuls', 'Vermögens-Aufstellung', 'Cashflow-Rechnung', 'Finanzbuch 35 Min lesen', 'Verkauf von Altlasten (eBay)', 'Steuer-Vorbereitung 30 Min'],
      // Tier 6
      ['Depot-Rebalancing Check', '150€ Anlegen', 'Gehaltsverhandlung planen', 'Passive Einkommensquelle strukturieren', 'Finanz-Strategie 45 Min', 'Verträge optimieren (-50€/Mo)', 'Immobilien/ETF Recherche'],
      // Tier 7
      ['Finanzielle Freiheit Rechner', '200€ Investieren', 'Zusatz-Einkommen generieren (Sale)', 'Steuererklärung ausfüllen 45 Min', 'Ausgaben-Sperre 3 Tage', 'Portfolio-Diversifikation', 'Business-Cashflow Optimierung'],
      // Tier 8
      ['Vollständiger Finanz-Audit', '300€ Investitions-Schritt', 'Vertrags-Optimierung (100€/Mo gespart)', 'Investment-Theorie studieren', 'Einkommens-Strom aufbauen', 'Steuer-Optimierungs-Strategie', 'Asset-Allokation Meisterschaft'],
      // Tier 9
      ['Vermögens-Planung 5 Jahre', '500€ Anlegen / Sparen', 'Steuererklärung komplett fertigstellen', 'Nebengewerbe-Anmeldung / Konzept', 'Immobilien-Kalkulation durchführen', 'Risiko-Analyse Portfolio', 'High-Yield Investment Analyse'],
      // Tier 10
      ['Meisterhafter Finanz-Plan', '1000€ Investitions-Meilenstein', 'Umfassendes Asset-Management', 'Passive Cashflow Engine konstruieren', 'Steuer-Architektur mit Experten-Tipps', 'Unternehmens-Beteiligung analysieren', 'Fire-Strategie ausarbeiten'],
      // Tier 11
      ['Vermögens-Architektur 75 Min', '2000€ Reinvestition', 'Komplettes Unternehmens-Finanzmodell', 'Einkommens-Multiplikator Strategie', 'Vollwertiges Immobilien-Exposé prüfen', 'Steuer-Einsparung von >1000€ durchsetzen', 'Meister-Portfolio Allokation'],
      // Tier 12
      ['Großes Vermögens-Manifest 120 Min', '5000€ Reinvestitions-Strategie', 'Vollständige Finanzielle Unabhängigkeit Roadmap', 'Multi-Stream Cashflow Architektur', 'Erbschafts/Stiftungs/Steuer-Konstrukt', 'Titan Financial Freedom Empire', 'Ultimate Wealth Masterplan'],
    ],
    descriptions: [
      ['Trage alle Ausgaben des heutigen Tages centgenau ein.', 'Überprüfe 1 Abo auf deinen Kontoauszügen.', 'Prüfe deinen aktuellen Kontostand.', 'Trage 1€ in deine Spar-App oder Sparschwein ein.'],
      ['Kündige ein ungenutztes Abonnement oder Mitgliedschaft.', 'Sammle alle Quittungen der Woche.', 'Lege heute bewusst 5€ zur Seite.', 'Halte dich beim Einkaufen zu 100% an deinen Zettel.'],
      ['Analysiere deine monatlichen Fixkosten.', 'Berechne deine aktuelle Sparquote in Prozent.', 'Überweise 10€ auf dein Investment-Konto.', 'Lies 20 Minuten über Finanzen und Vermögensaufbau.'],
      ['Führe ein akribisches Haushaltsbuch für diesen Monat.', 'Optimiere einen Vertrag (Strom, Handy, Internet).', 'Investiere 20€ in deinen ETF oder Sparplan.', 'Recherchiere eine Möglichkeit für Nebeneinkommen.'],
      ['Erstelle ein detailliertes Monats-Budget mit Kategorien.', 'Überweise 50€ auf dein Tagesgeld- oder Depotkonto.', 'Ordne alle Steuerbelege im Ordner.', 'Analysiere 30 Minuten ein Unternehmen oder ETF.'],
      ['Optimiere deine Fixkosten um mindestens 20€ pro Monat.', 'Verkaufe ungenutzte Gegenstände online (eBay, Vinted).', 'Erstelle eine vollständige Übersicht aller Vermögenswerte.', 'Lies 35 Minuten in einem renommierten Finanzbuch.'],
      ['Überprüfe die Diversifikation deines Anlage-Portfolios.', 'Erstelle einen konkreten Argumentations-Leitfaden für Gehalt/Preise.', 'Spare oder investiere heute 150€.', 'Optimiere deine Verträge und spare mindestens 50€/Monat.'],
      ['Erstelle einen detaillierten Rechner für finanzielle Freiheit.', 'Investiere 200€ nach deiner festgelegten Strategie.', 'Arbeite 45 Minuten an deiner Steuererklärung.', 'Vereinbare eine 3-tägige Ausgabensperre (nur Grundnahrungsmittel).'],
      ['Führe einen kompletten Audit aller Einnahmen und Ausgaben durch.', 'Lege 300€ an oder erstelle einen neuen Sparplan.', 'Optimiere Verträge so, dass du aufs Jahr >1000€ sparst.', 'Erarbeite eine Strategie zur Steueroptimierung.'],
      ['Erstelle deinen persönlichen 5-Jahres-Vermögensplan.', 'Investiere 500€ in ertragreiche Assets.', 'Schließe deine Steuererklärung vollständig ab.', 'Kalkuliere eine Immobilien- oder Unternehmens-Investition.'],
      ['Entwirf einen meisterhaften Finanz- und Cashflow-Plan.', 'Lege 1000€ an oder reinvestiere Gewinne.', 'Konstruiere ein passives Einkommens-System.', 'Optimiere deine Steuerstruktur auf Profi-Niveau.'],
      ['Erstelle die vollständige Finanz-Architektur für die nächsten 10 Jahre.', 'Reinvestiere 2000€ in ertragsstarke Anlageklassen.', 'Erstelle ein vollwertiges Finanzmodell für ein Nebengewerbe.', 'Spiegle deine Finanzen an den Prinzipien der Reichsten.'],
      ['Erarbeite dein ultimatives Vermögens-Manifest für finanzielle Freiheit.', 'Investiere oder reallokiere 5000€ in strategische Assets.', 'Konstruiere ein unumstößliches Multi-Asset Portfolio.', 'Erreiche vollständige Klarheit über deinen Weg zur Unabhängigkeit.'],
    ],
  },
};

const STAT_THEMED_TASK_PATTERNS_EN: Record<
  string,
  {
    titles: string[][];
    descriptions: string[][];
  }
> = {
  wissen: {
    titles: [
      ['Reading & Insight', 'Learn a Term', 'Read Short Article', 'Start Non-Fiction Book', 'Knowledge Note', '10 Min Documentary', 'Listen to Podcast'],
      ['15 Min Non-Fiction', 'Topic Intro', 'Vocabulary & Terms', '15 Min Learning Podcast', 'Knowledge Summary', 'Read News Article', 'Online Course Module 1'],
      ['Intensive Chapter Reading', 'Create Mindmap', '3 Core Concepts', 'Study Specialist Blog', '20 Min Research Session', 'Write Flashcards', '20 Min Audiobook'],
      ['25 Min Non-Fiction', 'Analyze Article', 'Draft Summary', '30 Min Documentary', 'Learn a Method', 'Create Knowledge Quiz', 'Study Biography'],
      ['30 Min Deep Reading', 'Research Complex Topic', 'Compare Specialist Texts', 'Study Session with Notes', '30 Min Science Podcast', 'Write Expertise Note', 'Understand Formula / Law'],
      ['35 Min Book & Notes', 'Analyze Book Chapter', '40 Min Online Course', 'Write Knowledge Synthesis', 'Create Research Dossier', 'Glossary with 15 Terms', 'Study Debate'],
      ['40 Min Deep Dive Text', 'Read Scientific Study', 'Summarize Academic Article', 'Draw Complex Model', 'Draft Critical Essay', '45 Min Study Log', 'Master Technical Terms'],
      ['45 Min Focused Book', 'Work Through Case Study', 'Build Knowledge Architecture', 'Write Paper Analysis', '45 Min Expert Lecture', 'Theory Systematization', 'Literature Research'],
      ['50 Min Study Deep Dive', '50 Min Non-Fiction Book', 'Critically Examine Methodology', 'Draw Knowledge Graph', 'Write Academic Essay', 'Complete Intensive Course', 'Memory Log'],
      ['60 Min Expert Book', 'Analyze Scientific Paper', 'Document Complex System', 'Summarize Research State', 'Write Master Note', '60 Min Theory Synthesis', 'Master Textbook Chapter'],
      ['75 Min Intensive Study', 'Compare Specialist Literature', '75 Min Science Dossier', 'Elaborate Complex Analysis', 'Write Own Study Script', 'Answer Research Question', 'Construct Expert Model'],
      ['90 Min Master Study Session', 'Work Through Monograph', 'Comprehensive Dossier', 'Deconstruct Science Paper', 'Prepare Lecture', '90 Min Theory Analysis', 'Encyclopedia Entry'],
      ['2 Hour Elite Study', 'Complete Monograph Analysis', 'Master Thesis Concept', 'Scientific Manifesto', 'Master Complex Field', 'Write Script for Others', 'Knowledge Ultra-Marathon'],
    ],
    descriptions: [
      ['Read for 5 to 10 minutes in a book of your choice.', 'Learn 3 new technical terms and note their meaning.', 'Read an interesting short article online.', 'Write down one question you want to research today.'],
      ['Read attentively for 15 minutes in a non-fiction book.', 'Listen to a 15-minute educational podcast.', 'Learn 5 new vocabulary words or technical terms.', 'Summarize what you read in 2 sentences.'],
      ['Read for 20 minutes without smartphone distractions.', 'Create a brief mindmap on a specialized topic.', 'Write down 3 key insights of the day.', 'Work through a textbook chapter for 20 minutes.'],
      ['Read for 25 minutes in a non-fiction or strategy book.', 'Watch a 30-minute scientific documentary.', 'Write a structured summary of an article.', 'Analyze a biological or technical concept.'],
      ['Complete 30 minutes of focused reading and research.', 'Create flashcards for 10 complex terms.', 'Listen to a 30-minute expert podcast and take notes.', 'Explain a difficult topic in writing in simple words.'],
      ['Read for 35 minutes in a non-fiction book and highlight key passages.', 'Create a digital research dossier on a topic.', 'Complete 40 minutes of an online learning course.', 'Write a 1-page summary of a non-fiction book.'],
      ['40 minutes of uninterrupted deep-work reading.', 'Read a scientific study and understand the conclusion.', 'Create a visual overview of a complex topic.', 'Memorize 15 new vocabulary words or terms.'],
      ['45 minutes intensive reading session in demanding literature.', 'Analyze a case study and draft solution approaches.', 'Write a detailed study log with bullet points.', 'Master the fundamentals of a new technology or theory.'],
      ['50 minutes focused study of a non-fiction book.', 'Compare 2 different theories and write down pros and cons.', 'Create a precise knowledge chart showing all connections.', 'Listen to a university lecture online with notes.'],
      ['60 minutes of uninterrupted deep dive reading.', 'Analyze a complex research paper from start to finish.', 'Write a 2-page summary of a specialized topic.', 'Construct a comprehensive knowledge matrix.'],
      ['75 minutes of scientific research and processing.', 'Work through a complete book chapter at university level.', 'Draft a scientific question and provide arguments.', 'Write your own study script on a topic area.'],
      ['90 minutes of intensive expert study without breaks.', 'Create a comprehensive research paper or teaching manuscript.', 'Analyze 3 different research papers and compare them.', 'Systematize an entire subject area in notes.'],
      ['120 minutes focused knowledge marathon at the highest level.', 'Master a highly complex specialized field completely.', 'Write a masterly manifesto or technical script.', 'Master 50 technical terms and give a practice lecture to yourself.'],
    ],
  },
  muskeln: {
    titles: [
      ['10 Push-ups', '15 Squats', '20 Sec Plank', 'Light Warmup', '10 Lunges', 'Stretches', 'Body Activation'],
      ['20 Push-ups', '30 Squats', '45 Sec Plank', '10 Min Core Workout', 'Circuit 1', 'Push-up Sets', 'Squat Routine'],
      ['30 Push-ups', '40 Squats', '60 Sec Plank', '20 Min Workout', '3 Sets Burpees', 'Leg Strength Basics', 'Upper Body Boost'],
      ['40 Push-ups', '50 Squats', '90 Sec Plank', 'Calisthenics Session', '20 Min HIIT Circuit', 'Dips & Push-ups', 'Core Blast'],
      ['50 Push-ups', '60 Squats', '2 Min Plank', '30 Min Strength Training', 'Push-Day Routine', 'Pull-Up Session', 'Leg Circuit'],
      ['60 Push-ups', '80 Squats', '2.5 Min Plank', '35 Min Intensive Workout', 'Calisthenics Advanced', 'Core & Tabata', 'Dips & Pull-ups'],
      ['75 Push-ups', '100 Squats', '3 Min Plank', '40 Min Dumbbell Workout', 'Full Body Power', '30 Burpees', 'Upper Body Pump'],
      ['85 Push-ups', '120 Squats', '3.5 Min Plank', '45 Min Strength Workout', 'Heavy Push Protocol', 'Pull-up & Dips Blast', 'Leg-Day Extreme'],
      ['100 Push-ups', '150 Squats', '4 Min Plank', '50 Min Heavy Lifting', 'Crossfit Benchmark Workout', 'Calisthenics Master', 'Full Body Demolition'],
      ['120 Push-ups', '180 Squats', '5 Min Plank', '60 Min Strength Training', 'Pro Calisthenics Routine', '50 Burpees Challenge', 'Heavy Dumbbell Session'],
      ['150 Push-ups', '200 Squats', '75 Min Strength Marathon', 'Heavy Compound Lifts', '75 Min Spartan Workout', '50 Reps Pull-up Protocol', 'Brutal Leg Day'],
      ['200 Push-ups Challenge', '250 Squats', '90 Min Heavy Workout', 'Elite Calisthenics Routine', '100 Burpees Challenge', 'Full Body Beast Mode', 'Squat Protocol'],
      ['300 Push-ups Marathon', '300 Squats & Dips', '120 Min Power Athletics', '1000 Rep Challenge', 'Titan Workout Protocol', 'Iron Body Session', 'Ultimate Muscle Overload'],
    ],
    descriptions: [
      ['Perform 10 cleanly executed push-ups spread out or all at once.', 'Do 15 controlled squats.', 'Hold the plank position for 20 seconds.', 'Do a short 5-minute warmup.'],
      ['Perform 20 push-ups in 2 sets.', 'Do 30 full-depth squats.', 'Hold the forearm plank for 45 seconds.', 'Perform 10 lunges per leg.'],
      ['Perform 30 push-ups spread throughout the day.', 'Do 40 squats.', 'Hold the plank for 60 seconds.', 'Do 3 sets of 10 dips on a chair edge.'],
      ['Perform 40 push-ups with proper form.', 'Do 50 squats.', 'Hold the plank for 90 seconds.', 'Do a 20-minute bodyweight workout.'],
      ['Perform 50 push-ups in 3 to 4 sets.', 'Do 60 squats.', '2-minute plank continuously or in 2 sets.', '30 minutes intensive strength training at gym or home.'],
      ['Perform 60 push-ups.', 'Do 80 squats.', '2.5 minutes forearm plank.', '35 minutes dumbbell or calisthenics training.'],
      ['Perform 75 push-ups spread across sets.', 'Do 100 squats today.', 'Hold a 3-minute plank.', '40 minutes heavy compound lifts or bodyweight exercises.'],
      ['Perform 85 push-ups.', 'Do 120 squats.', '45 minutes real muscle building workout.', '30 clean burpees.'],
      ['Perform 100 push-ups today.', 'Do 150 squats.', '50 minutes intensive strength training.', '4 minutes accumulated plank.'],
      ['Perform 120 push-ups.', 'Do 180 squats.', '60 minutes gym or calisthenics session.', '50 timed burpees.'],
      ['Perform 150 push-ups throughout the day.', 'Do 200 squats.', '75 minutes maximum hypertrophy training.', '50 accumulated pull-ups or dips.'],
      ['Perform 200 push-ups today.', 'Do 250 squats.', '90 minutes heavy full-body workout.', '100 burpees challenge.'],
      ['Perform 300 push-ups spread throughout the day.', 'Do 300 squats.', '120 minutes ultimate power workout.', '1000 repetitions challenge (various exercises).'],
    ],
  },
  geist: {
    titles: [
      ['3 Min Silence', '1 Gratitude', 'Deep Breaths', 'Short Break', '15 Min Digital Detox', 'Mindful Moment', 'Drink Tea without Phone'],
      ['5 Min Meditation', '3 Gratitudes', 'Box Breathing', 'Cool Face Splash', 'Write Down Thoughts', 'Walk without Music', '15 Min Focus Timer'],
      ['10 Min Meditation', 'Basic Journaling', '4-7-8 Breathing', '1 Min Cold Shower', 'Stoicism Quote', 'Silent Reflection', 'No Morning Social Media'],
      ['12 Min Meditation', 'Daily Journaling', '2 Min Cold Shower', 'Mind Reset', '20 Min Classical Music', 'Mindful Pause', 'Goal Reflection'],
      ['15 Min Meditation', 'Stoic Journaling', '3 Min Cold Shower', '2 Hour Dopamine Fast', '15 Min Breath Meditation', 'Mental Shield', 'Ego Check'],
      ['20 Min Meditation', 'Intensive Journaling', 'Evening Reflection', 'Cold Bath / Ice Shower', '1 Hour Focus without Distraction', 'Ethical Journal', 'Mental Reset'],
      ['25 Min Silence', 'Deep Meditation', '4 Min Cold Shower', 'Worry Analysis', 'Future Visualization', 'Half Day Digital Detox', 'Mindset Training'],
      ['30 Min Meditation', 'Stoic Protocol', '5 Min Ice Shower', 'Walking Meditation', 'Thought Choreography', 'Shadow Work Journaling', 'Mental Toughness Exercise'],
      ['35 Min Meditation', '20 Min Deep Journaling', 'Full Day Dopamine Detox', 'Mind Control Protocol', 'Mental Test under Stress', '1 Hour Mindfulness Retreat', 'Resilience Protocol'],
      ['45 Min Meditation', 'Life Reflection', 'Ice Bath / 5 Min Ice Cold', '2 Hour Focus State', 'Philosophical Analysis', 'Mindfulness Exam', 'Stoic Manifesto'],
      ['60 Min Meditation', 'Zen Meditation', 'Radical Digital Detox', 'Build Mental Fortress', '40 Min Deep Reflection', 'Extreme Cold Exposure', 'Self-Control Test'],
      ['75 Min Silence & Meditation', 'Big Journal Analysis', '24 Hour Dopamine Fast', '1 Day Monastery Protocol', 'Ultra Mental Focus', 'Deepest Self-Reflection', 'Shadow Integration'],
      ['90 Min Meditation', '2 Hour Master Silence', '36 Hour Fast & Contemplation', 'Unshakable Mental State', 'Absolute Thought Control', 'Zen Master Session', 'Philosophical Masterwork'],
    ],
    descriptions: [
      ['Sit quietly for 3 minutes and close your eyes.', 'Write down 1 thing you are grateful for.', 'Take 5 deep belly breaths.', 'Sit by the window for 5 minutes without screens.'],
      ['Meditate for 5 minutes with a timer.', 'Write down 3 things you are grateful for.', 'Do 3 minutes of Box Breathing (4s in, 4s hold, 4s out, 4s hold).', 'Write down your current thoughts uncensored.'],
      ['Meditate for 10 minutes in absolute silence.', 'Conduct a morning journaling session.', 'End your shower with 60 seconds of ice-cold water.', 'Avoid your smartphone for the first 30 minutes after waking up.'],
      ['Meditate for 12 minutes guided or unguided.', 'Write down your daily goals and your biggest obstacle.', '2-minute ice-cold shower.', 'Listen to 20 minutes of relaxing wave or classical sounds.'],
      ['15 minutes meditation without any movement.', 'Write a stoic journal entry about your reactions.', '3 minutes ice-cold water at the end of your shower.', 'Avoid all social media & videos for 2 hours.'],
      ['20 minutes deep meditation.', 'Conduct intensive evening journaling (What went well? What didn\'t?).', 'Avoid processed stimuli for half a day.', 'Visualize your most important successes for 10 minutes.'],
      ['25 minutes of silence.', 'Write down your biggest fears/worries and refute them rationally.', 'Take a 4-minute ice-cold shower.', 'Avoid all screens after 6 PM.'],
      ['30 minutes sitting meditation.', 'Create a manifesto of your personal values.', '5 minutes ice-cold water.', 'Avoid media consumption for a whole day.'],
      ['35 minutes meditation.', '20 minutes deep written conversation with yourself.', 'Complete a full day dopamine detox.', 'Practice mindfulness while walking.'],
      ['45 minutes deep meditation.', 'Analyze your life decisions from the last 12 months.', 'Treat yourself to an ice bath or 5 minutes icy shower.', '2 hours uninterrupted mental calm.'],
      ['60 minutes meditation in one block.', 'Go a full day without smartphone/PC.', 'Draft a written philosophy dossier.', 'Practice radical composure in a stressful situation.'],
      ['75 minutes meditation.', '24 hours fasting & spiritual contemplation.', 'Write a profound life analysis.', 'Observe 12 hours of absolute silence (Silent Day).'],
      ['90 minutes masterly meditation.', 'Spend a full day in silence and contemplation.', '36 hours fasting & mental renewal.', 'Achieve absolute unshakable peace of mind (Ataraxia).'],
    ],
  },
  beweglichkeit: {
    titles: [
      ['Neck Stretch', 'Shoulder Circles', '5 Min Stretch', '3000 Steps', 'Short Hip Opener', 'Mobilize Joints', 'Wrist Mobility'],
      ['10 Min Mobility', '5000 Steps', 'Spine Twists', 'Quad Stretch', '10 Min Morning Stretch', 'Ankle Mobility', '15 Min Walk'],
      ['15 Min Stretch Routine', '7000 Steps', 'Hip Mobility', 'Chest Opener & Shoulders', 'Hamstring Stretch', 'Evening Stretch', '10 Min Foam Rolling'],
      ['20 Min Stretch Program', '8000 Steps', '2 Min Deep Squat Hold', 'Back Relief', 'Mobility Circuit', 'Dynamic Stretching', 'Foam Massage'],
      ['25 Min Yoga Flow', '10,000 Steps', 'Hip Flexor Deep Stretch', 'Advanced Shoulder Mobility', '15 Min Foam Training', 'Splits Prep', 'Postural Training'],
      ['30 Min Yoga Session', '11,000 Steps', 'Full Body Mobility', 'Spinal Flexibility', '20 Min Foam Roller', 'Mobilize Thoracic Spine', 'Active Stretching'],
      ['35 Min Stretch & Yoga', '12,000 Steps', '20 Min Hip & Splits Session', 'Core & Mobility', '20 Min Shoulder Flexibility', 'Barefoot Walk', 'Posture Correction Workout'],
      ['40 Min Intensive Stretch', '13,000 Steps', 'Advanced Yoga Flow', '25 Min Fascia Treatment', 'Leg & Hip Flexibility', 'Back Health Circuit', 'Dynamic Joint Routine'],
      ['45 Min Yoga / Mobility', '14,000 Steps', '30 Min Hip & Splits', 'Full Body Flexibility', 'Deep Fascia Training', '30 Min Chest & Shoulder Stretch', 'Mobility Mastery'],
      ['50 Min Yoga Master', '15,000 Steps', 'Bridge & Backbends', '35 Min Splits Training', 'Fascia & Trigger Points', 'Intensive Full Body Stretch', 'Joint Health Protocol'],
      ['60 Min Yoga Session', '18,000 Steps Marathon', '45 Min Splits & Hip Mastery', 'Full Body Deep Stretch', '45 Min Shoulder & Spine Flexibility', 'Posture Transformation', 'Complete Fascia Treatment'],
      ['75 Min Yoga Flow & Stretch', '20,000 Steps Challenge', 'Extreme Mobility Training', '60 Min Master Flexibility', 'Full Body Restoration', 'Deep Tissue Massage', 'Anatomical Flexibility'],
      ['90 Min Yoga & Mobility Ultra', '25,000 Steps Mega Challenge', 'Splits Perfection Protocol', '90 Min Full Body Suppleness', 'Master of Body Control', 'Body Restoration Ultra', 'Mobility Marathon'],
    ],
    descriptions: [
      ['Stretch your neck and shoulders for 5 minutes.', 'Circle shoulders and wrists mindfully.', 'Take a short 5-minute walk.', 'Reach 3000 steps today.'],
      ['Complete a 10-minute mobility routine.', 'Walk at least 5000 steps today.', 'Stretch the front quad and hips.', 'Perform 10 cat-cow movements for your spine.'],
      ['Stretch your entire body for 15 minutes.', 'Walk at least 7000 steps today.', 'Use a foam roller for legs (10 min).', 'Hold a deep squat for 2 minutes.'],
      ['Complete a 20-minute stretching session.', 'Walk at least 8000 steps today.', 'Intensely stretch hip flexors and hamstrings.', 'Mobilize thoracic spine with rotations.'],
      ['Complete a 25-minute yoga video.', 'Reach the goal of 10,000 steps today.', 'Target tight fascia on calves and back.', 'Practice 15 minutes of targeted hip openers.'],
      ['30 minutes yoga or stretching continuously.', 'Walk 11,000 steps in fresh air today.', 'Work on legs and back with foam roller for 20 minutes.', 'Intensely stretch shoulders and chest muscles.'],
      ['35 minutes intensive mobility session.', 'Reach 12,000 steps throughout the day.', 'Do 20 minutes of splits prep exercises.', 'Complete an upright posture correction routine.'],
      ['40 minutes deep stretching of all muscle groups.', 'Walk 13,000 steps today.', '25 minutes fascia and trigger point treatment.', 'Intensely stretch lower back and hips.'],
      ['45 minutes yoga flow or athletic mobility.', 'Walk 14,000 steps.', '30 minutes focused hip and splits training.', 'Improve your backbend and bridge.'],
      ['50 minutes advanced yoga.', '15,000 steps a day.', '35 minutes splits and quad stretching.', 'Complete fascia anatomy program.'],
      ['60 minutes intensive stretching and mobility practice.', '18,000 steps walk or run.', '45 minutes hip and shoulder opening.', 'Align your body posture with targeted training.'],
      ['75 minutes comprehensive yoga and stretch block.', '20,000 steps challenge in one day.', 'Achieve maximum mobility in all joints.', 'Deep tissue self-massage & stretching.'],
      ['90 minutes ultimate flexibility program.', '25,000 steps mega challenge.', 'Complete splits and bridge protocol.', 'Maximum physical suppleness and pain-free joints.'],
    ],
  },
  business: {
    titles: [
      ['Note Idea', 'Organize To-Do List', 'Write 1 Email', 'Clean Desk', 'Maintain 1 Contact', 'Think Through Process', '5 Min Focus'],
      ['15 Min Focus Work', 'Compose Important Email', 'Set Daily Priorities', 'Network Message', 'Structure Document', '20 Min Research', 'Cost Check'],
      ['20 Min Deep Work', 'Document Process', 'Draft 1 Proposal', 'LinkedIn Outreach', 'Evaluate Customer Feedback', 'Optimize Workflow', 'Strategy Note'],
      ['25 Min Pomodoro', 'Create SOP', 'Reach Out to 2 Contacts', 'Project Planning', 'Delegate/Organize Tasks', '30 Min Business Reading', 'Draft Landing Page Copy'],
      ['30 Min Undistracted Work', 'Write Sales Script', '3 Acquisition Emails', 'Process Automation', 'Sketch Financial Model', '30 Min Competitor Analysis', 'Branding Concept'],
      ['40 Min Deep Work', 'SOP Manual Chapter', 'System Architecture', 'Outreach to 5 Contacts', 'Design Marketing Funnel', 'Define Product Features', 'Business Canvas'],
      ['45 Min Focus Block', 'Pitch Deck Slides', 'Sales Calls / Messages', 'Revise Website Content', '45 Min Strategy Paper', 'KPI Dashboard', 'Process Review'],
      ['50 Min Deep Work', 'Contract Draft / SOPs', '10 Outreach Contacts', 'Plan Marketing Campaign', 'Operations Optimization', 'Fill Offer Pipeline', 'Launch New Offer'],
      ['60 Min Deep Work Block', 'Complete SOP Series', '15 Targeted B2B Inquiries', 'Elaborate Revenue Strategy', 'Run Funnel Test', 'Build Product Prototype', 'Systematic Networking'],
      ['75 Min High-Value Work', 'Finalize Pitch Deck', '20 Outreach Messages', 'Build Automation Pipeline', 'Scaling Concept', 'Business Audit', 'Client Offensive'],
      ['90 Min Deep Work Sprint', 'Complete System Architecture', 'Prepare Enterprise Pitch', 'Full Funnel Architecture', '2026 Business Strategy', 'Build Scaling Engine', 'Master Operations Plan'],
      ['120 Min Power Business Sprint', 'Full Product Launch Concept', '30 B2B Outreach Contacts', 'Automate Business Processes', 'Mastermind Strategy Dossier', 'M&A / Scaling Analysis', 'Full Business Plan'],
      ['180 Min Ultra Deep Work Marathon', 'Build Complete Business System', 'Enterprise Outreach Offensive', 'Scale to Automated Systems', 'Full Product Transformation', 'Revenue Doubling Plan', 'Ultimate Business Empire Protocol'],
    ],
    descriptions: [
      ['Write down a business idea or optimization.', 'Organize your 3 most important tasks for the day.', 'Write 1 important business email.', 'Clean your desk for clear focus.'],
      ['Work for 15 minutes without smartphone on your main project.', 'Send a professional message to a contact.', 'Create a list of your core priorities.', 'Research 20 minutes on a market.'],
      ['20 minutes of uninterrupted work on an important task.', 'Write a Standard Operating Procedure (SOP) for a step.', 'Write a proposal or concept draft.', 'Optimize a daily workflow.'],
      ['Work a 25-minute Pomodoro block with 100% focus.', 'Reach out to 2 potential clients or partners.', 'Create a detailed milestone plan.', 'Read 30 minutes in a business book.'],
      ['30 minutes absolutely undisturbed work time (no notifications).', 'Write a persuasive sales or pitch script.', 'Draft 3 targeted outreach emails.', 'Automate a recurring digital task.'],
      ['40 minutes deep work on your revenue driver.', 'Document a complete business system in an SOP.', 'Plan a multi-stage marketing funnel.', 'Contact 5 potential clients or business partners.'],
      ['45 minutes crystal-clear work focus on high-value tasks.', 'Create or revise 5 slides of your pitch deck.', 'Conduct sales calls or write direct inquiries.', 'Analyze your most important business KPIs.'],
      ['50 minutes deep work.', 'Contact 10 qualified business contacts.', 'Optimize your entire offer and pricing structure.', 'Plan a complete marketing and sales campaign.'],
      ['60 minutes intense work sprint.', 'Write 15 targeted B2B inquiries.', 'Build a working digital prototype or landing page.', 'Develop a complete revenue scaling strategy.'],
      ['75 minutes uninterrupted high-value execution.', 'Produce an investor-ready pitch deck or strategy paper.', 'Write 20 custom B2B outreach messages.', 'Build a complex no-code/code automation pipeline.'],
      ['90 minutes uncompromising deep work sprint.', 'Prepare an enterprise client pitch or investor meeting.', 'Implement a fully structured operations system.', 'Create a masterly scaling concept.'],
      ['120 minutes hyper-focused business power block.', 'Send out 30 targeted sales inquiries.', 'Create full launch concept for a product.', 'Automate 80% of your administrative processes.'],
      ['180 minutes ultimate business marathon.', 'Develop full foundation for a scalable company.', 'Complete a major project from idea to market readiness.', 'Build a fully automated customer acquisition system.'],
    ],
  },
  geld: {
    titles: [
      ['Log Expenses', 'Check 1 Subscription', 'Save Spare Change', 'Check Bank Balance', 'Read Finance Tip', 'Compare Prices', '5 Min Savings Focus'],
      ['Track Daily Expenses', 'Cancel Unneeded Subscription', 'Put €5 into Savings / Depot', 'Budget Check', 'Read Finance Article', 'Search Cheaper Alternative', 'Strictly Follow Shopping List'],
      ['Financial Journal', '€10 Investment', 'Fixed Cost Analysis', 'Calculate Savings Rate', '20 Min Finance Podcast', 'Compare Contract', 'Keep Expense Log'],
      ['Expense Log Review', 'Invest / Save €20', 'Review Insurance', 'Sketch Income Idea', '25 Min Finance Book', 'Depot Overview', 'Negotiation Prep'],
      ['Create Monthly Budget', 'Save/Invest €50', 'Compare Utility Contracts', 'Check Side Income Option', '30 Min Stock/ETF Analysis', 'Emergency Fund Check', 'Organize Tax Documents'],
      ['Lower Fixed Costs by €20', '€100 Savings Boost', 'Net Worth Statement', 'Cashflow Calculation', '35 Min Finance Book', 'Sell Unused Items (eBay)', '30 Min Tax Prep'],
      ['Portfolio Rebalancing Check', 'Invest €150', 'Plan Salary Negotiation', 'Structure Passive Income Source', '45 Min Finance Strategy', 'Optimize Contracts (-€50/Mo)', 'Real Estate / ETF Research'],
      ['Financial Freedom Calculator', 'Invest €200', 'Generate Extra Income (Sale)', '45 Min Tax Return', '3-Day Spending Ban', 'Portfolio Diversification', 'Optimize Business Cashflow'],
      ['Complete Financial Audit', '€300 Investment Step', 'Contract Optimization (>€1000/yr saved)', 'Study Investment Theory', 'Build Income Stream', 'Tax Optimization Strategy', 'Asset Allocation Mastery'],
      ['5-Year Wealth Plan', 'Invest / Save €500', 'Complete Tax Return', 'Side Business Registration / Concept', 'Calculate Real Estate Investment', 'Portfolio Risk Analysis', 'High-Yield Investment Analysis'],
      ['Master Financial Plan', '€1000 Investment Milestone', 'Comprehensive Asset Management', 'Construct Passive Cashflow Engine', 'Tax Architecture with Expert Tips', 'Analyze Company Stake', 'Formulate FIRE Strategy'],
      ['75 Min Wealth Architecture', '€2000 Reinvestment', 'Complete Business Financial Model', 'Income Multiplier Strategy', 'Review Full Real Estate Prospectus', 'Secure >€1000 Tax Savings', 'Master Portfolio Allocation'],
      ['120 Min Wealth Manifesto', '€5000 Reinvestment Strategy', 'Full Financial Independence Roadmap', 'Multi-Stream Cashflow Architecture', 'Estate / Foundation / Tax Structure', 'Titan Financial Freedom Empire', 'Ultimate Wealth Masterplan'],
    ],
    descriptions: [
      ['Log all expenses for today down to the cent.', 'Check 1 subscription on your bank statements.', 'Check your current bank balance.', 'Add €1 to your savings app or piggy bank.'],
      ['Cancel an unused subscription or membership.', 'Collect all receipts of the week.', 'Set aside €5 consciously today.', 'Strictly stick 100% to your shopping list.'],
      ['Analyze your monthly fixed costs.', 'Calculate your current savings rate in percent.', 'Transfer €10 to your investment account.', 'Read for 20 minutes about finance and wealth building.'],
      ['Keep a meticulous expense log for this month.', 'Optimize a contract (electricity, mobile, internet).', 'Invest €20 into your ETF or savings plan.', 'Research an opportunity for side income.'],
      ['Create a detailed monthly budget with categories.', 'Transfer €50 to your savings or depot account.', 'File all tax receipts in order.', 'Analyze a company or ETF for 30 minutes.'],
      ['Optimize your fixed costs by at least €20 per month.', 'Sell unused items online (eBay, Vinted).', 'Create a complete overview of all assets.', 'Read for 35 minutes in a renowned finance book.'],
      ['Check the diversification of your investment portfolio.', 'Create a concrete argument guide for salary/pricing.', 'Save or invest €150 today.', 'Optimize your contracts and save at least €50/month.'],
      ['Create a detailed financial freedom calculator.', 'Invest €200 according to your defined strategy.', 'Work 45 minutes on your tax return.', 'Agree to a 3-day spending ban (essential groceries only).'],
      ['Perform a complete audit of all income and expenses.', 'Invest €300 or set up a new savings plan.', 'Optimize contracts to save >€1000 a year.', 'Develop a tax optimization strategy.'],
      ['Create your personal 5-year wealth plan.', 'Invest €500 in income-generating assets.', 'Complete your tax return entirely.', 'Calculate a real estate or business investment.'],
      ['Draft a master financial and cashflow plan.', 'Invest €1000 or reinvest profits.', 'Construct a passive income system.', 'Optimize your tax structure at a professional level.'],
      ['Create full financial architecture for the next 10 years.', 'Reinvest €2000 into high-yield asset classes.', 'Build a complete financial model for a side business.', 'Mirror your finances against principles of the wealthiest.'],
      ['Formulate your ultimate wealth manifesto for financial freedom.', 'Invest or reallocate €5000 into strategic assets.', 'Construct an unshakeable multi-asset portfolio.', 'Achieve full clarity on your path to independence.'],
    ],
  },
};

function synchronizeTaskTime(title: string, description: string, lang: Language | string = 'de'): { title: string; description: string } {
  let cleanTitle = title.replace(/\s*\((Teil|Part)\s*\d+\)/gi, '').replace(/\s*\[.*?\]/g, '').trim();
  let cleanDesc = description.replace(/\s*\((Teil|Part)\s*\d+\)/gi, '').replace(/\s*\[.*?\]/g, '').trim();

  const titleTimeMatch = cleanTitle.match(/\b(\d+)\s*(Minuten|Min|Stunden|Std|Minutes|Hours|hr|hrs)\b/i);
  if (titleTimeMatch) {
    const timeNum = titleTimeMatch[1];
    const timeUnit = titleTimeMatch[2];
    
    cleanDesc = cleanDesc.replace(
      /\b(\d+(\s*(bis|to)\s*\d+)?)\s*(Minuten|Min|Stunden|Std|Minutes|Hours|hr|hrs)\b/gi,
      `${timeNum} ${timeUnit}`
    );
  }

  return { title: cleanTitle, description: cleanDesc };
}

export function generate365PresetTasksForStat(statId: string, statName: string, lang: Language | string = 'de'): TaskItem[] {
  const currentLang = lang === 'en' ? 'en' : 'de';
  const patterns = currentLang === 'en' ? (STAT_THEMED_TASK_PATTERNS_EN[statId] || STAT_THEMED_TASK_PATTERNS[statId]) : STAT_THEMED_TASK_PATTERNS[statId];
  const tasks: TaskItem[] = [];

  let globalOrder = 1;

  for (let tier = 0; tier <= 12; tier++) {
    // 28 tasks for tiers 0..11, 29 tasks for tier 12 = 365 tasks total
    const count = tier === 12 ? 29 : 28;

    for (let i = 0; i < count; i++) {
      let rawTitle = '';
      let rawDescription = '';

      if (patterns) {
        const titleList = patterns.titles[tier] || patterns.titles[0];
        const descList = patterns.descriptions[tier] || patterns.descriptions[0];

        const idx = i % titleList.length;
        rawTitle = titleList[idx];
        rawDescription = descList[idx % descList.length];
      } else {
        const tierInfo = getTierInfo(tier, currentLang);
        if (currentLang === 'en') {
          rawTitle = `${statName} Activity (${tierInfo.label})`;
          rawDescription = `Complete a targeted ${statName} task at ${tierInfo.label} level today.`;
        } else {
          rawTitle = `${statName}-Aktivität (${tierInfo.label})`;
          rawDescription = `Erledige heute eine gezielte ${statName}-Aufgabe auf ${tierInfo.label}-Niveau.`;
        }
      }

      const { title, description } = synchronizeTaskTime(rawTitle, rawDescription, currentLang);

      tasks.push({
        id: `preset-${statId}-d${globalOrder}`,
        title,
        description,
        order: globalOrder,
        tier,
        isCustom: false,
      });

      globalOrder++;
    }
  }

  return tasks;
}

// Memory cache for stat preset databases
const statPresetCache: Record<string, TaskItem[]> = {};

export function get365PresetTasksForStat(statId: string, statName: string, lang: Language | string = 'de'): TaskItem[] {
  const currentLang = lang === 'en' ? 'en' : 'de';
  const cacheKey = `${statId}-${currentLang}`;
  if (!statPresetCache[cacheKey]) {
    statPresetCache[cacheKey] = generate365PresetTasksForStat(statId, statName, currentLang);
  }
  return statPresetCache[cacheKey];
}

/**
 * Returns the task for a given stat based on its current value (0-100%).
 * Filters out tasks that have been deleted.
 */
export function getActiveTaskForStatAndValue(
  stat: { id: string; name: string; value: number; tasks?: TaskItem[]; taskSelectionMode?: 'random' | 'sequential'; currentTaskIndex?: number },
  deletedTaskIds: string[] = [],
  todayDateStr: string,
  lang: Language | string = 'de'
): TaskItem {
  const currentLang = lang === 'en' ? 'en' : 'de';
  const currentTier = getTierIndex(stat.value);

  // Get user tasks for this stat
  const userStatTasks = (stat.tasks || []).filter((t) => !deletedTaskIds.includes(t.id));

  // Custom user tasks are always available regardless of tier
  const customTasks = userStatTasks.filter((t) => t.isCustom);

  // Preset user tasks that match current tier
  const matchingUserPresetTasks = userStatTasks.filter((t) => !t.isCustom && t.tier === currentTier);

  // Unlocked preset user tasks up to current tier
  const unlockedUserPresetTasks = userStatTasks.filter((t) => !t.isCustom && t.tier !== undefined && t.tier <= currentTier);

  // If we have custom or matching user preset tasks, select from them
  let candidatePool = [...customTasks, ...matchingUserPresetTasks];

  // If candidate pool is empty for exact tier, draw from all unlocked user preset tasks up to current tier
  if (candidatePool.length === 0 && unlockedUserPresetTasks.length > 0) {
    candidatePool = unlockedUserPresetTasks;
  }

  // If candidate pool is still empty, grab preset tasks from global 365 database for this tier
  if (candidatePool.length === 0) {
    const preset365 = get365PresetTasksForStat(stat.id, stat.name, currentLang);
    const tierPreset365 = preset365.filter(
      (t) => t.tier === currentTier && !deletedTaskIds.includes(t.id)
    );
    candidatePool = tierPreset365;
  }

  // Fallback if tier candidate pool is still empty: look at all unlocked 365 preset tasks (tier <= currentTier)
  if (candidatePool.length === 0) {
    const preset365 = get365PresetTasksForStat(stat.id, stat.name, currentLang);
    const unlockedPresets = preset365.filter((t) => (t.tier ?? 0) <= currentTier && !deletedTaskIds.includes(t.id));
    if (unlockedPresets.length > 0) {
      candidatePool = unlockedPresets;
    } else {
      // Emergency fallback
      const tierInfo = getTierInfo(currentTier, currentLang);
      if (currentLang === 'en') {
        return {
          id: `fallback-${stat.id}-${Date.now()}`,
          title: `${translateStatName(stat.name, currentLang)} Protocol`,
          description: `Complete a valuable activity for ${translateStatName(stat.name, currentLang)} at ${tierInfo.label} level today.`,
          order: 1,
          tier: currentTier,
          isCustom: false,
        };
      }
      return {
        id: `fallback-${stat.id}-${Date.now()}`,
        title: `${stat.name} Protokoll`,
        description: `Erledige heute eine wertvolle Aktivität für ${stat.name} auf ${tierInfo.label}-Niveau.`,
        order: 1,
        tier: currentTier,
        isCustom: false,
      };
    }
  }

  // Pick deterministic task based on today's date string
  let hash = 0;
  for (let i = 0; i < todayDateStr.length; i++) {
    hash += todayDateStr.charCodeAt(i) + stat.id.charCodeAt(0);
  }
  const idx = Math.abs(hash) % candidatePool.length;
  const chosenTask = candidatePool[idx];

  // If language is English and chosen task is a preset task (not custom), ensure it's returned with English text
  if (currentLang === 'en' && !chosenTask.isCustom) {
    const preset365En = get365PresetTasksForStat(stat.id, stat.name, 'en');
    let matchedEn = preset365En.find((t) => t.id === chosenTask.id);
    if (!matchedEn && chosenTask.tier !== undefined) {
      matchedEn = preset365En.find((t) => t.tier === chosenTask.tier && t.order === chosenTask.order);
    }
    if (!matchedEn && preset365En.length > 0) {
      const tierPresets = preset365En.filter((t) => t.tier === currentTier);
      matchedEn = tierPresets[idx % tierPresets.length] || preset365En[0];
    }
    if (matchedEn) {
      return matchedEn;
    }
  } else if (currentLang === 'de' && !chosenTask.isCustom) {
    const preset365De = get365PresetTasksForStat(stat.id, stat.name, 'de');
    let matchedDe = preset365De.find((t) => t.id === chosenTask.id);
    if (!matchedDe && chosenTask.tier !== undefined) {
      matchedDe = preset365De.find((t) => t.tier === chosenTask.tier && t.order === chosenTask.order);
    }
    if (!matchedDe && preset365De.length > 0) {
      const tierPresets = preset365De.filter((t) => t.tier === currentTier);
      matchedDe = tierPresets[idx % tierPresets.length] || preset365De[0];
    }
    if (matchedDe) {
      return matchedDe;
    }
  }

  return chosenTask;
}
