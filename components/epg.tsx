'use client';

import { useState, useMemo } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, Grid3X3 } from 'lucide-react';
import { Channel } from '@/lib/m3u-parser';
import { cn, formatTime } from '@/lib/utils';

interface Program {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  category?: string;
  isLive?: boolean;
}

interface EPGProps {
  channels: Channel[];
  selectedChannel?: Channel | null;
  onChannelSelect?: (channel: Channel) => void;
  className?: string;
}

// Mock EPG data generator
function generateMockPrograms(channel: Channel, date: Date): Program[] {
  const programs: Program[] = [];
  const now = new Date();
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const programTemplates = [
    { title: 'Morning News', duration: 60, category: 'News' },
    { title: 'Sports Update', duration: 30, category: 'Sports' },
    { title: 'Movie Time', duration: 120, category: 'Entertainment' },
    { title: 'Documentary', duration: 90, category: 'Educational' },
    { title: 'Music Show', duration: 60, category: 'Music' },
    { title: 'Kids Program', duration: 45, category: 'Kids' },
    { title: 'Live Sports', duration: 180, category: 'Sports' },
    { title: 'Drama Series', duration: 60, category: 'Drama' },
    { title: 'Reality Show', duration: 90, category: 'Reality' },
    { title: 'Late Night Show', duration: 75, category: 'Talk Show' }
  ];

  let currentTime = new Date(startOfDay);
  let programId = 0;

  while (currentTime.getDate() === date.getDate()) {
    const template = programTemplates[programId % programTemplates.length];
    const endTime = new Date(currentTime.getTime() + template.duration * 60000);
    
    programs.push({
      id: `${channel.id}-${programId}`,
      title: template.title,
      description: `${template.title} on ${channel.name}`,
      startTime: new Date(currentTime),
      endTime: endTime,
      category: template.category,
      isLive: currentTime <= now && endTime > now
    });

    currentTime = endTime;
    programId++;
  }

  return programs;
}

export default function EPG({ channels, selectedChannel, onChannelSelect, className = '' }: EPGProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<number>(new Date().getHours());

  // Generate EPG data for all channels
  const epgData = useMemo(() => {
    const data = new Map<string, Program[]>();
    channels.forEach(channel => {
      data.set(channel.id, generateMockPrograms(channel, selectedDate));
    });
    return data;
  }, [channels, selectedDate]);

  // Get time slots for the selected date
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      slots.push({
        hour,
        label: new Date(2024, 0, 1, hour).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          hour12: true 
        })
      });
    }
    return slots;
  }, []);

  // Navigate dates
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  // Get programs for a specific time slot
  const getProgramsForTimeSlot = (hour: number) => {
    const programs: Array<{ channel: Channel; program: Program | null }> = [];
    
    channels.forEach(channel => {
      const channelPrograms = epgData.get(channel.id) || [];
      const program = channelPrograms.find(p => {
        const startHour = p.startTime.getHours();
        const endHour = p.endTime.getHours();
        return startHour <= hour && (endHour > hour || (endHour === 0 && hour === 23));
      });
      
      programs.push({ channel, program: program || null });
    });

    return programs;
  };

  // Get current program for a channel
  const getCurrentProgram = (channelId: string): Program | null => {
    const programs = epgData.get(channelId) || [];
    const now = new Date();
    return programs.find(p => p.startTime <= now && p.endTime > now) || null;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className={cn("flex flex-col h-full bg-gray-900 text-white", className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Grid3X3 className="w-5 h-5" />
            Program Guide
          </h2>
          
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "px-3 py-1 rounded text-sm transition-colors",
                viewMode === 'grid' 
                  ? "bg-blue-600 text-white" 
                  : "text-gray-400 hover:text-white"
              )}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={cn(
                "px-3 py-1 rounded text-sm transition-colors",
                viewMode === 'timeline' 
                  ? "bg-blue-600 text-white" 
                  : "text-gray-400 hover:text-white"
              )}
            >
              Timeline
            </button>
          </div>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="font-medium">{formatDate(selectedDate)}</span>
          </div>
          
          <button
            onClick={() => navigateDate('next')}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'grid' ? (
          <div className="h-full overflow-y-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {channels.map(channel => {
                const currentProgram = getCurrentProgram(channel.id);
                const isSelected = selectedChannel?.id === channel.id;

                return (
                  <div
                    key={channel.id}
                    onClick={() => onChannelSelect?.(channel)}
                    className={cn(
                      "p-4 bg-gray-800 rounded-lg border cursor-pointer transition-all hover:border-blue-500",
                      isSelected ? "border-blue-500 bg-blue-500 bg-opacity-20" : "border-gray-700"
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-sm truncate">{channel.name}</h3>
                      {currentProgram?.isLive && (
                        <span className="bg-red-600 text-xs px-2 py-1 rounded-full">LIVE</span>
                      )}
                    </div>

                    {currentProgram ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>
                            {formatTime(currentProgram.startTime.getTime() / 1000)} - {formatTime(currentProgram.endTime.getTime() / 1000)}
                          </span>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-sm mb-1">{currentProgram.title}</h4>
                          <p className="text-xs text-gray-400 line-clamp-2">
                            {currentProgram.description}
                          </p>
                        </div>
                        
                        {currentProgram.category && (
                          <span className="inline-block bg-gray-700 text-xs px-2 py-1 rounded">
                            {currentProgram.category}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        <p className="text-sm">No program information</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-full flex">
            {/* Time Slots Sidebar */}
            <div className="w-24 bg-gray-800 border-r border-gray-700 overflow-y-auto">
              {timeSlots.map(slot => (
                <button
                  key={slot.hour}
                  onClick={() => setSelectedTimeSlot(slot.hour)}
                  className={cn(
                    "w-full p-3 text-left border-b border-gray-700 hover:bg-gray-700 transition-colors",
                    selectedTimeSlot === slot.hour ? "bg-blue-600" : ""
                  )}
                >
                  <div className="text-xs font-medium">{slot.label}</div>
                </button>
              ))}
            </div>

            {/* Programs for Selected Time Slot */}
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-lg font-semibold mb-4">
                Programs at {timeSlots[selectedTimeSlot]?.label}
              </h3>
              
              <div className="space-y-3">
                {getProgramsForTimeSlot(selectedTimeSlot).map(({ channel, program }) => (
                  <div
                    key={channel.id}
                    onClick={() => onChannelSelect?.(channel)}
                    className={cn(
                      "p-3 bg-gray-800 rounded-lg border cursor-pointer transition-all hover:border-blue-500",
                      selectedChannel?.id === channel.id ? "border-blue-500 bg-blue-500 bg-opacity-20" : "border-gray-700"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-1">{channel.name}</h4>
                        {program ? (
                          <div>
                            <p className="text-sm font-medium text-blue-300">{program.title}</p>
                            <p className="text-xs text-gray-400 mt-1">{program.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-gray-500">
                                {formatTime(program.startTime.getTime() / 1000)} - {formatTime(program.endTime.getTime() / 1000)}
                              </span>
                              {program.category && (
                                <span className="bg-gray-700 text-xs px-2 py-1 rounded">
                                  {program.category}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No program scheduled</p>
                        )}
                      </div>
                      
                      {program?.isLive && (
                        <span className="bg-red-600 text-xs px-2 py-1 rounded-full ml-2">LIVE</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}