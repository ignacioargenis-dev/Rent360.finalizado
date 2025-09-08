'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Clock,
  User,
  Video,
  Phone, Building } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface Appointment {
  id: string;
  title: string;
  clientName: string;
  date: string;
  time: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  type: 'visit' | 'meeting' | 'call' | 'video';
  priority: 'low' | 'medium' | 'high';
  propertyTitle?: string;
  propertyAddress?: string;
}

interface AppointmentCalendarProps {
  appointments: Appointment[];
  onDateClick?: (date: Date) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
  onCreateAppointment?: (date: Date) => void;
}

export default function AppointmentCalendar({ 
  appointments, 
  onDateClick, 
  onAppointmentClick, 
  onCreateAppointment, 
}: AppointmentCalendarProps) {

  const [currentDate, setCurrentDate] = useState(new Date());

  const [selectedDate, setSelectedDate] = useState(new Date());

  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(appointment => 
      isSameDay(parseISO(appointment.date), date),
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'no_show':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'visit':
        return <Building className="w-3 h-3" />;
      case 'meeting':
        return <User className="w-3 h-3" />;
      case 'call':
        return <Phone className="w-3 h-3" />;
      case 'video':
        return <Video className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateClick?.(date);
  };

  const handleAppointmentClick = (appointment: Appointment, e: React.MouseEvent) => {
    e.stopPropagation();
    onAppointmentClick?.(appointment);
  };

  const handleCreateAppointment = (date: Date, e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateAppointment?.(date);
  };

  const renderMonthView = () => {
    const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    return (
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-600 p-2">
            {day}
          </div>
        ))}
        
        {monthDays.map(day => {
          const dayAppointments = getAppointmentsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div
              key={day.toString()}
              className={`
                min-h-24 p-1 border border-gray-200 cursor-pointer transition-colors
                ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                ${isSelected ? 'ring-2 ring-emerald-500 bg-emerald-50' : ''}
                ${isToday ? 'bg-blue-50' : ''}
                hover:bg-gray-50
              `}
              onClick={() => handleDateClick(day)}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`
                  text-sm font-medium
                  ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                  ${isToday ? 'bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}
                `}>
                  {format(day, 'd')}
                </span>
                {dayAppointments.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {dayAppointments.length}
                  </Badge>
                )}
              </div>
              
              <div className="space-y-1">
                {dayAppointments.slice(0, 3).map(appointment => (
                  <div
                    key={appointment.id}
                    className={`
                      text-xs p-1 rounded border-l-2 cursor-pointer
                      ${getStatusColor(appointment.status)}
                      ${getPriorityColor(appointment.priority)}
                    `}
                    onClick={(e) => handleAppointmentClick(appointment, e)}
                  >
                    <div className="flex items-center gap-1">
                      {getTypeIcon(appointment.type)}
                      <span className="truncate font-medium">
                        {format(parseISO(`${appointment.date}T${appointment.time}`), 'HH:mm')}
                      </span>
                    </div>
                    <div className="truncate text-xs opacity-75">
                      {appointment.clientName}
                    </div>
                  </div>
                ))}
                
                {dayAppointments.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayAppointments.length - 3} más
                  </div>
                )}
              </div>
              
              <Button
                size="sm"
                variant="ghost"
                className="w-full mt-1 h-6 text-xs"
                onClick={(e) => handleCreateAppointment(day, e)}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dayAppointments = getAppointmentsForDate(selectedDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <div className="space-y-2">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold">
            {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </h3>
        </div>
        
        <div className="space-y-1">
          {hours.map(hour => {
            const hourAppointments = dayAppointments.filter(appointment => {
              const appointmentHour = parseInt(appointment.time.split(':')[0]);
              return appointmentHour === hour;
            });
            
            return (
              <div key={hour} className="flex gap-2">
                <div className="w-16 text-sm text-gray-600 text-right py-2">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="flex-1 min-h-16 border-t border-gray-200 pt-1">
                  {hourAppointments.map(appointment => (
                    <div
                      key={appointment.id}
                      className={`
                        mb-2 p-2 rounded-lg border-l-4 cursor-pointer
                        ${getStatusColor(appointment.status)}
                        ${getPriorityColor(appointment.priority)}
                      `}
                      onClick={() => onAppointmentClick?.(appointment)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(appointment.type)}
                          <span className="font-medium text-sm">
                            {appointment.time} - {appointment.clientName}
                          </span>
                        </div>
                        <Badge className="text-xs">
                          {appointment.duration}min
                        </Badge>
                      </div>
                      
                      <div className="text-xs opacity-75 mb-1">
                        {appointment.title}
                      </div>
                      
                      {appointment.propertyTitle && (
                        <div className="flex items-center gap-1 text-xs opacity-75">
                          <Building className="w-3 h-3" />
                          <span>{appointment.propertyTitle}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {hourAppointments.length === 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full h-8 text-xs border-dashed border-gray-300"
                      onClick={() => onCreateAppointment?.(selectedDate)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Agendar
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Calendario de Citas
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-32 text-center">
                {format(currentDate, "MMMM 'de' yyyy", { locale: es })}
              </span>
              <Button size="sm" variant="outline" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={view === 'month' ? 'default' : 'outline'}
                onClick={() => setView('month')}
              >
                Mes
              </Button>
              <Button
                size="sm"
                variant={view === 'day' ? 'default' : 'outline'}
                onClick={() => setView('day')}
              >
                Día
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {view === 'month' ? renderMonthView() : renderDayView()}
      </CardContent>
    </Card>
  );
}
