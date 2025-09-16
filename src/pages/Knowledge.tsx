import { useEffect, useState } from 'react';
import { Users, Link as LinkIcon, Search, ExternalLink, MapPin, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';

interface Program {
  id: string;
  title: string;
  university: string;
  program_type: string;
  status: string;
}

interface Person {
  id: string;
  name: string;
  description: string;
  linkedin_url: string;
  role: string;
  program: Program;
}

interface ProgramLink {
  id: string;
  title: string;
  url: string;
  description: string;
  link_type: string;
  program: Program;
}

const Knowledge = () => {
  const { toast } = useToast();
  const [people, setPeople] = useState<Person[]>([]);
  const [links, setLinks] = useState<ProgramLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'people' | 'links'>('people');

  useEffect(() => {
    fetchKnowledgeData();
  }, []);

  const fetchKnowledgeData = async () => {
    try {
      // Fetch people with program data
      const { data: peopleData, error: peopleError } = await supabase
        .from('program_people')
        .select(`
          *,
          program:research_programs(id, title, university, program_type, status)
        `);

      if (peopleError) throw peopleError;

      // Fetch links with program data
      const { data: linksData, error: linksError } = await supabase
        .from('program_links')
        .select(`
          *,
          program:research_programs(id, title, university, program_type, status)
        `);

      if (linksError) throw linksError;

      setPeople(peopleData || []);
      setLinks(linksData || []);
    } catch (error) {
      console.error('Error fetching knowledge data:', error);
      toast({
        title: "Error",
        description: "Failed to load knowledge data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    const colors = {
      'professor': 'bg-purple-100 text-purple-800 border-purple-200',
      'researcher': 'bg-blue-100 text-blue-800 border-blue-200',
      'contact': 'bg-green-100 text-green-800 border-green-200',
      'advisor': 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getLinkTypeColor = (type: string) => {
    const colors = {
      'website': 'bg-blue-100 text-blue-800 border-blue-200',
      'application': 'bg-red-100 text-red-800 border-red-200',
      'research': 'bg-purple-100 text-purple-800 border-purple-200',
      'documentation': 'bg-green-100 text-green-800 border-green-200',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const filteredPeople = people.filter(person =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.program.university.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLinks = links.filter(link =>
    link.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.program.university.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Users className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-muted-foreground">Loading knowledge graph...</p>
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
            Knowledge Graph
          </h1>
          <p className="text-muted-foreground">
            People and resources from your research programs
          </p>
        </div>

        {/* Search and Tabs */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search people, links, programs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
            <Button
              variant={activeTab === 'people' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('people')}
              className="flex items-center space-x-2"
            >
              <Users className="h-4 w-4" />
              <span>People ({filteredPeople.length})</span>
            </Button>
            <Button
              variant={activeTab === 'links' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('links')}
              className="flex items-center space-x-2"
            >
              <LinkIcon className="h-4 w-4" />
              <span>Links ({filteredLinks.length})</span>
            </Button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'people' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPeople.length > 0 ? (
              filteredPeople.map((person) => (
                <Card key={person.id} className="shadow-soft hover:shadow-elegant transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{person.name}</CardTitle>
                        <Badge className={`${getRoleColor(person.role)} mt-1`}>
                          {person.role}
                        </Badge>
                      </div>
                      {person.linkedin_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(person.linkedin_url, '_blank')}
                          className="shrink-0"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {person.description && (
                        <p className="text-sm text-muted-foreground">
                          {person.description}
                        </p>
                      )}
                      
                      <div className="space-y-2 pt-2 border-t border-accent/20">
                        <div className="flex items-center space-x-2 text-sm">
                          <GraduationCap className="h-4 w-4 text-primary" />
                          <span className="font-medium">{person.program.title}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{person.program.university}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchTerm ? 'No matching people found' : 'No people added yet'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? 'Try adjusting your search terms'
                    : 'Add research programs with contact information via chat'
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'links' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLinks.length > 0 ? (
              filteredLinks.map((link) => (
                <Card key={link.id} className="shadow-soft hover:shadow-elegant transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{link.title}</CardTitle>
                        <Badge className={`${getLinkTypeColor(link.link_type)} mt-1`}>
                          {link.link_type}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(link.url, '_blank')}
                        className="shrink-0"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {link.description && (
                        <p className="text-sm text-muted-foreground">
                          {link.description}
                        </p>
                      )}
                      
                      <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded font-mono">
                        {link.url.length > 50 ? `${link.url.substring(0, 50)}...` : link.url}
                      </div>
                      
                      <div className="space-y-2 pt-2 border-t border-accent/20">
                        <div className="flex items-center space-x-2 text-sm">
                          <GraduationCap className="h-4 w-4 text-primary" />
                          <span className="font-medium">{link.program.title}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{link.program.university}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <LinkIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchTerm ? 'No matching links found' : 'No links added yet'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? 'Try adjusting your search terms'
                    : 'Add research programs with relevant links via chat'
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Knowledge;