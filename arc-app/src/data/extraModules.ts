import { BottomBarModuleConfig } from '../types';

export const ALL_EXTRA_MODULES: BottomBarModuleConfig[] = [
  {
    id: 'motivation',
    title: 'Motivationssprüche',
    description: 'Tägliche Dosis unerschütterliche Disziplin & Mindset-Protokolle.',
    icon: '🔥',
    active: true,
  },
  {
    id: 'business_ideas',
    title: 'Business-Ideen',
    description: 'Skalierbare Geschäftsmodelle, SaaS-Konzepte & High-Income-Skills.',
    icon: '💡',
    active: true,
  },
  {
    id: 'books',
    title: 'Bücher Empfehlungen',
    description: 'Die 150 wichtigsten Werke für Unternehmertum, Mindset, Finanzen & Stärke.',
    icon: '📖',
    active: true,
  },
  {
    id: 'biohacking',
    title: 'Biohacking Protocols',
    description: 'Schlafoptimierung, Lichtexposition, Dopamin-Fasten & Erholung.',
    icon: '⚡',
    active: false,
  },
  {
    id: 'stoic_rules',
    title: 'Stoische Regeln',
    description: 'Eiserne Maximen zur emotionalen Kontrolle & Resilienz.',
    icon: '🏛️',
    active: false,
  },
];

export interface ModuleContentItem {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  tags: string[];
}

export const EXTRA_MODULES_CONTENT: Record<string, ModuleContentItem[]> = {
  motivation: [
    { id: 'm-1', title: 'Die 2-Minuten-Regel der Disziplin', subtitle: 'Überwinde den Widerstand des Gehirns', content: 'Wenn du keine Lust hast zu trainieren oder zu arbeiten, verlangst du von dir nur 2 Minuten. Fang einfach an. Nach 2 Minuten ist die neurobiologische Hemmschwelle gebrochen und das Trägheitsgesetz arbeitet für dich.', tags: ['Disziplin', 'Mindset', 'Aktion'] },
    { id: 'm-2', title: 'Schmerz als Kompass', subtitle: 'Wo die Reibung ist, ist das Wachstum', content: 'Das Gefühl von Anstrengung und mentalem Widerstand ist kein Signal zum Aufhören, sondern das visuelle Aufleuchten eines Level-Ups. Suche den kontrollierten Schmerz gezielt auf.', tags: ['Resilienz', 'Fokus'] },
    { id: 'm-3', title: 'Keine Ausreden vor dem Spiegel', subtitle: 'Volle Selbstverantwortung (Extreme Ownership)', content: 'Jedes Ergebnis in deinem Leben ist die direkte Konsequenz deiner täglichen Entscheidungen. Schuldzuweisungen nehmen dir die Macht. Übernimm 100% Verantwortung.', tags: ['Klarheit', 'Führung'] },
    { id: 'm-4', title: 'Die 1%-Zinseszins-Gleichung', subtitle: 'Kumulative Wirkung kleiner Taten', content: 'Wenn du jeden Tag nur um 1% besser wirst, bist du am Ende des Jahres 37-mal stetiger. Kleine, scheinbar unbedeutende Disziplin-Handlungen verändern deine gesamte Realität.', tags: ['Gewohnheiten', 'Fortschritt'] },
    { id: 'm-5', title: 'Identitätsbasiertes Ausführen', subtitle: 'Du tust nicht nur, wer du bist – du wirst, was du tust', content: 'Frage dich nicht: "Schaffe ich diese Aufgabe?", sondern: "Wie handelt ein absolut disziplinierter High-Performer in diesem Augenblick?" Handle sofort wie dein zukünftiges Ich.', tags: ['Identity', 'Psychologie'] },
    { id: 'm-6', title: 'Fokus auf den Prozess, nicht das Resultat', subtitle: 'Emotionale Unabhängigkeit von externen Faktoren', content: 'Du kannst Ergebnisse nie zu 100% kontrollieren, aber deine Anstrengung zu 100%. Verliebe dich in die tägliche Ausführung und das System – die Ergebnisse folgen automatisch.', tags: ['Systeme', 'Stoizismus'] },
    { id: 'm-7', title: 'Die 40%-Regel der Reserven', subtitle: 'Wenn dein Gehirn "Müde" schreit', content: 'Wenn dein Verstand dir einredet, dass du erschöpft bist, hast du in Wahrheit erst 40% deines echten Potenzials ausgeschöpft. Die restlichen 60% liegen hinter der Schmerzwand.', tags: ['Ausdauer', 'Mentale Stärke'] },
    { id: 'm-8', title: 'Stille Ausführung ohne Lärm', subtitle: 'Arbeite im Schatten, glänze durch Resultate', content: 'Kündige deine Pläne nicht jedem an. Dopamin wird schon beim Reden freigesetzt und schwächt deinen Tatendrang. Behalte deine Ziele für dich und lass Resultate sprechen.', tags: ['Fokus', 'Diskretion'] },
    { id: 'm-9', title: 'Eliminierung von Reibungsverlusten', subtitle: 'Optimiere deine Umgebung vorab', content: 'Verlasse dich nicht auf reine Willenskraft – sie ist eine begrenzte Ressource. Optimiere deine Arbeitsumgebung so, dass schlechte Gewohnheiten schwer und gute unvermeidbar werden.', tags: ['Effizienz', 'Habits'] },
    { id: 'm-10', title: 'Der eiserne Fokus-Filter', subtitle: 'Nein-Sagen als Superkraft', content: 'Jedes Mal wenn du Ja zu etwas Unwichtigem sagst, sagst du Nein zu deiner eigenen Zukunft. Lerne mit chirurgischer Präzision Ablenkungen abzuwehren.', tags: ['Fokus', 'Prioritäten'] },
    { id: 'm-11', title: 'Die 24-Stunden-Reset-Dichotomie', subtitle: 'Der gestrige Tag definiert dich heute nicht', content: 'Egal ob du gestern gescheitert bist oder triumphiert hast: Heute morgen steht der Zähler wieder auf Null. Bleibe hungrig, bleibe bescheiden.', tags: ['Reset', 'Gleichmut'] },
    { id: 'm-12', title: 'Souveränität in der Krise', subtitle: 'Ruhe ist die höchste Form der Macht', content: 'Inmitten des Chaos verlangsamen High-Performer ihr Atmen und bewerten Fakten statt Emotionen. Deine Beherrschbarkeit macht dich unangreifbar.', tags: ['Krise', 'Stoizismus'] },
    { id: 'm-13', title: 'Die Anti-Bequemlichkeits-Injektion', subtitle: 'Zerstöre die Komfortzone', content: 'Sobald sich etwas zu gemütlich anfühlt, stagnierst du. Setze dir wöchentlich eine unbequeme Challenge, die deinen Geist schärft.', tags: ['Challenge', 'Wachstum'] },
    { id: 'm-14', title: 'Konsequente Standard-Definition', subtitle: 'Deine Untergrenze bestimmt dein Leben', content: 'Nicht deine Ziele bestimmen deine Zukunft, sondern die Mindeststandards, die du nicht zu unterschreiten bereit bist.', tags: ['Standards', 'Exzellenz'] },
    { id: 'm-15', title: 'Das Gesetz des Momentum', subtitle: 'Unaufhaltsame kinetische Energie', content: 'Ein rollender Stein setzt keinen Ansatz an. Sorge dafür, dass du jeden Tag mindestens eine konkrete Aktion abschließt, um das Momentum aufrechtzuerhalten.', tags: ['Momentum', 'Aktion'] },
    { id: 'm-16', title: 'Mentale Panzerung', subtitle: 'Immun gegen fremde Meinungen', content: 'Kritik von Menschen, die du nicht um Rat fragen würdest, sollte dich niemals berühren. Fokussiere dich ausschließlich auf deine eigene Mission.', tags: ['Fokus', 'Souveränität'] },
    { id: 'm-17', title: 'Das Gesetz der Konsequenzen', subtitle: 'Säen und Ernten', content: 'Du kannst dir nicht aussuchen, welche Ernte du einfährst, wenn du nicht bereit bist, die Saat zu pflanzen und jeden Tag zu gießen.', tags: ['Aktion', 'Realität'] },
    { id: 'm-18', title: 'Visuelle Zielverankerung', subtitle: 'Kristallklare Ausrichtung', content: 'Ein Geist ohne klares Ziel irrt im Kreis. Visualisiere deinen nächsten Meilenstein in greifbaren Details, bevor du den Tag beginnst.', tags: ['Klarheit', 'Ziele'] },
    { id: 'm-19', title: 'Befreiung von Instant Gratification', subtitle: 'Langfristige Belohnung schlägt Dopamin-Kicks', content: 'Tausche billigen kurzfristigen Genuss gegen nachhaltigen stolzen Erfolg. Wer Belohnungen aufschiebt, dominiert das Feld.', tags: ['Dopamin', 'Disziplin'] },
    { id: 'm-20', title: 'Unbeugsame Entschlossenheit', subtitle: 'Wenn Plan A scheitert, hat das Alphabet 25 weitere Buchstaben', content: 'Hindernisse ändern nicht das Ziel, sondern nur den Weg dorthin. Sei flexibel in der Taktik, aber unerbittlich in der Vision.', tags: ['Resilienz', 'Strategie'] },
  ],

  business_ideas: [
    { id: 'b-1', title: 'AI Micro-SaaS Agenten für Nischenbranchen', subtitle: 'Hoher MRR / Wiederkehrende Umsätze', content: 'Automatisierte AI-Workflows für Handwerksbetriebe, Kanzleien oder Immobilienmakler (z.B. automatisierte Terminqualifikation, KI-Vertragsanalyse oder Rechnungsprüfung).', tags: ['KI', 'B2B', 'SaaS'] },
    { id: 'b-2', title: 'High-Ticket Automation Agency', subtitle: 'Workflow-Engine für lokale Unternehmen', content: 'Baue No-Code/Low-Code Automatisierungen (Make, Zapier, Python scripts) für mittelständische Unternehmen, um manuelle Datenübertragungen einzusparen.', tags: ['Agency', 'Automation', 'Cashflow'] },
    { id: 'b-3', title: 'Spezialisierter Content-Repurposing Engine', subtitle: 'B2B Content Optimization', content: 'Übernahme von Longform-Podcasts/YouTube-Videos für Führungskräfte und Umwandlung in 10x Hooks, LinkedIn-Posts, Newsletter & Kurzvideos.', tags: ['Marketing', 'Services'] },
    { id: 'b-4', title: 'Vertikale KI-Kundensupport Agenten', subtitle: '24/7 Autonomer Kundenservice', content: 'Entwicklung maßgeschneiderter RAG-Chatbots (Retrieval-Augmented Generation), die auf Firmen-Wissensdatenbanken geschult sind und Kundentickets selbstständig lösen.', tags: ['AI Agenten', 'SaaS', 'B2B'] },
    { id: 'b-5', title: 'Data Scraping & Enrichment Service', subtitle: 'High-Demand B2B Leads', content: 'Biete automatisierte Lead-Listen an, die mit tiefen KI-Recherchen (Firmengröße, Tech-Stack, offene Stellen) angereichert sind, um Kaltakquise-Quoten zu verdreifachen.', tags: ['Sales', 'Data', 'B2B'] },
    { id: 'b-6', title: 'Nischen-Newsletter mit Paid Subscription', subtitle: 'Media Company + Monetarisierung', content: 'Erstelle einen hochspezialisierten wöchentlichen Branchen-Report (z.B. AI in MedTech) mit exklusiven Analysen. Monetarisiere durch Premium-Mitgliedschaften & Sponsoring.', tags: ['Media', 'Newsletter', 'Content'] },
    { id: 'b-7', title: 'Cyber Security Health-Check für KMU', subtitle: 'Risiko-Audit & Prävention', content: 'Biete verständliche Sicherheits-Audits für lokale Betriebe an (Phishing-Tests, Passwort-Policies, Backup-Überprüfungen) und betreue sie als monatlicher MSP.', tags: ['Cybersecurity', 'Services', 'IT'] },
    { id: 'b-8', title: 'White-Label AI Prompt Templates', subtitle: 'Digital Products & Knowledge Engine', content: 'Erstelle hochgradig verfeinerte, getestete System-Prompts für Marketing-, Design- und Entwicklerteams und verkaufe sie auf Marktplätzen oder eigener Plattform.', tags: ['Digital Products', 'Passives Einkommen'] },
    { id: 'b-9', title: 'Automatisierte E-Commerce Review Aggregation', subtitle: 'Social Proof Engine', content: 'Eine Plattform, die Kundenbewertungen von Amazon, Shopware & Shopify sammelt, verifiziert und mittels KI in performante Video-Ads konvertiert.', tags: ['E-Commerce', 'SaaS'] },
    { id: 'b-10', title: 'B2B SaaS Compliance Audit Tool', subtitle: 'DSGVO & AI Act Monitoring', content: 'Ein Tool, das Firmen-Websites und interne Tools automatisch auf Konformität mit dem EU AI Act und DSGVO prüft und sofortige Handlungsanweisungen gibt.', tags: ['Compliance', 'Software'] },
    { id: 'b-11', title: 'Remote High-Ticket Sales Recruiting', subtitle: 'Exklusive Headhunting Nische', content: 'Recruiting-Agentur spezialisiert auf den Aufbau von Remote Closer & Setter Teams für B2B-Softwarehäuser.', tags: ['Recruiting', 'Sales'] },
    { id: 'b-12', title: 'PropTech Solar Potential Analyzer', subtitle: 'Automatisierte Dachflächen-Analyse', content: 'Verwendung von Satellitendaten & KI zur Berechnung von Solarpotenzialen für Gewerbeimmobilien mit direktem B2B-Angebotsgenerator.', tags: ['CleanTech', 'AI', 'RealEstate'] },
  ],

  // 150 EXACT UNIQUE BOOKS DATABASE
  books: [
    { id: 'bk-1', title: 'Die 4-Stunden-Woche', subtitle: 'Autor: Timothy Ferriss', content: 'Grundlagenwerk für Prozess-Automatisierung, Outsourcing, Gehirn-Effizienz und die Befreiung von klassischer Büroarbeit.', tags: ['Business', 'Effizienz'] },
    { id: 'bk-2', title: 'Can’t Hurt Me', subtitle: 'Autor: David Goggins', content: 'Meistere deinen Geist und überwinde mentale Grenzen. Das 40%-Gesetz beschreibt, wie viel Reserven dein Körper wirklich noch besitzt.', tags: ['Mindset', 'Mentale Stärke'] },
    { id: 'bk-3', title: 'Die 7 Wege zur Effektivität', subtitle: 'Autor: Stephen R. Covey', content: 'Klassiker zur persönlichen Transformation: Proaktiv sein, das Ende vor Augen haben, Prioritäten setzen und synergetisch handeln.', tags: ['Erfolg', 'Strategie'] },
    { id: 'bk-4', title: 'Atomic Habits (Die 1%-Methode)', subtitle: 'Autor: James Clear', content: 'Wie winzige Veränderungen zu verblüffenden Ergebnissen führen. Fokus auf Systemgestaltung, Habit-Loop und Identitätswechsel.', tags: ['Gewohnheiten', 'Psychologie'] },
    { id: 'bk-5', title: 'Deep Work', subtitle: 'Autor: Cal Newport', content: 'Menge an ablenkungsfreier, fokussierter Arbeit als wertvollste Fähigkeit im 21. Jahrhundert. Protokolle zur Eliminierung digitaler Reize.', tags: ['Produktivität', 'Fokus'] },
    { id: 'bk-6', title: 'Der Almanach von Naval Ravikant', subtitle: 'Autor: Eric Jorgenson', content: 'Ein Leitfaden zu Reichtum und Glück ohne Glücksspiel. Prinzipien über Hebelwirkung, spezifisches Wissen und langfristige Ausrichtung.', tags: ['Wealth', 'Weisheit'] },
    { id: 'bk-7', title: 'Ego is the Enemy', subtitle: 'Autor: Ryan Holiday', content: 'Wie das Ego den Aufstieg blockiert, Erfolge sabotiert und Misserfolge verschlimmert. Ein Plädoyer für Bescheidenheit und Arbeitsmoral.', tags: ['Stoizismus', 'Charakter'] },
    { id: 'bk-8', title: 'Psychologie des Geldes', subtitle: 'Autor: Morgan Housel', content: 'Zeitlose Lektionen über Vermögen, Gier und Verhalten. Warum finanzieller Erfolg wenig mit Intelligenz, aber viel mit Verhalten zu tun hat.', tags: ['Finanzen', 'Behavioral Science'] },
    { id: 'bk-9', title: 'Schnelles Denken, langsames Denken', subtitle: 'Autor: Daniel Kahneman', content: 'Analyse der zwei Systeme unseres Gehirns: System 1 (intuitiv, schnell) und System 2 (analytisch, langsam) sowie kognitive Verzerrungen.', tags: ['Psychologie', 'Entscheidungen'] },
    { id: 'bk-10', title: 'Principles (Prinzipien des Erfolgs)', subtitle: 'Autor: Ray Dalio', content: 'Unternehmens- und Lebensprinzipien des Gründer von Bridgewater Associates. Radikale Transparenz und evidenzbasierte Entscheidungen.', tags: ['Führung', 'Unternehmertum'] },
    { id: 'bk-11', title: 'Zero to One', subtitle: 'Autor: Peter Thiel', content: 'Wie man disruptive Monopole baut, statt bestehende Märkte geringfügig zu kopieren. Von 0 zu 1 erschafft Neues, von 1 zu n kopiert.', tags: ['Startup', 'Innovation'] },
    { id: 'bk-12', title: 'Extreme Ownership', subtitle: 'Autor: Jocko Willink & Leif Babin', content: 'Navy-SEAL-Führungsprinzipien für Wirtschaft und Leben. Übernimm 100% Verantwortung für jedes Scheitern deines Teams.', tags: ['Führung', 'Disziplin'] },
    { id: 'bk-13', title: 'Der Weg des wahren Mannes', subtitle: 'Autor: David Deida', content: 'Ein Leitfaden für maskuline Entschlossenheit, Beziehungsdynamiken, Zweckbestimmtheit und eiserne Ausrichtung.', tags: ['Mindset', 'Persönlichkeit'] },
    { id: 'bk-14', title: 'Mindset: Neugierig auf die Welt', subtitle: 'Autor: Carol S. Dweck', content: 'Die Psychologie des Erfolgs: Statisches vs. dynamisches Selbstbild (Fixed vs. Growth Mindset) und wie Talente entwickelt werden.', tags: ['Psychologie', 'Wachstum'] },
    { id: 'bk-15', title: 'Rich Dad Poor Dad', subtitle: 'Autor: Robert T. Kiyosaki', content: 'Was die Reichen ihren Kindern über Geld beibringen. Aktiva vs. Passiva, finanzielle Bildung und der Ausstieg aus dem Hamsterrad.', tags: ['Finanzen', 'Investieren'] },
    { id: 'bk-16', title: 'Sapiens: Eine kurze Geschichte der Menschheit', subtitle: 'Autor: Yuval Noah Harari', content: 'Wie kognitive Revolution, Landwirtschaft und Geld die menschliche Spezies zur dominierenden Macht des Planeten machten.', tags: ['Geschichte', 'Philosophie'] },
    { id: 'bk-17', title: 'The Lean Startup', subtitle: 'Autor: Eric Ries', content: 'Schnelles Validieren von Geschäftsideen durch das Build-Measure-Learn-Prinzip und das Minimum Viable Product (MVP).', tags: ['Startup', 'Methodik'] },
    { id: 'bk-18', title: 'Die Kunst des Krieges', subtitle: 'Autor: Sun Tzu', content: 'Uraltes Strategiewerk über Konfliktvermeidung, Vorbereitung, Positionierung und den Sieg ohne sinnlose Zermürbungsschlachten.', tags: ['Strategie', 'Klassiker'] },
    { id: 'bk-19', title: 'Selbstbetrachtungen', subtitle: 'Autor: Marc Aurel', content: 'Die privaten Tagebücher des römischen Kaisers. Ein stoisches Manifest über Pflichtbewusstsein, innere Ruhe und Vergänglichkeit.', tags: ['Stoizismus', 'Philosophie'] },
    { id: 'bk-20', title: 'Von der Kürze des Lebens', subtitle: 'Autor: Seneca', content: 'Unbezahlbare Weisheiten darüber, wie Menschen ihre kostbarste Ressource – Zeit – an Trivialitäten verschwenden.', tags: ['Zeit', 'Stoizismus'] },
    { id: 'bk-21', title: 'Handbüchlein der Moral', subtitle: 'Autor: Epiktet', content: 'Praktischer Stoizismus pur: Unterscheide strikt zwischen Dingen in deiner Macht und Dingen außerhalb deiner Kontrolle.', tags: ['Stoizismus', 'Resilienz'] },
    { id: 'bk-22', title: 'Der reichste Mann von Babylon', subtitle: 'Autor: George S. Clason', content: 'Klassische Parabeln über das Sparen von 10% des Einkommens, kluges Investieren und den Schutz von Vermögen.', tags: ['Finanzen', 'Sparen'] },
    { id: 'bk-23', title: 'Think and Grow Rich', subtitle: 'Autor: Napoleon Hill', content: 'Die 13 Gesetze des Erfolgs, recherchiert bei den reichsten Persönlichkeiten des 20. Jahrhunderts. Gedanken werden Realität.', tags: ['Erfolg', 'Mindset'] },
    { id: 'bk-24', title: 'Der Alchimist', subtitle: 'Autor: Paulo Coelho', content: 'Eine zeitlose Parabel über das Verfolgen des eigenen Lebensplans, das Hören auf das Herz und das Überwinden von Angst.', tags: ['Inspiration', 'Vision'] },
    { id: 'bk-25', title: 'Influence: Die Psychologie des Überzeugens', subtitle: 'Autor: Robert B. Cialdini', content: 'Die 6 universellen Prinzipien der Überzeugung: Reziprozität, Knappheit, Autorität, Konsistenz, Sympathie & Social Proof.', tags: ['Psychologie', 'Sales'] },
    { id: 'bk-26', title: 'Never Split the Difference', subtitle: 'Autor: Chris Voss', content: 'Verhandlungstaktiken eines ehemaligen FBI-Chefunterhändlers. Taktische Empathie, Mirroring und das Erreichen von "That’s Right".', tags: ['Verhandlung', 'Kommunikation'] },
    { id: 'bk-27', title: 'Essentialismus', subtitle: 'Autor: Greg McKeown', content: 'Die disziplinierte Suche nach dem Weniger. Wie du Unwichtiges eliminierst, um deine Energie auf das absolut Entscheidende zu bündeln.', tags: ['Fokus', 'Produktivität'] },
    { id: 'bk-28', title: 'Make Time', subtitle: 'Autor: Jake Knapp & John Zeratsky', content: 'Praktisches System zur Rückgewinnung der Tageskontrolle: Tägliches Highlight wählen, Fokus halten und Energie aufladen.', tags: ['Zeitmanagement', 'Fokus'] },
    { id: 'bk-29', title: 'Range: Warum Generalisten gewinnen', subtitle: 'Autor: David Epstein', content: 'Warum breit gefächertes Wissen und Spät-Spezialisierung in einer komplexen Welt engstirniger Expertenüberlegenheit überlegen ist.', tags: ['Lernen', 'Strategie'] },
    { id: 'bk-30', title: 'The Hard Thing About Hard Things', subtitle: 'Autor: Ben Horowitz', content: 'Unbeschönigte Wahrheit über das Führen von Unternehmen in Krisen, Entlassungen, harte Entscheidungen und den "War-Time CEO".', tags: ['Unternehmertum', 'Krise'] },
    { id: 'bk-31', title: 'The E-Myth Revisited', subtitle: 'Autor: Michael E. Gerber', content: 'Warum die meisten Kleinunternehmen scheitern. Arbeite AN deinem Unternehmen, nicht NUR IN deinem Unternehmen.', tags: ['Business', 'Systeme'] },
    { id: 'bk-32', title: 'Shoe Dog (Die Nike-Story)', subtitle: 'Autor: Phil Knight', content: 'Die persönliche Geschichte des Nike-Gründers Phil Knight: Vom Import japanischer Laufschuhe zum weltweiten Sport-Imperium.', tags: ['Biografie', 'Inspiration'] },
    { id: 'bk-33', title: 'Steve Jobs', subtitle: 'Autor: Walter Isaacson', content: 'Die monumentale Biografie des Apple-Mitbegründers. Visionäre Perfektion, Reality Distortion Field und unnachgiebige Eleganz.', tags: ['Biografie', 'Innovation'] },
    { id: 'bk-34', title: 'Elon Musk', subtitle: 'Autor: Walter Isaacson', content: 'Tiefeneinblick in das Leben von Musk: Tesla, SpaceX, Risikobereitschaft, First-Principles-Denken und gigantische Zielsetzungen.', tags: ['Biografie', 'Tech'] },
    { id: 'bk-35', title: 'Bad Blood', subtitle: 'Autor: John Carreyrou', content: 'Die Enthüllung des Theranos-Skandals um Elizabeth Holmes. Eine Warnung vor blindem Hype, Täuschung und fehlender Substanz.', tags: ['Investigativ', 'Business'] },
    { id: 'bk-36', title: 'Outlive: Die Wissenschaft vom langen Leben', subtitle: 'Autor: Dr. Peter Attia', content: 'Medizin 3.0: Wie Bewegung, Ernährung, Schlaf und mentale Gesundheit die Gesundheitsspanne (Healthspan) maximieren.', tags: ['Langlebigkeit', 'Gesundheit'] },
    { id: 'bk-37', title: 'Why We Sleep', subtitle: 'Autor: Matthew Walker', content: 'Die revolutionäre Bedeutung von Schlaf für Gedächtnis, Immunsystem, Fettverbrennung und emotionale Stabilität.', tags: ['Schlaf', 'Biohacking'] },
    { id: 'bk-38', title: 'The Oxygen Advantage', subtitle: 'Autor: Patrick McKeown', content: 'Wissenschaftliche Atemtechniken für maximale sportliche Ausdauer, Nasenatmung und optimierte Sauerstoffaufnahme.', tags: ['Atmung', 'Performance'] },
    { id: 'bk-39', title: 'Dopamine Nation', subtitle: 'Autor: Dr. Anna Lembke', content: 'Finden der Balance im Zeitalter des Überflusses. Das Schmerz-Lust-Pendel im Gehirn und Wege zur Dopamin-Regulierung.', tags: ['Gehirn', 'Sucht'] },
    { id: 'bk-40', title: 'Lifespan: Warum wir altern', subtitle: 'Autor: David A. Sinclair', content: 'Gegen das Altern ankämpfen: NAD+, Sirtuine, Fasten und biotechnologische Ansätze zur Verjüngung menschlicher Zellen.', tags: ['Biohacking', 'Science'] },
    { id: 'bk-41', title: 'Der Glukose-Trick', subtitle: 'Autor: Jessie Inchauspé', content: 'Wie Blutzuckerspitzen Heißhunger, Erschöpfung und Hautprobleme verursachen – und einfache Tricks zur Stabilisierung.', tags: ['Ernährung', 'Biohacking'] },
    { id: 'bk-42', title: 'Breath: Atem', subtitle: 'Autor: James Nestor', content: 'Eine faszinierende Reise in die verlorene Kunst des Atmens. Wie fehlerhafte Atmung die Gesundheit ruiniert und wie man sie heilt.', tags: ['Gesundheit', 'Atmung'] },
    { id: 'bk-43', title: 'Die Biologie der Überzeugung', subtitle: 'Autor: Dr. Bruce Lipton', content: 'Wie Gedanken, Epigenetik und Umweltfaktoren unsere Gene steuern und die Zellstruktur verändern können.', tags: ['Mindset', 'Epigenetik'] },
    { id: 'bk-44', title: 'The Comfort Crisis', subtitle: 'Autor: Michael Easter', content: 'Warum der moderne Komfort uns krank und schwach macht – und wie kontrollierte Wildnis, Kälte und Anstrengung den Geist heilen.', tags: ['Resilienz', 'Natur'] },
    { id: 'bk-45', title: 'The Brain that Changes Itself', subtitle: 'Autor: Norman Doidge', content: 'Neuroplastizität in Aktion: Faszination darüber, wie sich das Gehirn durch gezieltes Training ein Leben lang umstrukturieren kann.', tags: ['Neurowissenschaft', 'Gehirn'] },
    { id: 'bk-46', title: 'Starke Männer in schweren Zeiten', subtitle: 'Autor: Stefan Avey', content: 'Ein Aufruf zu Disziplin, familiärer Verantwortung, körperlicher Fitness und moralischer Integrität.', tags: ['Mindset', 'Charakter'] },
    { id: 'bk-47', title: 'Das Hindernis ist der Weg', subtitle: 'Autor: Ryan Holiday', content: 'Stoische Philosophie in der Praxis: Wie man Steine im Weg als Trittsteine für den persönlichen Aufstieg nutzt.', tags: ['Stoizismus', 'Resilienz'] },
    { id: 'bk-48', title: 'Stillness is the Key', subtitle: 'Autor: Ryan Holiday', content: 'Die Macht der inneren Stille: Wie Gelassenheit in einer lauten Welt zu überlegener Entscheidungsfindung führt.', tags: ['Fokus', 'Stille'] },
    { id: 'bk-49', title: 'The Daily Stoic', subtitle: 'Autor: Ryan Holiday', content: '366 stoische Meditationen über Weisheit, Mut, Gerechtigkeit und Mäßigung für jeden Tag des Jahres.', tags: ['Stoizismus', 'Routinen'] },
    { id: 'bk-50', title: 'Trotzdem Ja zum Leben sagen', subtitle: 'Autor: Viktor E. Frankl', content: 'Ein Psychologe erlebt das Konzentrationslager. Wer ein Warum zum Leben hat, erträgt fast jedes Wie.', tags: ['Sinn', 'Psychologie'] },
    { id: 'bk-51', title: 'The War of Art', subtitle: 'Autor: Steven Pressfield', content: 'Überwinde den inneren Widerstand (Resistance), schließe Frieden mit dem Schmerz und werde zum kompromisslosen Profi.', tags: ['Kreativität', 'Disziplin'] },
    { id: 'bk-52', title: 'Turning Pro', subtitle: 'Autor: Steven Pressfield', content: 'Der Schritt vom Amateur zum Profi. Verabschiede dich von Ausreden, Nebenschauplätzen und Drama – fordere Meisterschaft.', tags: ['Mindset', 'Meisterschaft'] },
    { id: 'bk-53', title: 'Mastery (Meisterschaft)', subtitle: 'Autor: Robert Greene', content: 'Der Pfad zur Exzellenz durch 10.000 Stunden fokussiertes Lernen, Mentorenschaft und intuitive meisterhafte Ausführung.', tags: ['Lernen', 'Erfolg'] },
    { id: 'bk-54', title: 'Die 48 Gesetze der Macht', subtitle: 'Autor: Robert Greene', content: 'Machtstrategien aus 3.000 Jahren Geschichte. Unentbehrlich, um Manipulationen zu durchschauen und eigene Positionen zu sichern.', tags: ['Macht', 'Strategie'] },
    { id: 'bk-55', title: 'Die 33 Gesetze der Strategie', subtitle: 'Autor: Robert Greene', content: 'Militärische & gesellschaftliche Strategieprinzipien zur Beseitigung von Chaos und zum Erreichen überlegener Zielpunkte.', tags: ['Strategie', 'Führung'] },
    { id: 'bk-56', title: 'Die Gesetze der menschlichen Natur', subtitle: 'Autor: Robert Greene', content: 'Tiefenanalyse menschlicher Verhaltensweisen, Neid, Narzissmus und emotionaler Muster zur Stärkung der eigenen Empathie.', tags: ['Psychologie', 'Menschenkenntnis'] },
    { id: 'bk-57', title: 'Die Kunst der Verführung', subtitle: 'Autor: Robert Greene', content: 'Psychologie der Anziehung, Charisma, soziale Dynamiken und die hohe Kunst der emotionalen Verbindung.', tags: ['Dynamiken', 'Psychologie'] },
    { id: 'bk-58', title: 'Die Kunst des klaren Denkens', subtitle: 'Autor: Rolf Dobelli', content: '52 Denkfehler, die man besser anderen überlässt: Bestätigungsfehler, Versunkene-Kosten-Falle und Social Proof.', tags: ['Denken', 'Klarheit'] },
    { id: 'bk-59', title: 'Die Kunst des klug Handelns', subtitle: 'Autor: Rolf Dobelli', content: 'Weitere 52 Denkfehler und Abkürzungen zur Vermeidung von Fehlentscheidungen im Alltag und Beruf.', tags: ['Klarheit', 'Strategie'] },
    { id: 'bk-60', title: 'Pre-Suasion', subtitle: 'Autor: Robert Cialdini', content: 'Die Kunst der Vorbereitung im Überzeugungsprozess: Wie der Moment VOR der Botschaft über die Zustimmung entscheidet.', tags: ['Psychologie', 'Marketing'] },
    { id: 'bk-61', title: 'Nudge: Wie man kluge Entscheidungen anstößt', subtitle: 'Autor: Richard Thaler', content: 'Verhaltensökonomie: Wie man Entscheidungsarchitekturen gestaltet, um Menschen sanft zu besseren Entscheiden zu bewegen.', tags: ['Ökonomie', 'Verhalten'] },
    { id: 'bk-62', title: 'Predictably Irrational', subtitle: 'Autor: Dan Ariely', content: 'Warum wir systematisch irrationale Entscheidungen treffen – bei Geld, Emotionen und täglichen Kaufakten.', tags: ['Psychologie', 'Verhalten'] },
    { id: 'bk-63', title: 'Blink: Die Macht des Momentan Augenblicks', subtitle: 'Autor: Malcolm Gladwell', content: 'Die Wissenschaft von Bauchentscheidungen und Erstindrücken – wann Dünnschicht-Denken brilliert und wann es täuscht.', tags: ['Intention', 'Intuition'] },
    { id: 'bk-64', title: 'Überflieger (Outliers)', subtitle: 'Autor: Malcolm Gladwell', content: 'Warum manche Menschen erfolgreich sind: Das Zusammenspiel von Kultur, Gelegenheiten, Timing und 10.000 Stunden Praxis.', tags: ['Erfolg', 'Soziologie'] },
    { id: 'bk-65', title: 'The Tipping Point', subtitle: 'Autor: Malcolm Gladwell', content: 'Wie kleine Dinge Großes bewirken können: Warum manche Ideen, Produkte oder Verhaltensweisen plötzlich wie Epidemien explodieren.', tags: ['Trends', 'Marketing'] },
    { id: 'bk-66', title: 'David und Goliath', subtitle: 'Autor: Malcolm Gladwell', content: 'Die Kunst, Unterlegenheiten in unschlagbare Vorteile zu verwandeln. Warum Außenseiter überraschend oft gewinnen.', tags: ['Resilienz', 'Strategie'] },
    { id: 'bk-67', title: 'Grit: Die Macht von Leidenschaft & Ausdauer', subtitle: 'Autor: Angela Duckworth', content: 'Warum nicht Talent, sondern eine Kombination aus Ausdauer und langfristiger Leidenschaft über echten Erfolg entscheidet.', tags: ['Ausdauer', 'Mindset'] },
    { id: 'bk-68', title: 'Flow: Das Geheimnis des Glücks', subtitle: 'Autor: Mihaly Csikszentmihalyi', content: 'Die optimale Erfahrung: Wie der Zustand tiefen Aufgehens in einer herausfordernden Aktivität Erfüllung schenkt.', tags: ['Flow', 'Glück'] },
    { id: 'bk-69', title: 'The Power of Habit', subtitle: 'Autor: Charles Duhigg', content: 'Die Neurobiologie von Gewohnheiten: Auslöser, Routine, Belohnung – und wie man jede Gewohnheit gezielt umprogrammiert.', tags: ['Gewohnheiten', 'Psychologie'] },
    { id: 'bk-70', title: 'Tiny Habits', subtitle: 'Autor: BJ Fogg', content: 'Verhaltensdesign der Stanford University: Warum winzige Routinen nach bestehenden Ankern den nachhaltigsten Erfolg bringen.', tags: ['Habits', 'Systeme'] },
    { id: 'bk-71', title: 'High Performance Habits', subtitle: 'Autor: Brendon Burchard', content: 'Sechs Gewohnheiten von Weltklasse-Performern: Klarheit, Energie, Notwendigkeit, Produktivität, Einfluss und Mut.', tags: ['Performance', 'Gewohnheiten'] },
    { id: 'bk-72', title: 'The Miracle Morning', subtitle: 'Autor: Hal Elrod', content: 'Die 6 Morgen-Routinen (SAVERS), die dein Leben verändern: Stille, Affirmationen, Visualisierung, Bewegung, Lesen, Schreiben.', tags: ['Morgenroutine', 'Erfolg'] },
    { id: 'bk-73', title: 'The 5 AM Club', subtitle: 'Autor: Robin Sharma', content: 'Stehe um 5 Uhr morgens auf und nutze die ungestörte "Victory Hour" (20/20/20 Formel) für Bewegung, Reflexion und Lernen.', tags: ['Produktivität', 'Morgen'] },
    { id: 'bk-74', title: 'Der Mönch, der seinen Ferrari verkaufte', subtitle: 'Autor: Robin Sharma', content: 'Eine inspirierende Fabel über die Befreiung von materiellem Stress, die Pflege des Geistes und das Entdecken der Lebensaufgabe.', tags: ['Sinn', 'Philosophie'] },
    { id: 'bk-75', title: 'Das Café am Rande der Welt', subtitle: 'Autor: John Strelecky', content: 'Eine Erzählung über den Zweck der Existenz (ZDE) und die Frage, warum wir tun, was wir täglich tun.', tags: ['Sinn', 'Inspiration'] },
    { id: 'bk-76', title: 'The Big Five for Life', subtitle: 'Autor: John Strelecky', content: 'Führung und Lebensplanung: Die 5 Dinge, die du im Leben sehen, tun oder erleben möchtest, um ein erfülltes Leben zu führen.', tags: ['Ziele', 'Führung'] },
    { id: 'bk-77', title: 'Die Gesetze der Gewinner', subtitle: 'Autor: Bodo Schäfer', content: '30 verlässliche Strategien für beruflichen und persönlichen Erfolg, Selbstdisziplin, Fokus und kontinuierliches Wachstum.', tags: ['Erfolg', 'Disziplin'] },
    { id: 'bk-78', title: 'Der Weg zur finanziellen Freiheit', subtitle: 'Autor: Bodo Schäfer', content: 'Geldnot beenden, Schulden abbauen, Vermögen aufbauen und innerhalb von 7 Jahren die erste Million erreichen.', tags: ['Finanzen', 'Vermögen'] },
    { id: 'bk-79', title: 'Money: Master the Game', subtitle: 'Autor: Tony Robbins', content: '7 Schritte zur finanziellen Unabhängigkeit, basierend auf Interviews mit 50 der weltbesten Finanzgenies (Ray Dalio, Warren Buffett).', tags: ['Finanzen', 'Investieren'] },
    { id: 'bk-80', title: 'Unshakeable (Unangreifbar)', subtitle: 'Autor: Tony Robbins', content: 'Finanzielle Sicherheit in Zeiten von Markt-Turbulenzen. Regelwerk für gelassenes Investieren ohne Panik.', tags: ['Börse', 'Finanzen'] },
    { id: 'bk-81', title: 'Das Robbins Power Prinzip', subtitle: 'Autor: Tony Robbins', content: 'Wie man emotionale Zustände augenblicklich verändert, Glaubenssätze neu verdrahtet und das persönliche Potenzial entfesselt.', tags: ['Psychologie', 'NLP'] },
    { id: 'bk-82', title: 'Die $100-Startup-Methode', subtitle: 'Autor: Chris Guillebeau', content: 'Wie Micro-Unternehmer mit minimalem Kapital aus Leidenschaften profitable Mikrobusinesses aufgebaut haben.', tags: ['Business', 'Startups'] },
    { id: 'bk-83', title: 'The Millionaire Fastlane', subtitle: 'Autor: MJ DeMarco', content: 'Zerstörung des "Slowlane"-Glaubens (40 Jahre arbeiten, sparen, Rente). Baue Skalierbarkeit, Systeme und echten Cashflow.', tags: ['Unternehmertum', 'Reichtum'] },
    { id: 'bk-84', title: 'Unscripted', subtitle: 'Autor: MJ DeMarco', content: 'Entkomme dem gesellschaftlichen Drehbuch aus Arbeit, Konsum und Schulden. Das CENTS-Framework für unternehmerische Freiheit.', tags: ['Freiheit', 'Business'] },
    { id: 'bk-85', title: 'The Great Rat Race Escape', subtitle: 'Autor: MJ DeMarco', content: 'Ein unterhaltsamer Roman mit harten Business-Lektionen über den Ausstieg aus der Angestelltenfalle hin zur Autonomie.', tags: ['Unternehmertum', 'Story'] },
    { id: 'bk-86', title: 'Oversubscribed', subtitle: 'Autor: Daniel Priestley', content: 'Wie man mehr Nachfrage erzeugt als Angebot existiert. Das Prinzip exklusiver Marken und begehrter Dienstleistungen.', tags: ['Marketing', 'Branding'] },
    { id: 'bk-87', title: 'Key Person of Influence', subtitle: 'Autor: Daniel Priestley', content: 'Werde zum gefragten Branchen-Experten durch Pitching, Publishing, Products, Profile und Partnerships.', tags: ['Branding', 'Positionierung'] },
    { id: 'bk-88', title: '24 Assets', subtitle: 'Autor: Daniel Priestley', content: 'Baue ein Unternehmen, das auch ohne dich wertvoll ist. Erschaffe 24 digitale, geistige und operative Vermögenswerte.', tags: ['Business', 'Systeme'] },
    { id: 'bk-89', title: '$100M Offers', subtitle: 'Autor: Alex Hormozi', content: 'Wie man Angebote erstellt, die so gut sind, dass sich Menschen dumm fühlen würden, Nein zu sagen. Wert-Gleichung pur.', tags: ['Sales', 'Angebote'] },
    { id: 'bk-90', title: '$100M Leads', subtitle: 'Autor: Alex Hormozi', content: 'Praktischer Leitfaden zur kontinuierlichen Generierung tausender qualifizierter Leads über 8 Akquise-Kanäle.', tags: ['Marketing', 'Leads'] },
    { id: 'bk-91', title: 'Dotcom Secrets', subtitle: 'Autor: Russell Brunson', content: 'Das Untergrund-Handbuch für Sales Funnels, Hook-Story-Offer und die Skalierung von Online-Unternehmen.', tags: ['Online Business', 'Funnels'] },
    { id: 'bk-92', title: 'Expert Secrets', subtitle: 'Autor: Russell Brunson', content: 'Wie du dein Wissen in eine Massenbewegung verwandelst und Menschen durch Geschichten zum Kaufen inspirierst.', tags: ['Storytelling', 'Sales'] },
    { id: 'bk-93', title: 'Traffic Secrets', subtitle: 'Autor: Russell Brunson', content: 'Wie du deine Traumkunden zu deinen Websites und Funnels lenkst – organisch, bezahlt und über Traum-100-Partner.', tags: ['Traffic', 'Marketing'] },
    { id: 'bk-94', title: 'Contagious: Warum sich Ideen durchsetzen', subtitle: 'Autor: Jonah Berger', content: 'Die STEPPS-Formel für virale Inhalte: Social Proof, Triggers, Emotion, Public, Practical Value & Stories.', tags: ['Viralität', 'Marketing'] },
    { id: 'bk-95', title: 'Building a StoryBrand', subtitle: 'Autor: Donald Miller', content: 'Mache den Kunden zum Helden der Story und deine Firma zum weisen Mentor. Verklare deine Marketingbotschaft krisenfest.', tags: ['Branding', 'Messaging'] },
    { id: 'bk-96', title: 'Marketing Made Simple', subtitle: 'Autor: Donald Miller', content: 'Schritt-für-Schritt-Anleitung zur Erstellung eines funktionierenden Sales Funnels: One-Liner, Website, Lead-Magnet & E-Mails.', tags: ['Marketing', 'Execution'] },
    { id: 'bk-97', title: 'Copywriting Secrets', subtitle: 'Autor: Jim Edwards', content: 'Formeln und Vorlagen für verkaufsstarke Texte, Schlagzeilen, E-Mails und Verkaufsseiten, die Umsätze vervielfachen.', tags: ['Copywriting', 'Sales'] },
    { id: 'bk-98', title: 'The Boron Letters', subtitle: 'Autor: Gary C. Halbert', content: 'Legendäre Briefe eines Meister-Copywriters an seinen Sohn über Psychologie, Verkaufstexte, Fitness und Leben.', tags: ['Copywriting', 'Verkauf'] },
    { id: 'bk-99', title: 'Scientific Advertising', subtitle: 'Autor: Claude C. Hopkins', content: 'Das Ur-Werk der messbaren Werbung: Testen, Zahlen analysieren und Werbetexte als Verkäufer in gedruckter Form verstehen.', tags: ['Werbung', 'Klassiker'] },
    { id: 'bk-100', title: 'Cashvertising', subtitle: 'Autor: Drew Eric Whitman', content: '100 Geheimnisse der Werbepsychologie: Wie man die 8 biologischen Grundbedürfnisse (Life-Force 8) im Verkauf nutzt.', tags: ['Psychologie', 'Werbung'] },
    { id: 'bk-101', title: 'Hooked: Wie Produkte süchtig machen', subtitle: 'Autor: Nir Eyal', content: 'Das Hook-Modell für Produktentwickler: Auslöser, Aktion, variable Belohnung und Investment zur Schaffung von Nutzergewohnheiten.', tags: ['Produkt', 'UX'] },
    { id: 'bk-102', title: 'Indistractable', subtitle: 'Autor: Nir Eyal', content: 'Wie man im Zeitalter digitaler Ablenkung die Kontrolle behält: Interne Auslöser meistern und Zeit für Wichtiges sichern.', tags: ['Fokus', 'Produktivität'] },
    { id: 'bk-103', title: 'Digitaler Minimalismus', subtitle: 'Autor: Cal Newport', content: 'Eine Philosophie der Technologie-Nutzung: Reduziere Bildschirmzeit radikal auf Werkzeuge, die deinen Werten dienen.', tags: ['Minimalismus', 'Fokus'] },
    { id: 'bk-104', title: 'So Good They Can’t Ignore You', subtitle: 'Autor: Cal Newport', content: 'Warum "Folge deiner Leidenschaft" ein schlechter Rat ist. Baue stattdessen rares, wertvolles "Career Capital" auf.', tags: ['Karriere', 'Skilling'] },
    { id: 'bk-105', title: 'Slow Productivity', subtitle: 'Autor: Cal Newport', content: 'Verabschiede dich von Hektik und Pseudoproduktivität. Tue weniger Dinge, arbeite in natürlichem Tempo und setze auf Qualität.', tags: ['Produktivität', 'Fokus'] },
    { id: 'bk-106', title: 'Smarter Faster Better', subtitle: 'Autor: Charles Duhigg', content: 'Die Wissenschaft der Produktivität: Motivation, Zielsetzung, Teamdynamiken und agile Entscheidungsfindung in Unternehmen.', tags: ['Produktivität', 'Teams'] },
    { id: 'bk-107', title: 'The ONE Thing', subtitle: 'Autor: Gary Keller & Jay Papasan', content: 'Welche EINE Sache kannst du tun, sodass durch sie alles andere einfacher oder überflüssig wird? Fokus in Perfektion.', tags: ['Fokus', 'Prioritäten'] },
    { id: 'bk-108', title: 'Der 80/20-Erfolgscode (Pareto)', subtitle: 'Autor: Richard Koch', content: 'Das Pareto-Prinzip: Wie 20% des Aufwands 80% der Ergebnisse erzeugen – in Business, Finanzen und Lebensglück.', tags: ['Effizienz', 'Pareto'] },
    { id: 'bk-109', title: 'Getting Things Done (GTD)', subtitle: 'Autor: David Allen', content: 'Die Kunst der stressfreien Produktivität. Erfasse alles extern, kläre nächste Schritte und halte deinen Kopf frei von Ballast.', tags: ['Zeitmanagement', 'GTD'] },
    { id: 'bk-110', title: 'Building a Second Brain', subtitle: 'Autor: Tiago Forte', content: 'Ein erprobtes System zur digitalen Wissensorganisation (CODE-Methode), um Ideen, Notizen und Projekte mühelos zu verwalten.', tags: ['Wissen', 'Produktivität'] },
    { id: 'bk-111', title: 'How to Take Smart Notes (Zettelkasten)', subtitle: 'Autor: Sönke Ahrens', content: 'Die Zettelkasten-Methode nach Niklas Luhmann. Wie man durch verknüpfte Notizen tiefes Verständnis und Texte mühelos erschafft.', tags: ['Lernen', 'Notizen'] },
    { id: 'bk-112', title: 'The Checklist Manifesto', subtitle: 'Autor: Atul Gawande', content: 'Wie simple Checklisten in Medizin, Luftfahrt und Bauwesen katastrophale Fehler verhindern und Komplexität beherrschen.', tags: ['Prozesse', 'Qualität'] },
    { id: 'bk-113', title: 'Good to Great', subtitle: 'Autor: Jim Collins', content: 'Warum manche Unternehmen den Sprung zu dauerhafter Exzellenz schaffen und andere nicht. Das Schwungrad-Prinzip.', tags: ['Unternehmertum', 'Exzellenz'] },
    { id: 'bk-114', title: 'Built to Last', subtitle: 'Autor: Jim Collins', content: 'Erfolgsgewohnheiten visionärer Unternehmen, die Jahrzehnte und Wirtschaftskrisen überdauern.', tags: ['Strategie', 'Führung'] },
    { id: 'bk-115', title: 'Great by Choice', subtitle: 'Autor: Jim Collins', content: 'Warum manche Firmen in extremer Unsicherheit und Chaos florieren: 20-Meilen-Marsch, erst Kugeln dann Kanonenkugeln.', tags: ['Krisen', 'Führung'] },
    { id: 'bk-116', title: 'Measure What Matters', subtitle: 'Autor: John Doerr', content: 'Wie Google, Bono und die Gates-Stiftung die Welt mit OKRs (Objectives and Key Results) verändert haben.', tags: ['OKRs', 'Ziele'] },
    { id: 'bk-117', title: 'Radical Candor', subtitle: 'Autor: Kim Scott', content: 'Führung mit persönlicher Fürsorge und direkter Herausforderung. Wie man ehrliches Feedback gibt, ohne grausam zu sein.', tags: ['Führung', 'Feedback'] },
    { id: 'bk-118', title: 'Start with Why', subtitle: 'Autor: Simon Sinek', content: 'Wie große Führungspersönlichkeiten zum Handeln inspirieren. Der Golden Circle: Warum, Wie, Was.', tags: ['Inspiration', 'Führung'] },
    { id: 'bk-119', title: 'Leaders Eat Last', subtitle: 'Autor: Simon Sinek', content: 'Warum manche Teams zusammenhalten und andere nicht. Der Schutzkreis (Circle of Safety) und biologische Führungshormone.', tags: ['Führung', 'Teams'] },
    { id: 'bk-120', title: 'Das unendliche Spiel', subtitle: 'Autor: Simon Sinek', content: 'Geschäft ist kein endliches Spiel mit Gewinnern. Wer unendlich denkt, baut überdauernde Institutionen auf.', tags: ['Strategie', 'Vision'] },
    { id: 'bk-121', title: 'Tribal Leadership', subtitle: 'Autor: Dave Logan', content: 'Die 5 Kulturstufen von Arbeitsgruppen und wie man Teams von "Das Leben stinkt" zu "Wir sind fantastisch" führt.', tags: ['Kultur', 'Führung'] },
    { id: 'bk-122', title: 'Drive: Was uns wirklich motiviert', subtitle: 'Autor: Daniel H. Pink', content: 'Die überraschende Wahrheit hinter Motivation: Autonomie, Meisterschaft und Zweckmäßigkeit schlagen Belohnung/Bestrafung.', tags: ['Motivation', 'Psychologie'] },
    { id: 'bk-123', title: 'To Sell Is Human', subtitle: 'Autor: Daniel H. Pink', content: 'Wir alle sind im Verkauf, wenn wir Ideen bewegen. Neue Perspektiven für Überzeugung ohne veraltete Verkaufstricks.', tags: ['Sales', 'Persuasion'] },
    { id: 'bk-124', title: 'When: Die Wissenschaft des perfekten Timings', subtitle: 'Autor: Daniel H. Pink', content: 'Wie wissenschaftliche Rhythmen den perfekten Zeitpunkt für Entscheidungen, Pausen und Neuanfänge bestimmen.', tags: ['Timing', 'Produktivität'] },
    { id: 'bk-125', title: 'Still: Die Kraft der Leisen', subtitle: 'Autor: Susan Cain', content: 'Warum Introvertierte in einer Welt, die nicht aufhört zu reden, unersetzliche Stärken und Führungspotenziale besitzen.', tags: ['Introvertiert', 'Psychologie'] },
    { id: 'bk-126', title: 'Emotionale Intelligenz', subtitle: 'Autor: Daniel Goleman', content: 'Warum der EQ oft wichtiger ist als der IQ für beruflichen und persönlichen Erfolg. Selbstwahrnehmung und Empathie.', tags: ['EQ', 'Psychologie'] },
    { id: 'bk-127', title: 'Soziale Intelligenz', subtitle: 'Autor: Daniel Goleman', content: 'Neue Erkenntnisse der Gehirnforschung über die fundamentale Natur menschlicher Beziehungen und Bindung.', tags: ['Beziehungen', 'Soziales'] },
    { id: 'bk-128', title: 'Gewaltfreie Kommunikation', subtitle: 'Autor: Marshall B. Rosenberg', content: 'Eine Sprache des Lebens: Beobachtung, Gefühl, Bedürfnis und Bitte zur konfliktfreien Klärung schwerer Situationen.', tags: ['Kommunikation', 'Empathie'] },
    { id: 'bk-129', title: 'Schwierige Gespräche führen', subtitle: 'Autor: Douglas Stone', content: 'Das Havard-Verhandlungsprojekt: Wie man heikle Themen anspricht, Gefühle sortiert und Lösungen erzielt.', tags: ['Kommunikation', 'Konflikte'] },
    { id: 'bk-130', title: 'Crucial Conversations', subtitle: 'Autor: Kerry Patterson', content: 'Werkzeuge für Gespräche mit hohem Einsatz, starken Emotionen und gegensätzlichen Meinungen.', tags: ['Kommunikation', 'Verhandlung'] },
    { id: 'bk-131', title: 'Antifragil', subtitle: 'Autor: Nassim Nicholas Taleb', content: 'Dinge, die von Unordnung profitieren. Wie man Systeme baut, die durch Schocks und Ungewissheit nicht brechen, sondern stärker werden.', tags: ['Resilienz', 'Systeme'] },
    { id: 'bk-132', title: 'Der Schwarze Schwan', subtitle: 'Autor: Nassim Nicholas Taleb', content: 'Die Macht hochgradig unwahrscheinlicher Ereignisse und unsere fundamentale Blindheit gegenüber extremen Zufällen.', tags: ['Risiko', 'Philosophie'] },
    { id: 'bk-133', title: 'Narren des Zufalls', subtitle: 'Autor: Nassim Nicholas Taleb', content: 'Die unterschätzte Rolle des Zufalls in den Märkten und im Leben. Verwechsle Glück niemals mit Können.', tags: ['Zufall', 'Börse'] },
    { id: 'bk-134', title: 'Skin in the Game', subtitle: 'Autor: Nassim Nicholas Taleb', content: 'Wer Risiko trägt, muss auch die Konsequenzen spüren. Die Symmetrie von Risiko und Verantwortung in der Gesellschaft.', tags: ['Ethik', 'Risiko'] },
    { id: 'bk-135', title: 'So denken Millionäre', subtitle: 'Autor: Thomas J. Stanley', content: 'Überraschende Geheimnisse amerikanischer Wohlhabender: Mäßiger Konsum, Sparsamkeit und solide Investitionen.', tags: ['Finanzen', 'Wealth'] },
    { id: 'bk-136', title: 'Intelligent Investieren', subtitle: 'Autor: Benjamin Graham', content: 'Das Standardwerk des Value Investings. Sicherheitsmarge (Margin of Safety) und emotionale Disziplin an der Börse.', tags: ['Börse', 'Value Investing'] },
    { id: 'bk-137', title: 'Der Börse einen Schritt voraus', subtitle: 'Autor: Peter Lynch', content: 'Wie Privatanleger durch Alltagsbeobachtungen herausragende Aktien vor Wall-Street-Analysten entdecken können.', tags: ['Aktien', 'Investieren'] },
    { id: 'bk-138', title: 'Common Stocks and Uncommon Profits', subtitle: 'Autor: Philip Fisher', content: 'Qualitative Aktienanalyse: Suche nach wachstumsstarken Unternehmen mit herausragendem Management und Wettbewerbsvorteilen.', tags: ['Aktien', 'Wachstum'] },
    { id: 'bk-139', title: 'The Most Important Thing', subtitle: 'Autor: Howard Marks', content: 'Memosperspektiven von Oaktree Capital: Zweitrangiges Denken, Marktzyklenerkennung und Risikomanagement.', tags: ['Investieren', 'Börse'] },
    { id: 'bk-140', title: 'Mastering the Market Cycle', subtitle: 'Autor: Howard Marks', content: 'Wie Pendelbewegungen an den Finanzmärkten entstehen und wie man Marktphasen für überlegenes Handeln nutzt.', tags: ['Zyklus', 'Finanzen'] },
    { id: 'bk-141', title: 'Poor Charlie’s Almanack', subtitle: 'Autor: Charlie Munger', content: 'Die Weisheit von Warren Buffetts Partner: Mentale Modelle aus Physik, Biologie und Psychologie für bessere Entscheidungen.', tags: ['Denken', 'Weisheit'] },
    { id: 'bk-142', title: 'The Personal MBA', subtitle: 'Autor: Josh Kaufman', content: 'Das essenzielle Business-Wissen ohne teures Studium: Wertschöpfung, Marketing, Verkauf, Finanzen und Systeme.', tags: ['Business', 'MBA'] },
    { id: 'bk-143', title: 'Wie man Freunde gewinnt', subtitle: 'Autor: Dale Carnegie', content: 'Der Klassiker der Beziehungsgestaltung: Ehrliches Interesse, Lächeln, Zuhören und Wertschätzung schenken.', tags: ['Soziales', 'Kommunikation'] },
    { id: 'bk-144', title: 'Sorge dich nicht – lebe!', subtitle: 'Autor: Dale Carnegie', content: 'Erprobte Methoden zur Beseitigung von Sorgen, Ängsten und Zukunftsstress für ein friedvolles Dasein.', tags: ['Mindset', 'Sorgenfrei'] },
    { id: 'bk-145', title: 'The Art of Learning', subtitle: 'Autor: Josh Waitzkin', content: 'Schachweltmeister und Tai-Chi-Weltmeister verrät sein System zur schnellen und tiefen Meisterschaft in jeder Disziplin.', tags: ['Lernen', 'Fokus'] },
    { id: 'bk-146', title: 'The Power of Full Engagement', subtitle: 'Autor: Jim Loehr & Tony Schwartz', content: 'Energiemanagement statt Zeitmanagement. Die 4 Energiequellen (körperlich, emotional, mental, spirituell).', tags: ['Energie', 'Performance'] },
    { id: 'bk-147', title: 'The Effective Executive', subtitle: 'Autor: Peter F. Drucker', content: 'Führungseffektivität kann gelernt werden: Zeitsteuerung, Beitrag zum Ganzen, Stärken nutzen und Prioritäten setzen.', tags: ['Führung', 'Management'] },
    { id: 'bk-148', title: 'Die Formel für Glück', subtitle: 'Autor: Stefan Klein', content: 'Wie gute Gefühle im Gehirn entstehen und wie wir unser Belohnungssystem positiv beeinflussen können.', tags: ['Glück', 'Science'] },
    { id: 'bk-149', title: 'Der Mensch auf der Suche nach Sinn', subtitle: 'Autor: Viktor E. Frankl', content: 'Die Entdeckung der Logotherapie: Welchen unerschütterlichen Sinn wir in jedem Leid und jeder Aufgabe finden können.', tags: ['Sinn', 'Resilienz'] },
    { id: 'bk-150', title: 'Radikale Akzeptanz', subtitle: 'Autor: Tara Brach', content: 'Dich selbst mit Mitgefühl umarmen. Befreiung aus den Klauen von Minderwertigkeitsgefühlen und Selbstkritik.', tags: ['Achtsamkeit', 'Mindset'] },
  ],

  biohacking: [
    { id: 'bio-1', title: 'Morgen-Licht & Cortisol-Peak', subtitle: 'Neurologische Aktivierung', content: 'Innerhalb von 30 Minuten nach dem Aufstehen für 10-15 Minuten in natürliches Sonnenlicht blicken. Setzt die zirkadiane Uhr zurück und steigert den Fokus um 200%.', tags: ['Schlaf', 'Energie'] },
    { id: 'bio-2', title: '90-Minuten Koffein-Verzögerung', subtitle: 'Vermeidung des Nachmittags-Tiefs', content: 'Trinke Kaffee erst 90-120 Minuten nach dem Aufwachen. Dadurch baut der Körper verbliebenes Adenosin natürlich ab und es entsteht kein Crash.', tags: ['Fokus', 'Dopamin'] },
    { id: 'bio-3', title: 'Kälte-Exposition & Dopamin-Boost', subtitle: '2-3 Minuten kaltes Duschen', content: 'Kaltes Wasser setzt Norepinephrin und Dopamin frei, die für bis zu 4 Stunden um 250% ansteigen. Stärkt das Immunsystem und die Vagus-Nerv-Symmetrie.', tags: ['Immunsystem', 'Dopamin'] },
    { id: 'bio-4', title: 'NSDR (Non-Sleep Deep Rest) Protocol', subtitle: 'Neurologische Regeneration in 10-20 Minuten', content: 'Gezielte geführte Entspannung (Yoga Nidra) baut mentale Erschöpfung ab, beschleunigt das Lernen und stellt Dopamin-Reserven im Gehirn wieder her.', tags: ['Erholung', 'Gehirn'] },
    { id: 'bio-5', title: 'Zonen-2 Cardio für Mitochondrien', subtitle: 'Basis für zelluläre Langlebigkeit', content: '150 Minuten pro Woche bei moderater Intensität (Nasenatmung noch möglich). Erhöht die Anzahl und Effizienz deiner Mitochondrien drastisch.', tags: ['Ausdauer', 'Mitochondrien'] },
    { id: 'bio-6', title: 'Digitales Fasten & Blaulicht-Blocking', subtitle: 'Melatonin-Synthese sichern', content: '2 Stunden vor dem Schlafen keine Bildschirme mehr oder blaulichtfilternde Brillen tragen. Sichert tiefe REM- und Tiefschlafphasen.', tags: ['Schlaf', 'Recovery'] },
    { id: 'bio-7', title: 'Creatin Monohydrat für Gehirn & Muskeln', subtitle: 'Nootropische & ATP Leistungssteigerung', content: 'Täglich 5g Creatin erhöhen nicht nur die Muskelkraft, sondern verbessern die kognitive Verarbeitungsgeschwindigkeit bei Schlafmangel spürbar.', tags: ['Supplements', 'Gehirn'] },
    { id: 'bio-8', title: 'Physiologischer Seufzer (Physiological Sigh)', subtitle: 'Sofortige Stress-Eliminierung in 10 Sekunden', content: 'Zwei schnelle Einatmungen durch die Nase, gefolgt von einer langen Ausatmung durch den Mund. Reaktiviert augenblicklich das parasympathische Nervensystem.', tags: ['Stress', 'Atmung'] },
  ],

  stoic_rules: [
    { id: 'st-1', title: 'Amor Fati (Liebe dein Schicksal)', subtitle: 'Mache jedes Hindernis zu Treibstoff', content: 'Was auch immer geschieht, betrachte es nicht als Beschwernis, sondern als perfektes Trainingsmaterial für deinen Charakter.', tags: ['Stoa', 'Gleichmut'] },
    { id: 'st-2', title: 'Dichotomie der Kontrolle', subtitle: 'Fokussiere nur das, was du beeinflussen kannst', content: 'Dinge teilen sich in zwei Kategorien: Was in deiner Macht steht (deine Gedanken, Reaktionen, Taten) und was nicht (Meinungen anderer, Wetter, Markt).', tags: ['Klarheit', 'Stoizismus'] },
    { id: 'st-3', title: 'Premeditatio Malorum', subtitle: 'Gedankliche Vorwegnahme des Übels', content: 'Stelle dir mögliche Hindernisse im Voraus vor. Wenn das Schlimmste eintreffen sollte, bist du mental vorbereitet und bleibst absolut unerschütterlich.', tags: ['Resilienz', 'Vorbereitung'] },
    { id: 'st-4', title: 'Memento Mori', subtitle: 'Erinnere dich an deine Sterblichkeit', content: 'Das Leben ist endlich. Vergolde deine Zeit nicht mit Belanglosigkeiten, Zweifeln oder unnötigem Warten. Handle jetzt mit voller Entschlossenheit.', tags: ['Fokus', 'Dringlichkeit'] },
    { id: 'st-5', title: 'Urteilsfreie Betrachtung', subtitle: 'Ereignisse sind neutral – deine Meinung färbt sie', content: 'Nicht die Dinge an sich beunruhigen den Menschen, sondern die Vorstellungen und Urteile, die er sich von den Dingen macht. Kontrolliere dein Urteil.', tags: ['Gedanken', 'Ruhe'] },
    { id: 'st-6', title: 'Die innere Festung', subtitle: 'Unabhängigkeit von äußeren Umständen', content: 'Egal wie stürmisch die Umwelt ist: In deinem Geist besitzt du einen Zufluchtsort. Niemand kann dir deine innere Freiheit ohne deine Zustimmung nehmen.', tags: ['Autonomie', 'Stärke'] },
    { id: 'st-7', title: 'Prüfung der Eindrücke', subtitle: 'Reagiere nicht sofort impulsiv', content: 'Sage zu jedem störenden Eindruck: "Du bist nur eine Vorstellung und nicht die Realität selbst." Gib deinem Geist Bedenkzeit.', tags: ['Beherrschung', 'Gedanken'] },
    { id: 'st-8', title: 'Die Vogelperspektive (View from Above)', subtitle: 'Kleine Sorgen relativieren', content: 'Zoome gedanklich heraus: Sieht dein Problem von oben aus dem Weltall noch immer riesig aus? Erlange die richtige Proportion der Dinge.', tags: ['Perspektive', 'Ruhe'] },
  ],
};

/**
 * Returns a batch of unique items for a module that avoids items in seenIds.
 * Guarantees that NO item repeats until ALL items in the database pool
 * have been shown once. Once all items are seen, it cleanly resets history.
 */
export function getFreshModuleItems(
  moduleId: string,
  seenIds: string[] = [],
  count: number = 3
): { items: ModuleContentItem[]; updatedSeenIds: string[] } {
  const pool = EXTRA_MODULES_CONTENT[moduleId] || [];
  if (pool.length === 0) {
    return { items: [], updatedSeenIds: seenIds };
  }

  // Filter out items that have already been seen in the current cycle
  let available = pool.filter((item) => !seenIds.includes(item.id));
  let currentSeenHistory = [...seenIds];

  // If the available pool has fewer items than requested, we have completed a full cycle!
  // Cleanly reset history so all items are eligible again for the next cycle without duplicates in this batch.
  if (available.length < count) {
    available = [...pool];
    currentSeenHistory = [];
  }

  // Pick 'count' unique items randomly from the available pool
  const chosen: ModuleContentItem[] = [];
  const tempPool = [...available];

  for (let i = 0; i < count && tempPool.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * tempPool.length);
    chosen.push(tempPool[randomIndex]);
    tempPool.splice(randomIndex, 1);
  }

  const chosenIds = chosen.map((c) => c.id);
  const updatedSeenIds = Array.from(new Set([...currentSeenHistory, ...chosenIds]));

  return {
    items: chosen,
    updatedSeenIds,
  };
}
