import React, { useState } from 'react';
import { AppState, WeeklyDayTask, WeeklyRoutineState } from '../../types';
import { CalendarDays, Check, Maximize2, Minus, Plus, Trash2 } from 'lucide-react';
import { getTodayDateString } from '../../utils/storage';
import { Language } from '../../utils/i18n';

interface WeeklyRoutineWidgetProps {
  appState: AppState; lang?: Language; isMinimized?: boolean; onToggleMinimize: () => void;
  onUpdateAppState: (updated: Partial<AppState>) => void;
  playSoundEffect: (type: 'complete' | 'click' | 'levelup') => void;
}

const DAYS = { de: ['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'], en: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] };
const SHORT_DAYS = { de: ['MO','DI','MI','DO','FR','SA','SO'], en: ['MON','TUE','WED','THU','FRI','SAT','SUN'] };

export const WeeklyRoutineWidget: React.FC<WeeklyRoutineWidgetProps> = ({ appState, lang = 'de', isMinimized = false, onToggleMinimize, onUpdateAppState, playSoundEffect }) => {
  const todayStr = appState.arcDay || getTodayDateString();
  const todayIndex = (new Date(`${todayStr}T00:00:00`).getDay() + 6) % 7;
  const [selectedDayIndex, setSelectedDayIndex] = useState(todayIndex);
  const [newTaskInput, setNewTaskInput] = useState('');
  const weeklyRoutine: WeeklyRoutineState = appState.weeklyRoutine || {};
  const names = lang === 'en' ? DAYS.en : DAYS.de;
  const shortNames = lang === 'en' ? SHORT_DAYS.en : SHORT_DAYS.de;
  const selectedTasks = weeklyRoutine[selectedDayIndex] || [];
  const doneCount = selectedTasks.filter((task) => task.completedDate === todayStr).length;

  const addTask = () => {
    const text = newTaskInput.trim();
    if (!text) return;
    playSoundEffect('click');
    const task: WeeklyDayTask = { id: `wtask-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, text };
    onUpdateAppState({ weeklyRoutine: { ...weeklyRoutine, [selectedDayIndex]: [...selectedTasks, task] } });
    setNewTaskInput('');
  };
  const toggleTask = (taskId: string) => {
    const tasks = selectedTasks.map((task) => {
      if (task.id !== taskId) return task;
      const completed = task.completedDate === todayStr;
      playSoundEffect(completed ? 'click' : 'complete');
      return { ...task, completedDate: completed ? undefined : todayStr };
    });
    onUpdateAppState({ weeklyRoutine: { ...weeklyRoutine, [selectedDayIndex]: tasks } });
  };
  const deleteTask = (taskId: string) => {
    playSoundEffect('click');
    onUpdateAppState({ weeklyRoutine: { ...weeklyRoutine, [selectedDayIndex]: selectedTasks.filter((task) => task.id !== taskId) } });
  };

  const toggleMinimize = () => {
    playSoundEffect('click');
    onToggleMinimize();
  };

  if (isMinimized) return <section className="arc-system-collapsed"><CalendarDays /><strong>{lang === 'en' ? 'Weekly Routine' : 'Wochenplan'}</strong><button onClick={toggleMinimize}><Maximize2 /></button></section>;

  return (
    <section className="arc-routine-system">
      <header className="arc-system-heading">
        <div className="arc-system-icon arc-system-icon--amber"><CalendarDays /></div>
        <div><span className="arc-kicker">7 DAY // ROUTINE GRID</span><h2 className="arc-display">{lang === 'en' ? 'Weekly Routine' : 'Wochenplan'}</h2></div>
        <div className="arc-system-counter"><strong>{doneCount}/{selectedTasks.length}</strong><span>{lang === 'en' ? 'done' : 'erledigt'}</span></div>
        <button className="arc-system-minimize" onClick={toggleMinimize}><Minus /></button>
      </header>

      <div className="arc-day-selector" role="tablist" aria-label={lang === 'en' ? 'Week days' : 'Wochentage'}>
        {shortNames.map((name, index) => {
          const tasks = weeklyRoutine[index] || [];
          const completed = tasks.filter((task) => task.completedDate === todayStr).length;
          return <button key={name} role="tab" aria-selected={selectedDayIndex === index} onClick={() => setSelectedDayIndex(index)} className={`${selectedDayIndex === index ? 'is-selected' : ''} ${todayIndex === index ? 'is-today' : ''}`}><span>{name}</span><strong>{tasks.length}</strong><i style={{ width: tasks.length ? `${(completed / tasks.length) * 100}%` : '0%' }} /></button>;
        })}
      </div>

      <div className="arc-routine-workspace">
        <div className="arc-routine-title"><div><span>{lang === 'en' ? 'Selected day' : 'Ausgewählter Tag'}</span><h3>{names[selectedDayIndex]}</h3></div><span>{selectedTasks.length} {lang === 'en' ? 'routines' : 'Routinen'}</span></div>
        <div className="arc-routine-tasks">
          {selectedTasks.length === 0 ? <div className="arc-compact-empty">{lang === 'en' ? 'No routine configured for this day.' : 'Für diesen Tag ist keine Routine angelegt.'}</div> : selectedTasks.map((task) => {
            const completed = task.completedDate === todayStr;
            return <div key={task.id} className={completed ? 'is-complete' : ''}><button onClick={() => toggleTask(task.id)}><Check /></button><span>{task.text}</span><button onClick={() => deleteTask(task.id)} aria-label={lang === 'en' ? 'Delete task' : 'Aufgabe löschen'}><Trash2 /></button></div>;
          })}
        </div>
        <div className="arc-routine-input"><input value={newTaskInput} onChange={(event) => setNewTaskInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') addTask(); }} placeholder={lang === 'en' ? `Add routine to ${names[selectedDayIndex]}…` : `Routine zu ${names[selectedDayIndex]} hinzufügen…`} /><button onClick={addTask}><Plus /><span>{lang === 'en' ? 'Add' : 'Hinzufügen'}</span></button></div>
      </div>
    </section>
  );
};
