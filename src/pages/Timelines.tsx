import { useEffect, useState } from 'react';
import { Clock, Calendar, MapPin, ExternalLink, Users, Link as LinkIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  created_at: string;
}

interface Deadline {
  id: string;
  title: string;
  deadline_date: string;
  deadline_type: string;
  description: string;
  completed: boolean;
}

interface Person {
  id: string;
  name: string;
  description: string;
  linkedin_url: string;
  role: string;
}

interface ProgramLink {
  id: string;
  title: string;
  url: string;
  description: string;
  link_type: string;
}

interface ProgramWithDetails extends Program {
  deadlines: Deadline[];
  people: Person[];
  links: ProgramLink[];
}

const Timelines = () => {
  const { toast } = useToast();
  const [programs, setPrograms] = useState<ProgramWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      // Note: In a real app, this would filter by authenticated user
      const { data, error } = await supabase
        .from('research_programs')
        .select(`
          *,
          deadlines:program_deadlines(*),
          people:program_people(*),
          links:program_links(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPrograms(data || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast({
        title: "Error",
        description: "Failed to load programs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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

  const getProgramTypeColor = (type: string) => {
    const colors = {
      'PhD': 'bg-purple-100 text-purple-800 border-purple-200',
      'Masters': 'bg-blue-100 text-blue-800 border-blue-200',
      'Fellowship': 'bg-green-100 text-green-800 border-green-200',
      'Postdoc': 'bg-orange-100 text-orange-800 border-orange-200',
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

  const sortDeadlinesByDate = (deadlines: Deadline[]) => {
    return [...deadlines].sort((a, b) => 
      new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime()
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-muted-foreground">Loading timelines...</p>
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
            Program Timelines
          </h1>
          <p className="text-muted-foreground">
            Individual timeline views for each research program
          </p>
        </div>

        {programs.length > 0 ? (
          <div className="space-y-8">
            {programs.map((program) => (
              <Card key={program.id} className="shadow-elegant border-accent/20">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl font-heading mb-2">
                        {program.title}
                      </CardTitle>
                      <div className="flex items-center space-x-4 text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{program.university}</span>
                        </div>
                        <Badge className={getProgramTypeColor(program.program_type)}>
                          {program.program_type}
                        </Badge>
                        <Badge variant={program.status === 'active' ? 'default' : 'secondary'}>
                          {program.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {program.description && (
                    <p className="text-muted-foreground mt-2">{program.description}</p>
                  )}
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Timeline */}
                  {program.deadlines.length > 0 && (
                    <div>
                    <h3 className="font-semibold mb-4 flex items-center space-x-2">
                      <Clock className="h-5 w-5" />
                      <span>Deadlines Timeline</span>
                    </h3>
                      <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-accent"></div>
                        
                        <div className="space-y-6">
                          {sortDeadlinesByDate(program.deadlines).map((deadline, index) => (
                            <div key={deadline.id} className="relative flex items-start space-x-4">
                              {/* Timeline node */}
                              <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                                deadline.completed 
                                  ? 'bg-green-100 border-green-500 text-green-600'
                                  : 'bg-background border-accent text-accent-foreground'
                              }`}>
                                <Calendar className="h-4 w-4" />
                              </div>
                              
                              {/* Timeline content */}
                              <div className="min-w-0 flex-1 pb-6">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-medium text-foreground">
                                      {deadline.title}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                      {formatDate(deadline.deadline_date)}
                                    </p>
                                    {deadline.description && (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {deadline.description}
                                      </p>
                                    )}
                                  </div>
                                  <Badge className={getDeadlineTypeColor(deadline.deadline_type)}>
                                    {deadline.deadline_type}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* People and Links Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* People */}
                    {program.people.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center space-x-2">
                          <Users className="h-5 w-5" />
                          <span>Key Contacts</span>
                        </h3>
                        <div className="space-y-3">
                          {program.people.map((person) => (
                            <Card key={person.id} className="p-3 border-accent/20">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-sm">{person.name}</p>
                                  <p className="text-xs text-muted-foreground capitalize">
                                    {person.role}
                                  </p>
                                  {person.description && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {person.description}
                                    </p>
                                  )}
                                </div>
                                {person.linkedin_url && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="shrink-0"
                                    onClick={() => window.open(person.linkedin_url, '_blank')}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Links */}
                    {program.links.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center space-x-2">
                          <LinkIcon className="h-5 w-5" />
                          <span>Resources</span>
                        </h3>
                        <div className="space-y-3">
                          {program.links.map((link) => (
                            <Card key={link.id} className="p-3 border-accent/20">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-sm">{link.title}</p>
                                  <p className="text-xs text-muted-foreground capitalize">
                                    {link.link_type}
                                  </p>
                                  {link.description && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {link.description}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="shrink-0"
                                  onClick={() => window.open(link.url, '_blank')}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Empty States */}
                  {program.deadlines.length === 0 && program.people.length === 0 && program.links.length === 0 && (
                    <div className="text-center py-8">
                      <Clock className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground">No timeline data available</p>
                      <p className="text-xs text-muted-foreground">
                        Add more details via chat to populate this timeline
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Programs Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by adding research programs through the chat interface
            </p>
            <Button onClick={() => window.location.href = '/'} className="bg-gradient-primary">
              Go to Chat
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Timelines;