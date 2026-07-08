import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, MapPin, Clock, ArrowRight } from 'lucide-react';
import { Seminar } from '../types';

interface PlannerCalendarPageProps {
  seminars: Seminar[];
  onViewSeminarDetails: (seminarId: string) => void;
}

export const PlannerCalendarPage: React.FC<PlannerCalendarPageProps> = ({
  seminars,
  onViewSeminarDetails
}) => {
  // We'll anchor on July 2021 since the workshops are set around this date range
  const [currentYear, setCurrentYear] = useState(2021);
  const [currentMonth, setCurrentMonth] = useState(6); // 0-indexed, 6 = July
  const [selectedDay, setSelectedDay] = useState<number | null>(8); // Default to July 8, 2021

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
    setSelectedDay(null);
  };

  // Find seminars happening on a specific day of the current month/year
  const getSeminarsForDay = (day: number) => {
    return seminars.filter(sem => {
      const semDate = new Date(sem.startDate);
      return (
        semDate.getFullYear() === currentYear &&
        semDate.getMonth() === currentMonth &&
        semDate.getDate() === day
      );
    });
  };

  // Generate blank spaces for calendar grid
  const calendarCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  // Active day seminars
  const selectedDaySeminars = selectedDay ? getSeminarsForDay(selectedDay) : [];

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-neutral-100/80 shadow-xl shadow-neutral-100/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-neutral-800 flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-indigo-600" />
            Interactive Seminar Planner
          </h2>
          <p className="text-sm text-neutral-500 mt-1.5 leading-relaxed font-semibold">
            Visualize scheduled events on a grid calendar, check daily schedules, and secure seats.
          </p>
        </div>
        
        {/* Calendar Nav Header */}
        <div className="flex items-center gap-3.5 bg-neutral-50 px-5 py-3 rounded-2xl border border-neutral-200">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-white rounded-xl transition-colors cursor-pointer text-neutral-600 hover:text-indigo-600"
          >
            <ChevronLeft className="w-5.5 h-5.5" />
          </button>
          <span className="text-sm sm:text-base font-extrabold text-neutral-700 min-w-[140px] text-center">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-white rounded-xl transition-colors cursor-pointer text-neutral-600 hover:text-indigo-600"
          >
            <ChevronRight className="w-5.5 h-5.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Calendar Month Grid (7 columns) */}
        <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-neutral-100/80 shadow-2xl shadow-neutral-100/50 space-y-6">
          {/* Days of Week Headers */}
          <div className="grid grid-cols-7 gap-3 text-center text-xs sm:text-sm font-extrabold text-neutral-450 uppercase tracking-widest">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Calendar Grid Cells */}
          <div className="grid grid-cols-7 gap-3">
            {calendarCells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="aspect-square bg-neutral-50/20 rounded-2xl" />;
              }

              const daySeminars = getSeminarsForDay(day);
              const hasEvents = daySeminars.length > 0;
              const isSelected = selectedDay === day;

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => setSelectedDay(day)}
                  className={`aspect-square rounded-2xl border flex flex-col justify-between p-3 sm:p-4 transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20 font-bold scale-[1.02]'
                      : 'bg-white border-neutral-100 hover:bg-neutral-50/60 hover:shadow-sm'
                  }`}
                >
                  <span className={`text-sm sm:text-base ${isSelected ? 'text-white' : 'text-neutral-750 font-bold'}`}>
                    {day}
                  </span>

                  {/* Visual dots or indicator pill of seminars happening */}
                  {hasEvents && (
                    <div className="flex flex-wrap gap-1.5 mt-auto">
                      {daySeminars.slice(0, 3).map((sem, sIdx) => (
                        <span
                          key={sem.id}
                          className={`w-2.5 h-2.5 rounded-full ${
                            isSelected
                              ? 'bg-white'
                              : sem.category === 'Technology'
                              ? 'bg-indigo-500'
                              : sem.category === 'Business & Finance'
                              ? 'bg-emerald-500'
                              : sem.category === 'Health & Science'
                              ? 'bg-sky-500'
                              : 'bg-amber-500'
                          }`}
                          title={sem.title}
                        />
                      ))}
                      {daySeminars.length > 3 && (
                        <span className={`text-[10px] leading-none font-bold ${isSelected ? 'text-white' : 'text-neutral-400'}`}>
                          +{daySeminars.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Day Schedule Pane (5 columns) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-8 rounded-3xl border border-neutral-100/80 shadow-2xl shadow-neutral-100/50 min-h-[400px] flex flex-col justify-between">
            <div>
              <div className="border-b border-neutral-100 pb-4 mb-5">
                <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-widest block mb-1">
                  Daily Schedule List
                </span>
                <h3 className="font-display font-extrabold text-lg text-neutral-850">
                  {selectedDay ? `${monthNames[currentMonth]} ${selectedDay}, ${currentYear}` : 'Select a Day'}
                </h3>
              </div>

              {selectedDaySeminars.length === 0 ? (
                <div className="text-center py-20 text-neutral-400 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-neutral-50 flex items-center justify-center mx-auto">
                    <Clock className="w-7 h-7 text-neutral-400" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-base text-neutral-700">No Seminars Scheduled</h4>
                    <p className="text-xs sm:text-sm text-neutral-450 leading-relaxed max-w-[280px] mx-auto font-medium">
                      There are no institutional lectures scheduled on this day. Select an active date with color indicators.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {selectedDaySeminars.map(sem => (
                    <div
                      key={sem.id}
                      className="p-6 rounded-2xl border border-neutral-100/80 bg-neutral-50/30 hover:bg-neutral-50/75 hover:border-neutral-200 transition-all space-y-4 text-left"
                    >
                      <div className="flex justify-between items-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {sem.category}
                        </span>
                        <span className="text-xs text-neutral-400 font-extrabold font-mono">
                          {new Date(sem.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-display font-extrabold text-base text-neutral-850 leading-snug line-clamp-1">
                          {sem.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-neutral-500 line-clamp-2 leading-relaxed font-semibold">
                          {sem.description}
                        </p>
                      </div>

                      <div className="space-y-2 pt-3 border-t border-neutral-100 text-xs sm:text-sm text-neutral-600 font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
                          <span className="truncate">{sem.venue}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-neutral-400 shrink-0" />
                          <span>Slots: {sem.registeredCount} / {sem.capacity} Filled</span>
                        </div>
                      </div>

                      <button
                        onClick={() => onViewSeminarDetails(sem.id)}
                        className="w-full mt-2.5 py-3 bg-white border border-neutral-200 hover:border-indigo-600 hover:text-indigo-600 text-neutral-700 font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        Explore Event Space
                        <ArrowRight className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Summary Tip */}
            <div className="mt-8 p-5 bg-indigo-50/40 border border-indigo-100 rounded-2xl text-xs sm:text-sm text-indigo-800 leading-relaxed font-semibold">
              <strong>Tip:</strong> Filter events by day, click <strong>Explore Event Space</strong> to access guest session agenda times and speaker directories.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
