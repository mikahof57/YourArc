import { Quote } from '../types';

export const QUOTES_DATABASE: Quote[] = [
  // Filme
  {
    id: 'f-1',
    text: 'Es kommt nicht darauf an, wie hart du zuschlagen kannst. Es kommt darauf an, wie viel du einstecken kannst und trotzdem weitermachst.',
    textEn: "It ain't about how hard you hit. It's about how hard you can get hit and keep moving forward.",
    author: 'Rocky Balboa (Rocky)',
    authorEn: 'Rocky Balboa (Rocky)',
    category: 'filme',
  },
  {
    id: 'f-2',
    text: 'Entweder man lebt, oder man stirbt. Tu was dafür, um zu leben.',
    textEn: 'Get busy living, or get busy dying.',
    author: 'Andy Dufresne (Die Verurteilten)',
    authorEn: 'Andy Dufresne (The Shawshank Redemption)',
    category: 'filme',
  },
  {
    id: 'f-3',
    text: 'Lass dir von niemandem einreden, dass du etwas nicht kannst. Wenn du einen Traum hast, musst du ihn beschützen.',
    textEn: "Don't ever let somebody tell you you can't do something. You got a dream, you gotta protect it.",
    author: 'Chris Gardner (Das Streben nach Glück)',
    authorEn: 'Chris Gardner (The Pursuit of Happyness)',
    category: 'filme',
  },
  {
    id: 'f-4',
    text: 'Warum fallen wir? Damit wir lernen können, uns wieder aufzurichten.',
    textEn: 'Why do we fall? So that we can learn to pick ourselves back up.',
    author: 'Alfred Pennyworth (Batman Begins)',
    authorEn: 'Alfred Pennyworth (Batman Begins)',
    category: 'filme',
  },

  // Anime
  {
    id: 'a-1',
    text: 'Wenn du dich nicht veränderst, wirst du auch morgen noch schwach sein. Steh auf und kämpfe!',
    textEn: "If you don't change, you will still be weak tomorrow. Arise and fight!",
    author: 'Sung Jin-Woo (Solo Leveling)',
    authorEn: 'Sung Jin-Woo (Solo Leveling)',
    category: 'anime',
  },
  {
    id: 'a-2',
    text: 'Harte Arbeit schlägt Talent, wenn Talent nicht hart arbeitet.',
    textEn: 'Hard work beats talent when talent fails to work hard.',
    author: 'Rock Lee (Naruto)',
    authorEn: 'Rock Lee (Naruto)',
    category: 'anime',
  },
  {
    id: 'a-3',
    text: 'Wer nicht bereit ist, alles zu opfern, wird niemals etwas verändern können.',
    textEn: 'A person who cannot sacrifice anything can never change anything.',
    author: 'Armin Arlert (Attack on Titan)',
    authorEn: 'Armin Arlert (Attack on Titan)',
    category: 'anime',
  },
  {
    id: 'a-4',
    text: 'In dieser Welt gewinnen nur diejenigen, die sich weigern aufzugeben.',
    textEn: 'In this world, only those who refuse to give up survive.',
    author: 'Guts (Berserk)',
    authorEn: 'Guts (Berserk)',
    category: 'anime',
  },

  // Spiele (Gaming)
  {
    id: 's-1',
    text: 'A man chooses, a slave obeys.',
    textEn: 'A man chooses, a slave obeys.',
    author: 'Andrew Ryan (BioShock)',
    authorEn: 'Andrew Ryan (BioShock)',
    category: 'spiele',
  },
  {
    id: 's-2',
    text: 'Rache ist ein Spiel für Narren. Aber Disziplin formt den Krieger.',
    textEn: 'Revenge is a fool\'s game. But discipline shapes the warrior.',
    author: 'Kratos (God of War)',
    authorEn: 'Kratos (God of War)',
    category: 'spiele',
  },
  {
    id: 's-3',
    text: 'Die Welt belohnt nicht die Absicht, sondern nur das Handeln.',
    textEn: 'The world rewards action, not intention.',
    author: 'Geralt von Riva (The Witcher 3)',
    authorEn: 'Geralt of Rivia (The Witcher 3)',
    category: 'spiele',
  },

  // Philosophie
  {
    id: 'p-1',
    text: 'Du hast Macht über deinen Verstand – nicht über äußere Ereignisse. Erkenne dies, und du wirst Stärke finden.',
    textEn: 'You have power over your mind - not outside events. Realize this, and you will find strength.',
    author: 'Marc Aurel (Selbstbetrachtungen)',
    authorEn: 'Marcus Aurelius (Meditations)',
    category: 'philosophie',
  },
  {
    id: 'p-2',
    text: 'Kein Mensch ist frei, der nicht sein eigener Herr ist.',
    textEn: 'No man is free who is not master of himself.',
    author: 'Epiktet',
    authorEn: 'Epictetus',
    category: 'philosophie',
  },
  {
    id: 'p-3',
    text: 'Wer ein Warum zum Leben hat, erträgt fast jedes Wie.',
    textEn: 'He who has a why to live can bear almost any how.',
    author: 'Friedrich Nietzsche',
    authorEn: 'Friedrich Nietzsche',
    category: 'philosophie',
  },
  {
    id: 'p-4',
    text: 'Man kann einen Menschen nichts lehren, man kann ihm nur helfen, es in sich selbst zu entdecken.',
    textEn: 'You cannot teach a man anything; you can only help him find it within himself.',
    author: 'Galileo Galilei',
    authorEn: 'Galileo Galilei',
    category: 'philosophie',
  },

  // Religion - Christentum
  {
    id: 'r-c-1',
    text: 'Gott hat uns nicht einen Geist der Furcht gegeben, sondern der Kraft, der Liebe und der Besonnenheit.',
    textEn: 'For God has not given us a spirit of fear, but of power and of love and of a sound mind.',
    author: '2. Timotheus 1,7',
    authorEn: '2 Timothy 1:7',
    category: 'religion',
    subCategory: 'christentum',
    subCategoryEn: 'Christianity',
  },
  {
    id: 'r-c-2',
    text: 'Ich vermag alles durch den, der mich mächtig macht.',
    textEn: 'I can do all things through Christ who strengthens me.',
    author: 'Philipper 4,13',
    authorEn: 'Philippians 4:13',
    category: 'religion',
    subCategory: 'christentum',
    subCategoryEn: 'Christianity',
  },

  // Religion - Islam
  {
    id: 'r-i-1',
    text: 'Wahrlich, mit der Erschwernis kommt die Erleichterung.',
    textEn: 'Indeed, with hardship comes ease.',
    author: 'Koran (Sure 94:6)',
    authorEn: 'Quran (Surah 94:6)',
    category: 'religion',
    subCategory: 'islam',
    subCategoryEn: 'Islam',
  },
  {
    id: 'r-i-2',
    text: 'Der Starke ist nicht derjenige, der im Ringen gewinnt, sondern derjenige, der sich in der Wut beherrscht.',
    textEn: 'The strong man is not the good wrestler; the strong man is only the one who controls himself when angry.',
    author: 'Hadith (Sahih al-Bukhari)',
    authorEn: 'Hadith (Sahih al-Bukhari)',
    category: 'religion',
    subCategory: 'islam',
    subCategoryEn: 'Islam',
  },

  // Religion - Judentum
  {
    id: 'r-j-1',
    text: 'Wenn nicht ich für mich bin, wer ist für mich? Und wenn ich nur für mich bin, was bin ich?',
    textEn: 'If I am not for myself, who will be for me? And if I am only for myself, what am I?',
    author: 'Pirkei Avot 1:14 (Hillel)',
    authorEn: 'Pirkei Avot 1:14 (Hillel)',
    category: 'religion',
    subCategory: 'judentum',
    subCategoryEn: 'Judaism',
  },

  // Religion - Buddhismus
  {
    id: 'r-b-1',
    text: 'Niemand rettet uns, außer wir selbst. Niemand kann und niemand darf es. Wir selbst müssen den Weg gehen.',
    textEn: 'No one saves us but ourselves. No one can and no one may. We ourselves must walk the path.',
    author: 'Gautama Buddha',
    authorEn: 'Gautama Buddha',
    category: 'religion',
    subCategory: 'buddhismus',
    subCategoryEn: 'Buddhism',
  },

  // Religion - Hinduismus
  {
    id: 'r-h-1',
    text: 'Du hast das Recht zu arbeiten, aber niemals auf die Früchte der Arbeit. Lass die Arbeit nicht durch Belohnung getrieben sein.',
    textEn: 'You have a right to perform your prescribed duty, but you are not entitled to the fruits of action.',
    author: 'Bhagavad Gita (2.47)',
    authorEn: 'Bhagavad Gita (2:47)',
    category: 'religion',
    subCategory: 'hinduismus',
    subCategoryEn: 'Hinduism',
  },
];
