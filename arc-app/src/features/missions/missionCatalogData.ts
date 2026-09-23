// Immutable bundled ARC Personal Mission catalog V1.
// Application updates are the content-authoring path; backend copies only validate this package.
export const PERSONAL_MISSION_CATALOG_DATA = [
  {
    "id": 1,
    "title_de": "GUTER START",
    "title_en": "GOOD START",
    "objective_de": "Erledige innerhalb deiner ersten 7 Tage 10 Tagesaufgaben.",
    "objective_en": "Complete 10 Daily Tasks within your first 7 days.",
    "difficulty": "easy",
    "reward": 20,
    "repeat_days": null,
    "rule": {
      "type": "task_count",
      "target": 10,
      "scope": "onboarding",
      "window_days": 7
    }
  },
  {
    "id": 2,
    "title_de": "ERSTER SCHRITT",
    "title_en": "FIRST STEP",
    "objective_de": "Erledige deine erste Tagesaufgabe.",
    "objective_en": "Complete your first Daily Task.",
    "difficulty": "easy",
    "reward": 5,
    "repeat_days": null,
    "rule": {
      "type": "task_count",
      "target": 1,
      "scope": "lifetime"
    }
  },
  {
    "id": 3,
    "title_de": "ERSTE WOCHE",
    "title_en": "FIRST WEEK",
    "objective_de": "Erledige innerhalb deiner ersten 7 Tage an mindestens 4 verschiedenen Tagen eine Tagesaufgabe.",
    "objective_en": "Complete a Daily Task on at least 4 different days within your first 7 days.",
    "difficulty": "easy",
    "reward": 10,
    "repeat_days": null,
    "rule": {
      "type": "active_days",
      "target": 4,
      "scope": "onboarding",
      "window_days": 7
    }
  },
  {
    "id": 4,
    "title_de": "ERSTE VIELFALT",
    "title_en": "FIRST VARIETY",
    "objective_de": "Erledige innerhalb deiner ersten 14 Tage mindestens eine Tagesaufgabe aus 4 verschiedenen ARC-Bereichen.",
    "objective_en": "Complete Daily Tasks from 4 different ARC domains within your first 14 days.",
    "difficulty": "easy",
    "reward": 10,
    "repeat_days": null,
    "rule": {
      "type": "diversity",
      "target": 4,
      "scope": "onboarding",
      "window_days": 14
    }
  },
  {
    "id": 5,
    "title_de": "ARC ENTDECKEN",
    "title_en": "DISCOVER ARC",
    "objective_de": "Erledige mindestens eine Tagesaufgabe aus jedem der 6 ARC-Bereiche.",
    "objective_en": "Complete at least one Daily Task from every ARC domain.",
    "difficulty": "easy",
    "reward": 15,
    "repeat_days": null,
    "rule": {
      "type": "diversity",
      "target": 6,
      "scope": "lifetime"
    }
  },
  {
    "id": 6,
    "title_de": "DIE ERSTEN 25",
    "title_en": "THE FIRST 25",
    "objective_de": "Erledige insgesamt 25 Tagesaufgaben.",
    "objective_en": "Complete 25 Daily Tasks in total.",
    "difficulty": "easy",
    "reward": 35,
    "repeat_days": null,
    "rule": {
      "type": "task_count",
      "target": 25,
      "scope": "lifetime"
    }
  },
  {
    "id": 7,
    "title_de": "AKTIVE WOCHE",
    "title_en": "ACTIVE WEEK",
    "objective_de": "Erledige innerhalb von 7 Tagen insgesamt 15 Tagesaufgaben.",
    "objective_en": "Complete 15 Daily Tasks within 7 days.",
    "difficulty": "easy",
    "reward": 15,
    "repeat_days": 7,
    "rule": {
      "type": "task_count",
      "target": 15,
      "window_days": 7
    }
  },
  {
    "id": 8,
    "title_de": "DRANBLEIBEN",
    "title_en": "KEEP AT IT",
    "objective_de": "Erledige innerhalb von 7 Tagen an mindestens 5 verschiedenen Tagen mindestens eine Tagesaufgabe.",
    "objective_en": "Complete at least one Daily Task on 5 different days within 7 days.",
    "difficulty": "easy",
    "reward": 5,
    "repeat_days": 7,
    "rule": {
      "type": "active_days",
      "target": 5,
      "window_days": 7
    }
  },
  {
    "id": 9,
    "title_de": "PRODUKTIVE WOCHE",
    "title_en": "PRODUCTIVE WEEK",
    "objective_de": "Erledige innerhalb von 7 Tagen insgesamt 25 Tagesaufgaben.",
    "objective_en": "Complete 25 Daily Tasks within 7 days.",
    "difficulty": "medium",
    "reward": 25,
    "repeat_days": 7,
    "rule": {
      "type": "task_count",
      "target": 25,
      "window_days": 7
    }
  },
  {
    "id": 10,
    "title_de": "DREI STARKE TAGE",
    "title_en": "THREE STRONG DAYS",
    "objective_de": "Erledige innerhalb von 7 Tagen an 3 verschiedenen Tagen jeweils mindestens 3 Tagesaufgaben.",
    "objective_en": "Complete at least 3 Daily Tasks on 3 different days within 7 days.",
    "difficulty": "easy",
    "reward": 10,
    "repeat_days": 7,
    "rule": {
      "type": "active_days",
      "target": 3,
      "min_per_day": 3,
      "window_days": 7
    }
  },
  {
    "id": 11,
    "title_de": "KEIN LEERLAUF",
    "title_en": "NO IDLE DAY",
    "objective_de": "Erledige innerhalb von 7 Tagen an jedem Tag mindestens eine Tagesaufgabe.",
    "objective_en": "Complete at least one Daily Task every day for 7 days.",
    "difficulty": "medium",
    "reward": 15,
    "repeat_days": 14,
    "rule": {
      "type": "task_streak",
      "target": 7,
      "window_days": 7
    }
  },
  {
    "id": 12,
    "title_de": "FREIE WAHL",
    "title_en": "FREE CHOICE",
    "objective_de": "Erledige innerhalb von 7 Tagen 20 Tagesaufgaben. Die Bereiche sind vollständig dir überlassen.",
    "objective_en": "Complete 20 Daily Tasks within 7 days in any domains.",
    "difficulty": "easy",
    "reward": 20,
    "repeat_days": 7,
    "rule": {
      "type": "task_count",
      "target": 20,
      "window_days": 7
    }
  },
  {
    "id": 13,
    "title_de": "BREIT AUFGESTELLT",
    "title_en": "BROADLY POSITIONED",
    "objective_de": "Erledige innerhalb von 7 Tagen mindestens 12 Tagesaufgaben aus mindestens 4 verschiedenen ARC-Bereichen.",
    "objective_en": "Complete 12 Daily Tasks across at least 4 ARC domains within 7 days.",
    "difficulty": "medium",
    "reward": 15,
    "repeat_days": 7,
    "rule": {
      "type": "task_count_diversity",
      "target": 12,
      "diversity": 4,
      "window_days": 7
    }
  },
  {
    "id": 14,
    "title_de": "VOLLE BANDBREITE",
    "title_en": "FULL RANGE",
    "objective_de": "Erledige innerhalb von 7 Tagen mindestens eine Tagesaufgabe aus jedem der 6 ARC-Bereiche.",
    "objective_en": "Complete a Daily Task from every ARC domain within 7 days.",
    "difficulty": "easy",
    "reward": 10,
    "repeat_days": 14,
    "rule": {
      "type": "diversity",
      "target": 6,
      "window_days": 7
    }
  },
  {
    "id": 15,
    "title_de": "ZWEI WOCHEN IM FLOW",
    "title_en": "TWO WEEKS IN FLOW",
    "objective_de": "Erledige innerhalb von 14 Tagen an mindestens 10 verschiedenen Tagen eine Tagesaufgabe.",
    "objective_en": "Complete a Daily Task on at least 10 different days within 14 days.",
    "difficulty": "medium",
    "reward": 10,
    "repeat_days": 14,
    "rule": {
      "type": "active_days",
      "target": 10,
      "window_days": 14
    }
  },
  {
    "id": 16,
    "title_de": "50 IN 14",
    "title_en": "50 IN 14",
    "objective_de": "Erledige innerhalb von 14 Tagen insgesamt 50 Tagesaufgaben.",
    "objective_en": "Complete 50 Daily Tasks within 14 days.",
    "difficulty": "hard",
    "reward": 45,
    "repeat_days": 14,
    "rule": {
      "type": "task_count",
      "target": 50,
      "window_days": 14
    }
  },
  {
    "id": 17,
    "title_de": "AKTIVER MONAT",
    "title_en": "ACTIVE MONTH",
    "objective_de": "Erledige innerhalb von 30 Tagen an mindestens 20 verschiedenen Tagen eine Tagesaufgabe.",
    "objective_en": "Complete a Daily Task on at least 20 different days within 30 days.",
    "difficulty": "hard",
    "reward": 20,
    "repeat_days": 30,
    "rule": {
      "type": "active_days",
      "target": 20,
      "window_days": 30
    }
  },
  {
    "id": 18,
    "title_de": "HUNDERT IM MONAT",
    "title_en": "ONE HUNDRED IN A MONTH",
    "objective_de": "Erledige innerhalb von 30 Tagen insgesamt 100 Tagesaufgaben.",
    "objective_en": "Complete 100 Daily Tasks within 30 days.",
    "difficulty": "hard",
    "reward": 75,
    "repeat_days": 30,
    "rule": {
      "type": "task_count",
      "target": 100,
      "window_days": 30
    }
  },
  {
    "id": 19,
    "title_de": "MONAT DER VIELFALT",
    "title_en": "MONTH OF VARIETY",
    "objective_de": "Erledige innerhalb von 30 Tagen aus jedem der 6 ARC-Bereiche mindestens 5 Tagesaufgaben.",
    "objective_en": "Complete at least 5 Daily Tasks in each ARC domain within 30 days.",
    "difficulty": "hard",
    "reward": 35,
    "repeat_days": 30,
    "rule": {
      "type": "category_minimums",
      "window_days": 30,
      "minimums": {
        "wissen": 5,
        "muskeln": 5,
        "geist": 5,
        "beweglichkeit": 5,
        "business": 5,
        "geld": 5
      }
    }
  },
  {
    "id": 20,
    "title_de": "KARRIERE-DUO",
    "title_en": "CAREER DUO",
    "objective_de": "Erledige insgesamt 10 Business-Tagesaufgaben und 10 Geld-Tagesaufgaben.",
    "objective_en": "Complete 10 Business and 10 Money Daily Tasks in total.",
    "difficulty": "medium",
    "reward": 40,
    "repeat_days": null,
    "rule": {
      "type": "category_minimums",
      "scope": "lifetime",
      "minimums": {
        "business": 10,
        "geld": 10
      }
    }
  },
  {
    "id": 21,
    "title_de": "KÖRPERLICHE ENTWICKLUNG",
    "title_en": "PHYSICAL DEVELOPMENT",
    "objective_de": "Erledige insgesamt 100 Tagesaufgaben aus Beweglichkeit, Muskeln oder Geist.",
    "objective_en": "Complete 100 Daily Tasks from Mobility, Muscles or Mind in total.",
    "difficulty": "hard",
    "reward": 120,
    "repeat_days": null,
    "rule": {
      "type": "task_count",
      "target": 100,
      "scope": "lifetime",
      "categories": [
        "beweglichkeit",
        "muskeln",
        "geist"
      ]
    }
  },
  {
    "id": 22,
    "title_de": "KOPF & KARRIERE",
    "title_en": "MIND & CAREER",
    "objective_de": "Erledige innerhalb von 14 Tagen 20 Tagesaufgaben aus Wissen, Business oder Geld.",
    "objective_en": "Complete 20 Daily Tasks from Knowledge, Business or Money within 14 days.",
    "difficulty": "medium",
    "reward": 20,
    "repeat_days": 14,
    "rule": {
      "type": "task_count",
      "target": 20,
      "window_days": 14,
      "categories": [
        "wissen",
        "business",
        "geld"
      ]
    }
  },
  {
    "id": 23,
    "title_de": "KÖRPER & KOPF",
    "title_en": "BODY & MIND",
    "objective_de": "Erledige innerhalb von 14 Tagen 20 Tagesaufgaben aus Muskeln, Beweglichkeit, Geist oder Wissen.",
    "objective_en": "Complete 20 Daily Tasks from Muscles, Mobility, Mind or Knowledge within 14 days.",
    "difficulty": "medium",
    "reward": 20,
    "repeat_days": 14,
    "rule": {
      "type": "task_count",
      "target": 20,
      "window_days": 14,
      "categories": [
        "muskeln",
        "beweglichkeit",
        "geist",
        "wissen"
      ]
    }
  },
  {
    "id": 24,
    "title_de": "AUFBAU",
    "title_en": "BUILD-UP",
    "objective_de": "Erledige insgesamt 50 Tagesaufgaben aus Business oder Geld.",
    "objective_en": "Complete 50 Business or Money Daily Tasks in total.",
    "difficulty": "hard",
    "reward": 75,
    "repeat_days": null,
    "rule": {
      "type": "task_count",
      "target": 50,
      "scope": "lifetime",
      "categories": [
        "business",
        "geld"
      ]
    }
  },
  {
    "id": 25,
    "title_de": "KÖRPERKONTROLLE",
    "title_en": "BODY CONTROL",
    "objective_de": "Erledige insgesamt 50 Tagesaufgaben aus Muskeln oder Beweglichkeit.",
    "objective_en": "Complete 50 Muscles or Mobility Daily Tasks in total.",
    "difficulty": "hard",
    "reward": 75,
    "repeat_days": null,
    "rule": {
      "type": "task_count",
      "target": 50,
      "scope": "lifetime",
      "categories": [
        "muskeln",
        "beweglichkeit"
      ]
    }
  },
  {
    "id": 26,
    "title_de": "MENTALE ENTWICKLUNG",
    "title_en": "MENTAL DEVELOPMENT",
    "objective_de": "Erledige insgesamt 50 Tagesaufgaben aus Wissen oder Geist.",
    "objective_en": "Complete 50 Knowledge or Mind Daily Tasks in total.",
    "difficulty": "hard",
    "reward": 75,
    "repeat_days": null,
    "rule": {
      "type": "task_count",
      "target": 50,
      "scope": "lifetime",
      "categories": [
        "wissen",
        "geist"
      ]
    }
  },
  {
    "id": 27,
    "title_de": "DREI SÄULEN",
    "title_en": "THREE PILLARS",
    "objective_de": "Erledige innerhalb von 14 Tagen 25 Tagesaufgaben aus mindestens 3 verschiedenen ARC-Bereichen.",
    "objective_en": "Complete 25 Daily Tasks across at least 3 ARC domains within 14 days.",
    "difficulty": "medium",
    "reward": 25,
    "repeat_days": 14,
    "rule": {
      "type": "task_count_diversity",
      "target": 25,
      "diversity": 3,
      "window_days": 14
    }
  },
  {
    "id": 28,
    "title_de": "VIER SÄULEN",
    "title_en": "FOUR PILLARS",
    "objective_de": "Erledige innerhalb von 30 Tagen mindestens 10 Tagesaufgaben aus jeweils 4 verschiedenen ARC-Bereichen.",
    "objective_en": "Complete at least 10 Daily Tasks in each of 4 ARC domains within 30 days.",
    "difficulty": "hard",
    "reward": 40,
    "repeat_days": 30,
    "rule": {
      "type": "category_threshold_count",
      "target": 4,
      "minimum": 10,
      "window_days": 30
    }
  },
  {
    "id": 29,
    "title_de": "WISSEN VERTIEFEN",
    "title_en": "DEEPEN KNOWLEDGE",
    "objective_de": "Erledige insgesamt 50 Wissen-Tagesaufgaben.",
    "objective_en": "Complete 50 Knowledge Daily Tasks in total.",
    "difficulty": "hard",
    "reward": 80,
    "repeat_days": null,
    "rule": {
      "type": "task_count",
      "target": 50,
      "scope": "lifetime",
      "categories": [
        "wissen"
      ]
    }
  },
  {
    "id": 30,
    "title_de": "KÖRPER STÄRKEN",
    "title_en": "STRENGTHEN THE BODY",
    "objective_de": "Erledige insgesamt 50 Muskeln-Tagesaufgaben.",
    "objective_en": "Complete 50 Muscles Daily Tasks in total.",
    "difficulty": "hard",
    "reward": 80,
    "repeat_days": null,
    "rule": {
      "type": "task_count",
      "target": 50,
      "scope": "lifetime",
      "categories": [
        "muskeln"
      ]
    }
  },
  {
    "id": 31,
    "title_de": "GEIST ENTWICKELN",
    "title_en": "DEVELOP THE MIND",
    "objective_de": "Erledige insgesamt 50 Geist-Tagesaufgaben.",
    "objective_en": "Complete 50 Mind Daily Tasks in total.",
    "difficulty": "hard",
    "reward": 80,
    "repeat_days": null,
    "rule": {
      "type": "task_count",
      "target": 50,
      "scope": "lifetime",
      "categories": [
        "geist"
      ]
    }
  },
  {
    "id": 32,
    "title_de": "BEWEGLICH BLEIBEN",
    "title_en": "STAY MOBILE",
    "objective_de": "Erledige insgesamt 50 Beweglichkeit-Tagesaufgaben.",
    "objective_en": "Complete 50 Mobility Daily Tasks in total.",
    "difficulty": "hard",
    "reward": 80,
    "repeat_days": null,
    "rule": {
      "type": "task_count",
      "target": 50,
      "scope": "lifetime",
      "categories": [
        "beweglichkeit"
      ]
    }
  },
  {
    "id": 33,
    "title_de": "BUSINESS AUFBAUEN",
    "title_en": "BUILD BUSINESS",
    "objective_de": "Erledige insgesamt 50 Business-Tagesaufgaben.",
    "objective_en": "Complete 50 Business Daily Tasks in total.",
    "difficulty": "hard",
    "reward": 80,
    "repeat_days": null,
    "rule": {
      "type": "task_count",
      "target": 50,
      "scope": "lifetime",
      "categories": [
        "business"
      ]
    }
  },
  {
    "id": 34,
    "title_de": "FINANZEN ENTWICKELN",
    "title_en": "DEVELOP FINANCES",
    "objective_de": "Erledige insgesamt 50 Geld-Tagesaufgaben.",
    "objective_en": "Complete 50 Money Daily Tasks in total.",
    "difficulty": "hard",
    "reward": 80,
    "repeat_days": null,
    "rule": {
      "type": "task_count",
      "target": 50,
      "scope": "lifetime",
      "categories": [
        "geld"
      ]
    }
  },
  {
    "id": 35,
    "title_de": "WOCHENFOKUS",
    "title_en": "WEEKLY FOCUS",
    "objective_de": "Erledige innerhalb von 7 Tagen mindestens 8 Tagesaufgaben aus demselben ARC-Bereich.",
    "objective_en": "Complete at least 8 Daily Tasks in one ARC domain within 7 days.",
    "difficulty": "easy",
    "reward": 10,
    "repeat_days": 7,
    "rule": {
      "type": "same_category_count",
      "target": 8,
      "window_days": 7
    }
  },
  {
    "id": 36,
    "title_de": "FREIER SPEZIALIST",
    "title_en": "FREE SPECIALIST",
    "objective_de": "Erledige innerhalb von 14 Tagen mindestens 15 Tagesaufgaben aus einem beliebigen einzelnen ARC-Bereich.",
    "objective_en": "Complete at least 15 Daily Tasks in one ARC domain within 14 days.",
    "difficulty": "medium",
    "reward": 20,
    "repeat_days": 14,
    "rule": {
      "type": "same_category_count",
      "target": 15,
      "window_days": 14
    }
  },
  {
    "id": 37,
    "title_de": "DREI TAGE DRAN",
    "title_en": "THREE DAYS STRONG",
    "objective_de": "Erledige an 3 Tagen in Folge mindestens eine Tagesaufgabe.",
    "objective_en": "Complete at least one Daily Task on 3 consecutive days.",
    "difficulty": "easy",
    "reward": 5,
    "repeat_days": 7,
    "rule": {
      "type": "task_streak",
      "target": 3,
      "window_days": 7
    }
  },
  {
    "id": 38,
    "title_de": "EINE WOCHE DRAN",
    "title_en": "ONE WEEK STRONG",
    "objective_de": "Erledige an 7 Tagen in Folge mindestens eine Tagesaufgabe.",
    "objective_en": "Complete at least one Daily Task on 7 consecutive days.",
    "difficulty": "medium",
    "reward": 15,
    "repeat_days": 14,
    "rule": {
      "type": "task_streak",
      "target": 7,
      "window_days": 14
    }
  },
  {
    "id": 39,
    "title_de": "ZWEI WOCHEN DRAN",
    "title_en": "TWO WEEKS STRONG",
    "objective_de": "Erledige an 14 Tagen in Folge mindestens eine Tagesaufgabe.",
    "objective_en": "Complete at least one Daily Task on 14 consecutive days.",
    "difficulty": "hard",
    "reward": 50,
    "repeat_days": null,
    "rule": {
      "type": "task_streak",
      "target": 14,
      "scope": "lifetime"
    }
  },
  {
    "id": 40,
    "title_de": "MONAT DER DISZIPLIN",
    "title_en": "MONTH OF DISCIPLINE",
    "objective_de": "Erledige an 30 Tagen in Folge mindestens eine Tagesaufgabe.",
    "objective_en": "Complete at least one Daily Task on 30 consecutive days.",
    "difficulty": "hard",
    "reward": 105,
    "repeat_days": null,
    "rule": {
      "type": "task_streak",
      "target": 30,
      "scope": "lifetime"
    }
  },
  {
    "id": 41,
    "title_de": "100 TAGE",
    "title_en": "100 DAYS",
    "objective_de": "Erledige an 100 Tagen in Folge mindestens eine Tagesaufgabe.",
    "objective_en": "Complete at least one Daily Task on 100 consecutive days.",
    "difficulty": "epic",
    "reward": 295,
    "repeat_days": null,
    "rule": {
      "type": "task_streak",
      "target": 100,
      "scope": "lifetime"
    }
  },
  {
    "id": 42,
    "title_de": "JEDEN TAG MEHR ALS EINE",
    "title_en": "MORE THAN ONE EVERY DAY",
    "objective_de": "Erledige an 7 Tagen in Folge jeden Tag mindestens 2 Tagesaufgaben.",
    "objective_en": "Complete at least 2 Daily Tasks per day on 7 consecutive days.",
    "difficulty": "medium",
    "reward": 25,
    "repeat_days": 30,
    "rule": {
      "type": "task_streak",
      "target": 7,
      "min_per_day": 2,
      "window_days": 30
    }
  },
  {
    "id": 43,
    "title_de": "VIELFÄLTIGE SERIE",
    "title_en": "VARIED STREAK",
    "objective_de": "Erledige an 7 Tagen in Folge täglich eine Tagesaufgabe und nutze mindestens 4 ARC-Bereiche.",
    "objective_en": "Complete a Daily Task on 7 consecutive days across at least 4 ARC domains.",
    "difficulty": "medium",
    "reward": 15,
    "repeat_days": 14,
    "rule": {
      "type": "streak_diversity",
      "target": 7,
      "diversity": 4,
      "window_days": 14
    }
  },
  {
    "id": 44,
    "title_de": "WIEDER DA",
    "title_en": "BACK AGAIN",
    "objective_de": "Logge dich an 3 Tagen in Folge ein.",
    "objective_en": "Log in on 3 consecutive days.",
    "difficulty": "easy",
    "reward": 10,
    "repeat_days": null,
    "rule": {
      "type": "login_streak",
      "target": 3,
      "scope": "lifetime"
    }
  },
  {
    "id": 45,
    "title_de": "STAMMGAST",
    "title_en": "REGULAR",
    "objective_de": "Logge dich an 7 Tagen in Folge ein.",
    "objective_en": "Log in on 7 consecutive days.",
    "difficulty": "medium",
    "reward": 15,
    "repeat_days": 14,
    "rule": {
      "type": "login_streak",
      "target": 7,
      "window_days": 14
    }
  },
  {
    "id": 46,
    "title_de": "ARC ROUTINE",
    "title_en": "ARC ROUTINE",
    "objective_de": "Logge dich an 14 Tagen in Folge ein.",
    "objective_en": "Log in on 14 consecutive days.",
    "difficulty": "hard",
    "reward": 50,
    "repeat_days": null,
    "rule": {
      "type": "login_streak",
      "target": 14,
      "scope": "lifetime"
    }
  },
  {
    "id": 47,
    "title_de": "EIN MONAT ARC",
    "title_en": "ONE MONTH OF ARC",
    "objective_de": "Logge dich an 30 Tagen in Folge ein.",
    "objective_en": "Log in on 30 consecutive days.",
    "difficulty": "hard",
    "reward": 105,
    "repeat_days": null,
    "rule": {
      "type": "login_streak",
      "target": 30,
      "scope": "lifetime"
    }
  },
  {
    "id": 48,
    "title_de": "100 TAGE ARC",
    "title_en": "100 DAYS OF ARC",
    "objective_de": "Logge dich an 100 Tagen in Folge ein.",
    "objective_en": "Log in on 100 consecutive days.",
    "difficulty": "epic",
    "reward": 295,
    "repeat_days": null,
    "rule": {
      "type": "login_streak",
      "target": 100,
      "scope": "lifetime"
    }
  },
  {
    "id": 49,
    "title_de": "EIN JAHR ARC",
    "title_en": "ONE YEAR OF ARC",
    "objective_de": "Logge dich an 365 Tagen in Folge ein.",
    "objective_en": "Log in on 365 consecutive days.",
    "difficulty": "epic",
    "reward": 805,
    "repeat_days": null,
    "rule": {
      "type": "login_streak",
      "target": 365,
      "scope": "lifetime"
    }
  },
  {
    "id": 50,
    "title_de": "DOPPELSCHLAG",
    "title_en": "DOUBLE STRIKE",
    "objective_de": "Erledige innerhalb von 7 Tagen an 4 verschiedenen Tagen jeweils mindestens 2 Tagesaufgaben.",
    "objective_en": "Complete at least 2 Daily Tasks on 4 different days within 7 days.",
    "difficulty": "easy",
    "reward": 10,
    "repeat_days": 7,
    "rule": {
      "type": "active_days",
      "target": 4,
      "min_per_day": 2,
      "window_days": 7
    }
  },
  {
    "id": 51,
    "title_de": "DREIFACHTAG",
    "title_en": "TRIPLE DAY",
    "objective_de": "Erledige an einem Tag mindestens 3 Tagesaufgaben.",
    "objective_en": "Complete at least 3 Daily Tasks in one day.",
    "difficulty": "easy",
    "reward": 5,
    "repeat_days": 3,
    "rule": {
      "type": "active_days",
      "target": 1,
      "min_per_day": 3,
      "window_days": 3
    }
  },
  {
    "id": 52,
    "title_de": "GROSSER TAG",
    "title_en": "BIG DAY",
    "objective_de": "Erledige an einem Tag mindestens 6 Tagesaufgaben.",
    "objective_en": "Complete at least 6 Daily Tasks in one day.",
    "difficulty": "medium",
    "reward": 10,
    "repeat_days": 7,
    "rule": {
      "type": "active_days",
      "target": 1,
      "min_per_day": 6,
      "window_days": 7
    }
  },
  {
    "id": 53,
    "title_de": "SECHS AUF EINEN STREICH",
    "title_en": "SIX IN ONE GO",
    "objective_de": "Erledige an einem Tag mindestens eine Tagesaufgabe aus jedem der 6 ARC-Bereiche.",
    "objective_en": "Complete a Daily Task from every ARC domain in one day.",
    "difficulty": "hard",
    "reward": 10,
    "repeat_days": 14,
    "rule": {
      "type": "daily_diversity",
      "target": 6,
      "window_days": 14
    }
  },
  {
    "id": 54,
    "title_de": "DREI BEREICHE, EIN TAG",
    "title_en": "THREE DOMAINS, ONE DAY",
    "objective_de": "Erledige an einem Tag Tagesaufgaben aus mindestens 3 verschiedenen ARC-Bereichen.",
    "objective_en": "Complete Daily Tasks from at least 3 ARC domains in one day.",
    "difficulty": "easy",
    "reward": 5,
    "repeat_days": 3,
    "rule": {
      "type": "daily_diversity",
      "target": 3,
      "window_days": 3
    }
  },
  {
    "id": 55,
    "title_de": "VIER BEREICHE, EIN TAG",
    "title_en": "FOUR DOMAINS, ONE DAY",
    "objective_de": "Erledige an einem Tag Tagesaufgaben aus mindestens 4 verschiedenen ARC-Bereichen.",
    "objective_en": "Complete Daily Tasks from at least 4 ARC domains in one day.",
    "difficulty": "medium",
    "reward": 10,
    "repeat_days": 7,
    "rule": {
      "type": "daily_diversity",
      "target": 4,
      "window_days": 7
    }
  },
  {
    "id": 56,
    "title_de": "ABWECHSLUNGSREICH",
    "title_en": "VARIED",
    "objective_de": "Erledige 10 aufeinanderfolgende Tagesaufgaben aus mindestens 4 verschiedenen ARC-Bereichen.",
    "objective_en": "Complete 10 consecutive Daily Tasks across at least 4 ARC domains.",
    "difficulty": "medium",
    "reward": 10,
    "repeat_days": 7,
    "rule": {
      "type": "sequential_diversity",
      "target": 10,
      "diversity": 4,
      "window_days": 7
    }
  },
  {
    "id": 57,
    "title_de": "FREIE MISCHUNG",
    "title_en": "FREE MIX",
    "objective_de": "Erledige innerhalb von 7 Tagen 18 Tagesaufgaben aus mindestens 3 verschiedenen ARC-Bereichen.",
    "objective_en": "Complete 18 Daily Tasks across at least 3 ARC domains within 7 days.",
    "difficulty": "medium",
    "reward": 20,
    "repeat_days": 7,
    "rule": {
      "type": "task_count_diversity",
      "target": 18,
      "diversity": 3,
      "window_days": 7
    }
  },
  {
    "id": 58,
    "title_de": "COMEBACK",
    "title_en": "COMEBACK",
    "objective_de": "Erledige nach mindestens 3 Tagen ohne abgeschlossene Tagesaufgabe wieder eine Tagesaufgabe.",
    "objective_en": "Complete a Daily Task after at least 3 consecutive inactive days.",
    "difficulty": "easy",
    "reward": 5,
    "repeat_days": 7,
    "rule": {
      "type": "comeback",
      "target": 1,
      "inactive_days": 3,
      "window_days": 7
    }
  },
  {
    "id": 59,
    "title_de": "ZURÜCK IM RHYTHMUS",
    "title_en": "BACK IN RHYTHM",
    "objective_de": "Erledige nach 3 inaktiven Tagen in den folgenden 7 Tagen an mindestens 4 Tagen Tagesaufgaben.",
    "objective_en": "After 3 inactive days, complete Daily Tasks on 4 days within the following 7 days.",
    "difficulty": "medium",
    "reward": 5,
    "repeat_days": 14,
    "rule": {
      "type": "comeback_run",
      "active_days": 4,
      "inactive_days": 3,
      "window_days": 7
    }
  },
  {
    "id": 60,
    "title_de": "NEUSTART",
    "title_en": "RESTART",
    "objective_de": "Erledige nach 7 inaktiven Tagen in den folgenden 7 Tagen mindestens 10 Tagesaufgaben.",
    "objective_en": "After 7 inactive days, complete 10 Daily Tasks within the following 7 days.",
    "difficulty": "medium",
    "reward": 10,
    "repeat_days": 30,
    "rule": {
      "type": "comeback_run",
      "target": 10,
      "inactive_days": 7,
      "window_days": 7
    }
  },
  {
    "id": 61,
    "title_de": "DIE ERSTEN 100",
    "title_en": "THE FIRST 100",
    "objective_de": "Erledige insgesamt 100 Tagesaufgaben.",
    "objective_en": "Complete 100 Daily Tasks in total.",
    "difficulty": "hard",
    "reward": 110,
    "repeat_days": null,
    "rule": {
      "type": "task_count",
      "target": 100,
      "scope": "lifetime"
    }
  },
  {
    "id": 62,
    "title_de": "250",
    "title_en": "250",
    "objective_de": "Erledige insgesamt 250 Tagesaufgaben.",
    "objective_en": "Complete 250 Daily Tasks in total.",
    "difficulty": "epic",
    "reward": 225,
    "repeat_days": null,
    "rule": {
      "type": "task_count",
      "target": 250,
      "scope": "lifetime"
    }
  },
  {
    "id": 63,
    "title_de": "HALBES TAUSEND",
    "title_en": "HALF A THOUSAND",
    "objective_de": "Erledige insgesamt 500 Tagesaufgaben.",
    "objective_en": "Complete 500 Daily Tasks in total.",
    "difficulty": "epic",
    "reward": 380,
    "repeat_days": null,
    "rule": {
      "type": "task_count",
      "target": 500,
      "scope": "lifetime"
    }
  },
  {
    "id": 64,
    "title_de": "VIERSTELLIG",
    "title_en": "FOUR DIGITS",
    "objective_de": "Erledige insgesamt 1.000 Tagesaufgaben.",
    "objective_en": "Complete 1,000 Daily Tasks in total.",
    "difficulty": "epic",
    "reward": 655,
    "repeat_days": null,
    "rule": {
      "type": "task_count",
      "target": 1000,
      "scope": "lifetime"
    }
  },
  {
    "id": 65,
    "title_de": "2.500",
    "title_en": "2,500",
    "objective_de": "Erledige insgesamt 2.500 Tagesaufgaben.",
    "objective_en": "Complete 2,500 Daily Tasks in total.",
    "difficulty": "epic",
    "reward": 1340,
    "repeat_days": null,
    "rule": {
      "type": "task_count",
      "target": 2500,
      "scope": "lifetime"
    }
  },
  {
    "id": 66,
    "title_de": "5.000",
    "title_en": "5,000",
    "objective_de": "Erledige insgesamt 5.000 Tagesaufgaben.",
    "objective_en": "Complete 5,000 Daily Tasks in total.",
    "difficulty": "epic",
    "reward": 2305,
    "repeat_days": null,
    "rule": {
      "type": "task_count",
      "target": 5000,
      "scope": "lifetime"
    }
  },
  {
    "id": 67,
    "title_de": "FÜNFSTELLIG",
    "title_en": "FIVE DIGITS",
    "objective_de": "Erledige insgesamt 10.000 Tagesaufgaben.",
    "objective_en": "Complete 10,000 Daily Tasks in total.",
    "difficulty": "epic",
    "reward": 3955,
    "repeat_days": null,
    "rule": {
      "type": "task_count",
      "target": 10000,
      "scope": "lifetime"
    }
  },
  {
    "id": 68,
    "title_de": "SECHS SÄULEN",
    "title_en": "SIX PILLARS",
    "objective_de": "Erledige insgesamt mindestens 25 Tagesaufgaben aus jedem der 6 ARC-Bereiche.",
    "objective_en": "Complete at least 25 Daily Tasks in every ARC domain.",
    "difficulty": "hard",
    "reward": 195,
    "repeat_days": null,
    "rule": {
      "type": "category_minimums",
      "scope": "lifetime",
      "minimums": {
        "wissen": 25,
        "muskeln": 25,
        "geist": 25,
        "beweglichkeit": 25,
        "business": 25,
        "geld": 25
      }
    }
  },
  {
    "id": 69,
    "title_de": "ALLROUNDER",
    "title_en": "ALL-ROUNDER",
    "objective_de": "Erledige insgesamt mindestens 100 Tagesaufgaben aus jedem der 6 ARC-Bereiche.",
    "objective_en": "Complete at least 100 Daily Tasks in every ARC domain.",
    "difficulty": "epic",
    "reward": 580,
    "repeat_days": null,
    "rule": {
      "type": "category_minimums",
      "scope": "lifetime",
      "minimums": {
        "wissen": 100,
        "muskeln": 100,
        "geist": 100,
        "beweglichkeit": 100,
        "business": 100,
        "geld": 100
      }
    }
  },
  {
    "id": 70,
    "title_de": "VOLLSTÄNDIGER ARC",
    "title_en": "COMPLETE ARC",
    "objective_de": "Erledige insgesamt 1.000 Tagesaufgaben, davon mindestens 100 aus jedem ARC-Bereich.",
    "objective_en": "Complete 1,000 Daily Tasks, including at least 100 in every ARC domain.",
    "difficulty": "epic",
    "reward": 865,
    "repeat_days": null,
    "rule": {
      "type": "total_and_minimums",
      "target": 1000,
      "scope": "lifetime",
      "minimums": {
        "wissen": 100,
        "muskeln": 100,
        "geist": 100,
        "beweglichkeit": 100,
        "business": 100,
        "geld": 100
      }
    }
  },
  {
    "id": 71,
    "title_de": "MEISTER DER SECHS BEREICHE",
    "title_en": "MASTER OF SIX DOMAINS",
    "objective_de": "Erledige mindestens 500 Tagesaufgaben aus jedem der 6 ARC-Bereiche.",
    "objective_en": "Complete at least 500 Daily Tasks in every ARC domain.",
    "difficulty": "epic",
    "reward": 2040,
    "repeat_days": null,
    "rule": {
      "type": "category_minimums",
      "scope": "lifetime",
      "minimums": {
        "wissen": 500,
        "muskeln": 500,
        "geist": 500,
        "beweglichkeit": 500,
        "business": 500,
        "geld": 500
      }
    }
  },
  {
    "id": 72,
    "title_de": "30 AKTIVE TAGE",
    "title_en": "30 ACTIVE DAYS",
    "objective_de": "Erledige an insgesamt 30 verschiedenen Tagen mindestens eine Tagesaufgabe.",
    "objective_en": "Complete a Daily Task on 30 different days in total.",
    "difficulty": "medium",
    "reward": 45,
    "repeat_days": null,
    "rule": {
      "type": "active_days",
      "target": 30,
      "scope": "lifetime"
    }
  },
  {
    "id": 73,
    "title_de": "100 AKTIVE TAGE",
    "title_en": "100 ACTIVE DAYS",
    "objective_de": "Erledige an insgesamt 100 verschiedenen Tagen mindestens eine Tagesaufgabe.",
    "objective_en": "Complete a Daily Task on 100 different days in total.",
    "difficulty": "hard",
    "reward": 110,
    "repeat_days": null,
    "rule": {
      "type": "active_days",
      "target": 100,
      "scope": "lifetime"
    }
  },
  {
    "id": 74,
    "title_de": "250 AKTIVE TAGE",
    "title_en": "250 ACTIVE DAYS",
    "objective_de": "Erledige an insgesamt 250 verschiedenen Tagen mindestens eine Tagesaufgabe.",
    "objective_en": "Complete a Daily Task on 250 different days in total.",
    "difficulty": "epic",
    "reward": 225,
    "repeat_days": null,
    "rule": {
      "type": "active_days",
      "target": 250,
      "scope": "lifetime"
    }
  },
  {
    "id": 75,
    "title_de": "365 AKTIVE TAGE",
    "title_en": "365 ACTIVE DAYS",
    "objective_de": "Erledige an insgesamt 365 verschiedenen Tagen mindestens eine Tagesaufgabe.",
    "objective_en": "Complete a Daily Task on 365 different days in total.",
    "difficulty": "epic",
    "reward": 300,
    "repeat_days": null,
    "rule": {
      "type": "active_days",
      "target": 365,
      "scope": "lifetime"
    }
  },
  {
    "id": 76,
    "title_de": "PERFEKTE WOCHE",
    "title_en": "PERFECT WEEK",
    "objective_de": "Erledige an 7 Tagen in Folge jeden Tag mindestens 3 Tagesaufgaben.",
    "objective_en": "Complete at least 3 Daily Tasks per day on 7 consecutive days.",
    "difficulty": "hard",
    "reward": 65,
    "repeat_days": null,
    "rule": {
      "type": "task_streak",
      "target": 7,
      "min_per_day": 3,
      "scope": "lifetime"
    }
  },
  {
    "id": 77,
    "title_de": "SECHS SÄULEN IN EINER WOCHE",
    "title_en": "SIX PILLARS IN ONE WEEK",
    "objective_de": "Erledige innerhalb von 7 Tagen mindestens 3 Tagesaufgaben aus jedem der 6 ARC-Bereiche.",
    "objective_en": "Complete at least 3 Daily Tasks in every ARC domain within 7 days.",
    "difficulty": "hard",
    "reward": 25,
    "repeat_days": 30,
    "rule": {
      "type": "category_minimums",
      "window_days": 7,
      "minimums": {
        "wissen": 3,
        "muskeln": 3,
        "geist": 3,
        "beweglichkeit": 3,
        "business": 3,
        "geld": 3
      }
    }
  },
  {
    "id": 78,
    "title_de": "50 MIT VIELFALT",
    "title_en": "50 WITH VARIETY",
    "objective_de": "Erledige 50 Tagesaufgaben und nutze jeden der 6 ARC-Bereiche mindestens einmal.",
    "objective_en": "Complete 50 Daily Tasks and use every ARC domain at least once.",
    "difficulty": "hard",
    "reward": 85,
    "repeat_days": null,
    "rule": {
      "type": "task_count_diversity",
      "target": 50,
      "diversity": 6,
      "scope": "lifetime"
    }
  },
  {
    "id": 79,
    "title_de": "100 MIT VIELFALT",
    "title_en": "100 WITH VARIETY",
    "objective_de": "Erledige in einem Missionslauf 100 Tagesaufgaben, davon mindestens 5 aus jedem ARC-Bereich.",
    "objective_en": "Complete 100 Daily Tasks in one Mission run, including at least 5 in every ARC domain.",
    "difficulty": "epic",
    "reward": 145,
    "repeat_days": null,
    "rule": {
      "type": "total_and_minimums",
      "target": 100,
      "minimums": {
        "wissen": 5,
        "muskeln": 5,
        "geist": 5,
        "beweglichkeit": 5,
        "business": 5,
        "geld": 5
      }
    }
  },
  {
    "id": 80,
    "title_de": "LANGER ATEM",
    "title_en": "LONG HAUL",
    "objective_de": "Erledige innerhalb von 30 Tagen an mindestens 25 verschiedenen Tagen Tagesaufgaben.",
    "objective_en": "Complete Daily Tasks on at least 25 different days within 30 days.",
    "difficulty": "hard",
    "reward": 20,
    "repeat_days": 30,
    "rule": {
      "type": "active_days",
      "target": 25,
      "window_days": 30
    }
  }
] as const;
