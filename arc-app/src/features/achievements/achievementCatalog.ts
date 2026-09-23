import type { AchievementDefinition, AchievementRarity, AchievementRule, AchievementSection } from './achievementTypes';
import { stableStringify } from '../content/contentHash';

export const ACHIEVEMENT_CATALOG_VERSION = 'arc_achievements_v1';
export const INACTIVE_LEGACY_ACHIEVEMENT_IDS = Object.freeze([67, 68, 69, 70, 71, 72, 76, 77, 78] as const);
export const isActiveAchievement = (achievement: Pick<AchievementDefinition, 'achievement_id'>) =>
  !INACTIVE_LEGACY_ACHIEVEMENT_IDS.includes(achievement.achievement_id as typeof INACTIVE_LEGACY_ACHIEVEMENT_IDS[number]);
export const ARC_TITLE_CATALOG = [
  ['arc_veteran','ARC-Veteran','ARC Veteran'],['titan','Titan','Titan'],['master_of_mind','Meister des Geistes','Master of Mind'],
  ['financial_strategist','Finanzstratege','Financial Strategist'],['tycoon','Tycoon','Tycoon'],['all_master','Allmeister','Master of All'],
  ['year_veteran','Jahresveteran','Year Veteran'],['mission_veteran','Missionsveteran','Mission Veteran'],['elite','Elite','Elite'],['icon','Ikone','Icon'],
  ['number_one','Nummer Eins','Number One'],['vice_world','Vize der Welt','World Runner-Up'],['clan_champion','Clan-Champion','Clan Champion'],
] as const;

type Row = [number,string,AchievementSection,AchievementRarity,number,AchievementRule,string?,string?];
const six = ['wissen','muskeln','geist','beweglichkeit','business','geld'];
const englishTitles: readonly string[] = [
  'Taking Shape','On Track','Part of Everyday Life','A Way of Life','Unstoppable','ARC Veteran',
  'The First Chapters','Levelled Up','A Class of Your Own','At the Top','Strong Body','Body of Steel',
  'Physical Mastery','Stay Flexible','Stronger Than Yesterday','Mental Strength','Mental Discipline','Master of Mind',
  'Body & Mind','Perfect Balance','Money Conscious','Financial Discipline','Financial Strategist','Entrepreneurial Thinking',
  'Businessperson','Empire','Capital & Skill','The Strategist','All-Rounder','Six Pillars','Balanced','Master of All Worlds',
  'Everything Today','Fourfold Strength','Strong Day','Three Days Stronger','One Week of ARC','A Matter of Habit',
  'A Full Month','Keep Going','One Hundred Days','Half a Year','Day 365','Consistency over Quantity','Again and Again',
  'Part of Your Life','Mission Accepted','Mission Hunter','Battle-Tested','Mission Veteran','No Challenge Too Great',
  'Heavyweight','Seen It All','Mission: Impossible','A New Look','Small Collection','Collector','Wardrobe','Curator',
  'Quality Recognized','Extremely Epic','The Crown Jewels','Self-Made','A Fortune of Your Own','Hard Work Pays Off',
  'By Your Own Effort','Not Alone','Connected','Network','Community','Founder','Responsibility','Your ARC Begins',
  'The Complete Package','The Long Road','Number One','World Runner-Up','Strongest Clan',
];
const rows: Row[] = [
  [1,'Es nimmt Form an','career','common',5,{type:'daily_total',target:25}], [2,'Auf Kurs','career','rare',15,{type:'daily_total',target:100}],
  [3,'Teil des Alltags','career','epic',30,{type:'daily_total',target:500}], [4,'Eine Lebensweise','career','epic',40,{type:'daily_total',target:1000}],
  [5,'Unaufhaltsam','career','legendary',75,{type:'daily_total',target:2500}], [6,'ARC-Veteran','career','legendary',100,{type:'daily_total',target:5000},'arc_veteran'],
  [7,'Die ersten Kapitel','career','common',5,{type:'level',target:5}], [8,'Aufgestiegen','career','rare',15,{type:'level',target:15}],
  [9,'Eine Klasse für sich','career','epic',35,{type:'level',target:30}], [10,'An der Spitze','career','legendary',75,{type:'level',target:50}],
  [11,'Starker Körper','body_mind','rare',15,{type:'category_total',categories:['muskeln','beweglichkeit'],target:100}], [12,'Körper aus Stahl','body_mind','epic',30,{type:'category_total',categories:['muskeln','beweglichkeit'],target:500}],
  [13,'Körperliche Meisterschaft','body_mind','legendary',60,{type:'category_total',categories:['muskeln','beweglichkeit'],target:1000},'titan'],
  [14,'Beweglich bleiben','body_mind','rare',20,{type:'category_total',categories:['beweglichkeit'],target:100}], [15,'Stärker als gestern','body_mind','rare',20,{type:'category_total',categories:['muskeln'],target:100}],
  [16,'Mentale Stärke','body_mind','rare',15,{type:'category_total',categories:['geist'],target:100}], [17,'Geistige Disziplin','body_mind','epic',30,{type:'category_total',categories:['geist'],target:500}],
  [18,'Meister des Geistes','body_mind','legendary',60,{type:'category_total',categories:['geist'],target:1000},'master_of_mind'],
  [19,'Körper & Geist','body_mind','epic',35,{type:'category_each',categories:['body','geist'],target:100}], [20,'Absolute Balance','body_mind','legendary',75,{type:'category_each',categories:['body','geist'],target:500}],
  [21,'Geldbewusst','money_business','rare',15,{type:'category_total',categories:['geld'],target:50}], [22,'Finanzielle Disziplin','money_business','epic',30,{type:'category_total',categories:['geld'],target:250}],
  [23,'Finanzstratege','money_business','legendary',65,{type:'category_total',categories:['geld'],target:1000},'financial_strategist'],
  [24,'Unternehmerisches Denken','money_business','rare',15,{type:'category_total',categories:['business'],target:50}], [25,'Geschäftsmensch','money_business','epic',30,{type:'category_total',categories:['business'],target:250}],
  [26,'Imperium','money_business','legendary',65,{type:'category_total',categories:['business'],target:1000},'tycoon'],
  [27,'Kapital & Können','money_business','epic',35,{type:'category_each',categories:['geld','business'],target:100}], [28,'Der Stratege','money_business','legendary',75,{type:'category_each',categories:['geld','business'],target:500}],
  [29,'Allrounder','versatility','common',10,{type:'areas_each',target:1}], [30,'Sechs Säulen','versatility','rare',20,{type:'areas_each',target:25}],
  [31,'Ausgeglichen','versatility','epic',40,{type:'areas_each',target:100}], [32,'Meister aller Welten','versatility','legendary',90,{type:'areas_each',target:500},'all_master'],
  [33,'Heute alles','versatility','rare',15,{type:'areas_on_day',areas:6,days:1}], [34,'Vierfach stark','versatility','rare',25,{type:'areas_on_day',areas:4,days:7}],
  [35,'Starker Tag','versatility','common',15,{type:'tasks_on_day',target:10}],
  [36,'Drei Tage stärker','consistency','common',5,{type:'max_streak',target:3}], [37,'Eine Woche ARC','consistency','common',10,{type:'max_streak',target:7}],
  [38,'Gewohnheitssache','consistency','rare',15,{type:'max_streak',target:14}], [39,'Ein ganzer Monat','consistency','rare',25,{type:'max_streak',target:30}],
  [40,'Nicht nachlassen','consistency','epic',30,{type:'max_streak',target:60}], [41,'Hundert Tage','consistency','epic',40,{type:'max_streak',target:100}],
  [42,'Ein halbes Jahr','consistency','legendary',60,{type:'max_streak',target:180}], [43,'365','consistency','legendary',100,{type:'max_streak',target:365},'year_veteran'],
  [44,'Konstanz vor Masse','consistency','rare',20,{type:'active_days',target:50}], [45,'Immer wieder','consistency','epic',40,{type:'active_days',target:250}],
  [46,'Teil deines Lebens','consistency','legendary',90,{type:'active_days',target:500}],
  [47,'Auftrag angenommen','missions','common',5,{type:'mission_activated'}], [48,'Missionsjäger','missions','rare',15,{type:'missions_completed',target:10}],
  [49,'Erprobt','missions','epic',30,{type:'missions_completed',target:50}], [50,'Missionsveteran','missions','epic',40,{type:'missions_completed',target:100}],
  [51,'Keine Herausforderung zu groß','missions','legendary',75,{type:'missions_completed',target:250},'mission_veteran'],
  [52,'Schwergewicht','missions','epic',30,{type:'epic_missions',target:1}], [53,'Alles gesehen','missions','epic',35,{type:'mission_all_difficulties'}],
  [54,'Mission Impossible','missions','legendary',75,{type:'epic_missions',target:10},'elite'],
  [55,'Neuer Look','shop','common',5,{type:'skins_owned',target:1}], [56,'Kleine Sammlung','shop','common',10,{type:'skins_owned',target:3}],
  [57,'Sammler','shop','rare',20,{type:'skins_owned',target:10}], [58,'Kleiderschrank','shop','epic',35,{type:'skins_owned',target:25}],
  [59,'Kurator','shop','legendary',75,{type:'skins_owned',target:50}], [60,'Qualität erkannt','shop','rare',15,{type:'skin_tier',tier:'high_quality',target:1}],
  [61,'Extrem episch','shop','epic',30,{type:'skin_tier',tier:'extreme_epic',target:1}], [62,'Die Kronjuwelen','shop','legendary',75,{type:'skin_tier',tier:'extreme_epic',target:5},'icon'],
  [63,'Selbst verdient','gameplay_credits','common',5,{type:'gameplay_credits',target:1}], [64,'Eigenes Vermögen','gameplay_credits','rare',15,{type:'gameplay_credits',target:250}],
  [65,'Fleiß zahlt sich aus','gameplay_credits','epic',30,{type:'gameplay_credits',target:1000}], [66,'Aus eigener Kraft','gameplay_credits','legendary',75,{type:'gameplay_credits',target:5000}],
  [67,'Nicht allein','community','common',5,{type:'friends',target:1}], [68,'Verbunden','community','common',10,{type:'friends',target:5}],
  [69,'Netzwerk','community','rare',20,{type:'friends',target:20}], [70,'Gemeinschaft','community','common',5,{type:'clan_joined'}],
  [71,'Gründer','community','rare',25,{type:'clan_founder_five'}], [72,'Verantwortung','community','rare',15,{type:'clan_admin_received'}],
  [73,'Deine ARC beginnt','meta_ranking','rare',20,{type:'account_started'}], [74,'Komplettes Paket','meta_ranking','epic',35,{type:'complete_package'}],
  [75,'Der lange Weg','meta_ranking','legendary',100,{type:'meta',level:30,daily:1000,missions:100}],
  [76,'Nummer Eins','meta_ranking','legendary',100,{type:'global_rank',rank:1,population:100},'number_one'],
  [77,'Vize der Welt','meta_ranking','epic',50,{type:'global_rank',rank:2,population:100},'vice_world'],
  [78,'Stärkster Clan','meta_ranking','legendary',100,{type:'clan_rank',rank:1,population:100},'clan_champion'],
];

type AchievementLanguage = 'de' | 'en';
const categoryNames: Record<string, Record<AchievementLanguage, string>> = {
  wissen: { de: 'Wissen', en: 'Knowledge' }, muskeln: { de: 'Muskeln', en: 'Strength' },
  geist: { de: 'Geist', en: 'Mind' }, beweglichkeit: { de: 'Beweglichkeit', en: 'Mobility' },
  business: { de: 'Business', en: 'Business' }, geld: { de: 'Geld', en: 'Finance' },
  body: { de: 'Körper', en: 'Body' },
};

const joinCategories = (categories: string[], language: AchievementLanguage, conjunction: boolean) => {
  const names = categories.map((category) => categoryNames[category]?.[language] ?? category);
  return names.join(conjunction ? (language === 'en' ? ' and ' : ' und ') : ' + ');
};

const skinTierName = (tier: string | undefined, language: AchievementLanguage) => {
  if (tier === 'high_quality') return language === 'en' ? 'high-quality' : 'hochwertigen';
  if (tier === 'extreme_epic') return language === 'en' ? 'extreme epic' : 'extrem epischen';
  return language === 'en' ? 'specified-tier' : 'vorgegebenen';
};

const condition = (rule: AchievementRule, language: AchievementLanguage) => {
  const en = language === 'en';
  switch (rule.type) {
    case 'daily_total': return en ? `Complete ${rule.target} daily tasks` : `${rule.target} Tagesaufgaben abschließen`;
    case 'level': return en ? `Reach level ${rule.target}` : `Level ${rule.target} erreichen`;
    case 'category_total': return en ? `Complete ${rule.target} tasks in ${joinCategories(rule.categories, language, false)}` : `${rule.target} Abschlüsse in ${joinCategories(rule.categories, language, false)}`;
    case 'category_each': return en ? `Complete ${rule.target} tasks each in ${joinCategories(rule.categories, language, true)}` : `Je ${rule.target} Abschlüsse in ${joinCategories(rule.categories, language, true)}`;
    case 'areas_each': return en ? `Complete ${rule.target} tasks in each of the six ARC domains` : `${rule.target} Abschlüsse in jedem der sechs ARC-Bereiche`;
    case 'max_streak': return en ? `Reach a ${rule.target}-day streak` : `${rule.target}-Tage-Streak erreichen`;
    case 'active_days': return en ? `Be active on ${rule.target} ARC days` : `${rule.target} aktive ARC-Tage`;
    case 'missions_completed': return en ? `Complete ${rule.target} Missions` : `${rule.target} Missionen abschließen`;
    case 'epic_missions': return en ? `Complete ${rule.target} Missions at the highest difficulty` : `${rule.target} Missionen höchster Schwierigkeit abschließen`;
    case 'skins_owned': return en ? `Own ${rule.target} unique skins` : `${rule.target} einzigartige Skins besitzen`;
    case 'gameplay_credits': return en ? `Earn ${rule.target} gameplay Credits` : `${rule.target} erspielte Credits verdienen`;
    case 'friends': return en ? `Have ${rule.target} confirmed friends` : `${rule.target} bestätigte Freunde`;
    case 'tasks_on_day': return en ? `Complete ${rule.target} daily tasks on one ARC day` : `${rule.target} Tagesaufgaben an einem ARC-Tag`;
    case 'areas_on_day': return en ? `Complete at least ${rule.areas} domains on ${rule.days} ARC day(s)` : `An ${rule.days} ARC-Tag(en) mindestens ${rule.areas} Bereiche abschließen`;
    case 'mission_activated': return en ? 'Activate your first Mission' : 'Die erste Mission aktivieren';
    case 'mission_all_difficulties': return en ? 'Complete a Mission at every difficulty' : 'Eine Mission in jeder Schwierigkeit abschließen';
    case 'skin_tier': return en ? `Own ${rule.target ?? 1} ${skinTierName(rule.tier, language)} skin(s)` : `${rule.target ?? 1} ${skinTierName(rule.tier, language)} Skin(s) besitzen`;
    case 'clan_joined': return en ? 'Join a clan' : 'Einem Clan beitreten';
    case 'clan_founder_five': return en ? 'Found a clan that reaches five members' : 'Einen Clan gründen, der fünf Mitglieder erreicht';
    case 'clan_admin_received': return en ? 'Receive an officer or leader role in a clan' : 'Eine Offiziers- oder Anführerrolle in einem Clan erhalten';
    case 'account_started': return en ? 'Complete a task and a Mission, and own a skin' : 'Eine Aufgabe und eine Mission abschließen sowie einen Skin besitzen';
    case 'meta': return en ? `Reach level ${rule.level}, complete ${rule.daily} daily tasks and ${rule.missions} Missions` : `Level ${rule.level} erreichen, ${rule.daily} Tagesaufgaben und ${rule.missions} Missionen abschließen`;
    case 'complete_package': return en ? 'Complete all six domains and a Mission on the same ARC day' : 'Alle sechs Bereiche und eine Mission am selben ARC-Tag abschließen';
    case 'global_rank': return en ? `Reach rank ${rule.rank} among at least ${rule.population} players` : `Rang ${rule.rank} bei mindestens ${rule.population} Spielern`;
    case 'clan_rank': return en ? `Reach clan rank ${rule.rank} among at least ${rule.population} clans` : `Clan-Rang ${rule.rank} bei mindestens ${rule.population} Clans`;
  }
};

export const ACHIEVEMENT_CATALOG: readonly AchievementDefinition[] = Object.freeze(rows.map(([id,title,section,rarity,reward,rule,titleId], index) => ({
  achievement_id:id,catalog_version:ACHIEVEMENT_CATALOG_VERSION,title_de:title,title_en:englishTitles[index],
  condition_de:condition(rule, 'de'),condition_en:condition(rule, 'en'),section,rarity,reward_credits:reward,
  title_id:titleId ?? null,rule,sort_order:id,
  availability: (INACTIVE_LEGACY_ACHIEVEMENT_IDS.includes(id as typeof INACTIVE_LEGACY_ACHIEVEMENT_IDS[number]) ? 'inactive_legacy' : 'active') as AchievementDefinition['availability'],
})));

export function serializeAchievementCatalog() { return stableStringify(ACHIEVEMENT_CATALOG); }
export function validateAchievementCatalog(catalog=ACHIEVEMENT_CATALOG) {
  if (catalog.length!==78 || new Set(catalog.map(x=>x.achievement_id)).size!==78) throw new Error('Achievement catalog must contain 78 unique IDs');
  if (ARC_TITLE_CATALOG.length!==13 || new Set(ARC_TITLE_CATALOG.map(x=>x[0])).size!==13) throw new Error('Title catalog must contain 13 unique titles');
  if (englishTitles.length !== rows.length) throw new Error('Every Achievement must have an English title');
  for (const item of catalog) {
    if (item.achievement_id<1 || item.reward_credits<5 || item.reward_credits>100) throw new Error(`Invalid Achievement ${item.achievement_id}`);
    if (!item.title_de || !item.title_en || !item.condition_de || !item.condition_en) throw new Error(`Missing Achievement localization ${item.achievement_id}`);
    if (item.availability !== (INACTIVE_LEGACY_ACHIEVEMENT_IDS.includes(item.achievement_id as typeof INACTIVE_LEGACY_ACHIEVEMENT_IDS[number]) ? 'inactive_legacy' : 'active')) throw new Error(`Invalid Achievement availability ${item.achievement_id}`);
  }
}
validateAchievementCatalog();
