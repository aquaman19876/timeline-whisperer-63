import ChatInterface from '@/components/ChatInterface';
import Navigation from '@/components/Navigation';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-heading font-bold text-foreground mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Research Program Tracker
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Organize your research applications, track deadlines, and manage contacts 
            with AI-powered data extraction
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 rounded-lg bg-card shadow-soft border border-accent/20">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎓</span>
              </div>
              <h3 className="font-semibold mb-2">Smart Extraction</h3>
              <p className="text-sm text-muted-foreground">
                AI extracts programs, deadlines, and contacts from your descriptions
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg bg-card shadow-soft border border-accent/20">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📅</span>
              </div>
              <h3 className="font-semibold mb-2">Calendar Views</h3>
              <p className="text-sm text-muted-foreground">
                Visualize all deadlines and timelines in one organized calendar
              </p>
            </div>
            
            <div className="text-center p-6 rounded-lg bg-card shadow-soft border border-accent/20">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔗</span>
              </div>
              <h3 className="font-semibold mb-2">Knowledge Graph</h3>
              <p className="text-sm text-muted-foreground">
                Connect people and resources across all your research programs
              </p>
            </div>
          </div>
        </div>

        <ChatInterface />
        
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Start by describing a research program you're interested in, including university, 
            program type, deadlines, and any contacts or resources you know about.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
