import type { AchievementDefinition, AchievementProgress, AchievementSnapshot } from './achievementTypes';
import { isActiveAchievement } from './achievementCatalog';
const six = ['wissen','muskeln','geist','beweglichkeit','business','geld'];
const category = (snapshot:AchievementSnapshot,key:string) => key==='body'
  ? (snapshot.categoryCounts.muskeln??0)+(snapshot.categoryCounts.beweglichkeit??0)
  : snapshot.categoryCounts[key]??0;

export function calculateAchievementProgress(definition:AchievementDefinition,s:AchievementSnapshot):AchievementProgress {
  const rule=definition.rule; let current=0; let target=1;
  switch(rule.type) {
    case 'daily_total': current=s.dailyTotal; target=rule.target; break;
    case 'level': current=s.level; target=rule.target; break;
    case 'category_total': current=rule.categories.reduce((n,k)=>n+category(s,k),0); target=rule.target; break;
    case 'category_each': current=Math.min(...rule.categories.map(k=>category(s,k))); target=rule.target; break;
    case 'areas_each': current=Math.min(...six.map(k=>category(s,k))); target=rule.target; break;
    case 'areas_on_day': current=Object.values(s.completionsByDay).filter(day=>six.filter(k=>(day[k]??0)>0).length>=rule.areas).length; target=rule.days; break;
    case 'tasks_on_day': current=Math.max(0,...Object.values(s.completionsByDay).map(day=>Object.values(day).reduce((a,b)=>a+b,0))); target=rule.target; break;
    case 'max_streak': current=s.maxStreak; target=rule.target; break;
    case 'active_days': current=s.activeDays; target=rule.target; break;
    case 'mission_activated': current=s.missionsActivated>0?1:0; break;
    case 'missions_completed': current=s.missionsCompleted; target=rule.target; break;
    case 'epic_missions': current=s.missionsByDifficulty.epic??0; target=rule.target; break;
    case 'mission_all_difficulties': current=['easy','medium','hard','epic'].filter(x=>(s.missionsByDifficulty[x]??0)>0).length; target=4; break;
    case 'skins_owned': current=new Set(s.uniqueSkinIds).size; target=rule.target; break;
    case 'skin_tier': current=new Set(s.uniqueSkinIds.filter(id=>s.skinTiers[id]===rule.tier)).size; target=rule.target??1; break;
    case 'gameplay_credits': current=s.gameplayCredits; target=rule.target; break;
    case 'friends': current=s.confirmedFriends; target=rule.target; break;
    case 'clan_joined': current=s.clanJoined?1:0; break;
    case 'clan_founder_five': current=s.foundedClanReachedFive?1:0; break;
    case 'clan_admin_received': current=s.receivedClanAdminRole?1:0; break;
    case 'account_started': current=[s.dailyTotal>0,s.missionsCompleted>0,s.uniqueSkinIds.length>0].filter(Boolean).length; target=3; break;
    case 'complete_package': current=Object.entries(s.completionsByDay).some(([day,counts])=>six.every(k=>(counts[k]??0)>0)&&(s.missionCompletionsByDay[day]??0)>0)?1:0; break;
    case 'meta': current=[s.level>=rule.level,s.dailyTotal>=rule.daily,s.missionsCompleted>=rule.missions].filter(Boolean).length; target=3; break;
    case 'global_rank': current=s.globalRankMilestones.some(x=>x.rank===rule.rank&&x.population>=rule.population)?1:0; break;
    case 'clan_rank': current=s.clanRankMilestones.some(x=>x.rank===rule.rank&&x.population>=rule.population)?1:0; break;
  }
  return {current:Math.min(current,target),target,completed:current>=target};
}
export const isAchievementUnlocked=(d:AchievementDefinition,s:AchievementSnapshot)=>isActiveAchievement(d)&&calculateAchievementProgress(d,s).completed;
export const getUnlockedAchievements=(catalog:readonly AchievementDefinition[],s:AchievementSnapshot)=>catalog.filter(d=>isAchievementUnlocked(d,s));
export const emptyAchievementSnapshot=():AchievementSnapshot=>({dailyTotal:0,level:1,categoryCounts:{},completionsByDay:{},maxStreak:0,activeDays:0,missionsActivated:0,missionsCompleted:0,missionsByDifficulty:{},missionCompletionsByDay:{},uniqueSkinIds:[],skinTiers:{},gameplayCredits:0,confirmedFriends:0,clanJoined:false,foundedClanReachedFive:false,receivedClanAdminRole:false,globalRankMilestones:[],clanRankMilestones:[]});
