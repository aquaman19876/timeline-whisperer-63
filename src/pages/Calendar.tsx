import { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';

interface Program {
  id: string;
  title: string;
  university: string;
  description: string;
  program_type: string;
  status: string;
}

interface Deadline {
  id: string;
  program_id: string;
  title: string;
  deadline_date: string;
  deadline_type: string;
  description: string;
  completed: boolean;
  program?: Program;
}

const Calendar = () => {
  const { toast } = useToast();
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeadlines();
  }, []);

  const fetchDeadlines = async () => {
    try {
      // Note: In a real app, this would filter by authenticated user
      const { data, error } = await supabase
        .from('program_deadlines')
        .select(`
          *,
          program:research_programs(*)
        `)
        .order('deadline_date', { ascending: true });

      if (error) throw error;

      setDeadlines(data || []);
    } catch (error) {
      console.error('Error fetching deadlines:', error);
      toast({
        title: "Error",
        description: "Failed to load deadlines",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDeadlinesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return deadlines.filter(deadline => 
      deadline.deadline_date.startsWith(dateStr)
    );
  };

  const getUpcomingDeadlines = () => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return deadlines.filter(deadline => {
      const deadlineDate = new Date(deadline.deadline_date);
      return deadlineDate >= now && deadlineDate <= thirtyDaysFromNow && !deadline.completed;
    }).slice(0, 5);
  };

  const getDeadlineTypeColor = (type: string) => {
    const colors = {
      'application': 'bg-red-100 text-red-800 border-red-200',
      'project': 'bg-blue-100 text-blue-800 border-blue-200',
      'interview': 'bg-purple-100 text-purple-800 border-purple-200',
      'notification': 'bg-green-100 text-green-800 border-green-200',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntil = (dateString: string) => {
    const deadline = new Date(dateString);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <CalendarIcon className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-muted-foreground">Loading calendar...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-heading font-bold text-foreground mb-2">
            Research Calendar
          </h1>
          <p className="text-muted-foreground">
            Track all your research program deadlines in one place
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <Card className="lg:col-span-2 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5" />
                <span>Calendar View</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border shadow-soft"
                  modifiers={{
                    hasDeadline: (date) => getDeadlinesForDate(date).length > 0
                  }}
                  modifiersStyles={{
                    hasDeadline: { 
                      backgroundColor: 'hsl(var(--accent))',
                      color: 'hsl(var(--accent-foreground))',
                      fontWeight: 'bold'
                    }
                  }}
                />
              </div>

              {/* Selected Date Deadlines */}
              {selectedDate && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">
                    {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h3>
                  <div className="space-y-2">
                    {getDeadlinesForDate(selectedDate).length > 0 ? (
                      getDeadlinesForDate(selectedDate).map(deadline => (
                        <div
                          key={deadline.id}
                          className="p-3 rounded-lg border bg-card hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{deadline.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {deadline.program?.title} - {deadline.program?.university}
                              </p>
                            </div>
                            <Badge className={getDeadlineTypeColor(deadline.deadline_type)}>
                              {deadline.deadline_type}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        No deadlines for this date
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Deadlines Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Upcoming Deadlines</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {getUpcomingDeadlines().length > 0 ? (
                  getUpcomingDeadlines().map(deadline => {
                    const daysUntil = getDaysUntil(deadline.deadline_date);
                    return (
                      <div
                        key={deadline.id}
                        className="p-4 rounded-lg border bg-card hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-sm">{deadline.title}</h4>
                          <Badge 
                            className={`${getDeadlineTypeColor(deadline.deadline_type)} text-xs`}
                          >
                            {deadline.deadline_type}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{deadline.program?.university}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <CalendarIcon className="h-3 w-3" />
                            <span>{formatDate(deadline.deadline_date)}</span>
                          </div>
                        </div>

                        <div className={`mt-2 text-xs font-medium ${
                          daysUntil <= 7 ? 'text-red-600' : 
                          daysUntil <= 14 ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {daysUntil === 0 ? 'Due Today!' : 
                           daysUntil === 1 ? 'Due Tomorrow' : 
                           daysUntil < 0 ? 'Overdue' : 
                           `${daysUntil} days left`}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6">
                    <CalendarIcon className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
                    <p className="text-xs text-muted-foreground">
                      Add programs via chat to see deadlines here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Deadlines</span>
                  <span className="font-medium">{deadlines.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <span className="font-medium">
                    {deadlines.filter(d => d.completed).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Upcoming (30 days)</span>
                  <span className="font-medium">
                    {getUpcomingDeadlines().length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;