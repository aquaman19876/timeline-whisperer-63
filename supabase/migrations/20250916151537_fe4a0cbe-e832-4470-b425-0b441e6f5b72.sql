-- Create research programs table
CREATE TABLE public.research_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  university TEXT NOT NULL,
  description TEXT,
  program_type TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create deadlines table
CREATE TABLE public.program_deadlines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.research_programs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  deadline_date TIMESTAMP WITH TIME ZONE NOT NULL,
  deadline_type TEXT NOT NULL, -- 'application', 'project', 'interview', 'notification', etc.
  description TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create people table for knowledge graph
CREATE TABLE public.program_people (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.research_programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  linkedin_url TEXT,
  role TEXT, -- 'professor', 'researcher', 'contact', etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create links table for knowledge graph
CREATE TABLE public.program_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.research_programs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  link_type TEXT, -- 'website', 'application', 'research', 'documentation', etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.research_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_links ENABLE ROW LEVEL SECURITY;

-- Create policies for research_programs
CREATE POLICY "Users can view their own programs" 
ON public.research_programs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own programs" 
ON public.research_programs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own programs" 
ON public.research_programs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own programs" 
ON public.research_programs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for program_deadlines
CREATE POLICY "Users can view deadlines for their programs" 
ON public.program_deadlines 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.research_programs 
    WHERE id = program_deadlines.program_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create deadlines for their programs" 
ON public.program_deadlines 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.research_programs 
    WHERE id = program_deadlines.program_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update deadlines for their programs" 
ON public.program_deadlines 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.research_programs 
    WHERE id = program_deadlines.program_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete deadlines for their programs" 
ON public.program_deadlines 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.research_programs 
    WHERE id = program_deadlines.program_id AND user_id = auth.uid()
  )
);

-- Create policies for program_people
CREATE POLICY "Users can view people for their programs" 
ON public.program_people 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.research_programs 
    WHERE id = program_people.program_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create people for their programs" 
ON public.program_people 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.research_programs 
    WHERE id = program_people.program_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update people for their programs" 
ON public.program_people 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.research_programs 
    WHERE id = program_people.program_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete people for their programs" 
ON public.program_people 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.research_programs 
    WHERE id = program_people.program_id AND user_id = auth.uid()
  )
);

-- Create policies for program_links
CREATE POLICY "Users can view links for their programs" 
ON public.program_links 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.research_programs 
    WHERE id = program_links.program_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create links for their programs" 
ON public.program_links 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.research_programs 
    WHERE id = program_links.program_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update links for their programs" 
ON public.program_links 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.research_programs 
    WHERE id = program_links.program_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete links for their programs" 
ON public.program_links 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.research_programs 
    WHERE id = program_links.program_id AND user_id = auth.uid()
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_research_programs_updated_at
  BEFORE UPDATE ON public.research_programs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_research_programs_user_id ON public.research_programs(user_id);
CREATE INDEX idx_program_deadlines_program_id ON public.program_deadlines(program_id);
CREATE INDEX idx_program_deadlines_date ON public.program_deadlines(deadline_date);
CREATE INDEX idx_program_people_program_id ON public.program_people(program_id);
CREATE INDEX idx_program_links_program_id ON public.program_links(program_id);