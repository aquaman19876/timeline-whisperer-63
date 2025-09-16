import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId } = await req.json();

    if (!message || !userId) {
      throw new Error('Message and userId are required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Processing message for program extraction:', message);

    // System prompt for extracting research program information
    const systemPrompt = `You are a research program data extraction specialist. Extract structured information from the user's message about research programs, deadlines, people, and links.

Return a JSON object with this exact structure:
{
  "programs": [
    {
      "title": "Program name",
      "university": "University name",
      "description": "Brief description",
      "program_type": "PhD/Masters/Fellowship/etc",
      "status": "active"
    }
  ],
  "deadlines": [
    {
      "title": "Deadline name",
      "deadline_date": "ISO date string",
      "deadline_type": "application/project/interview/notification",
      "description": "Description if any",
      "program_title": "Associated program title"
    }
  ],
  "people": [
    {
      "name": "Person name",
      "description": "Their role/description",
      "linkedin_url": "LinkedIn URL if provided",
      "role": "professor/researcher/contact/advisor",
      "program_title": "Associated program title"
    }
  ],
  "links": [
    {
      "title": "Link title",
      "url": "URL",
      "description": "Description",
      "link_type": "website/application/research/documentation",
      "program_title": "Associated program title"
    }
  ]
}

If no relevant information is found for a category, return an empty array. Always ensure dates are in ISO format.`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error('Failed to process message');
    }

    const aiResponse = await response.json();
    const extractedData = JSON.parse(aiResponse.choices[0].message.content);
    
    console.log('Extracted data:', extractedData);

    // Store the extracted data in the database
    const results = {
      programs: [],
      deadlines: [],
      people: [],
      links: [],
      rawResponse: aiResponse.choices[0].message.content
    };

    // Insert programs first
    for (const program of extractedData.programs || []) {
      const { data: programData, error: programError } = await supabase
        .from('research_programs')
        .insert({
          user_id: userId,
          title: program.title,
          university: program.university,
          description: program.description,
          program_type: program.program_type,
          status: program.status || 'active'
        })
        .select()
        .single();

      if (programError) {
        console.error('Error inserting program:', programError);
        continue;
      }

      results.programs.push(programData);

      // Insert associated deadlines
      for (const deadline of extractedData.deadlines || []) {
        if (deadline.program_title === program.title) {
          const { data: deadlineData, error: deadlineError } = await supabase
            .from('program_deadlines')
            .insert({
              program_id: programData.id,
              title: deadline.title,
              deadline_date: deadline.deadline_date,
              deadline_type: deadline.deadline_type,
              description: deadline.description,
            })
            .select()
            .single();

          if (!deadlineError) {
            results.deadlines.push(deadlineData);
          }
        }
      }

      // Insert associated people
      for (const person of extractedData.people || []) {
        if (person.program_title === program.title) {
          const { data: personData, error: personError } = await supabase
            .from('program_people')
            .insert({
              program_id: programData.id,
              name: person.name,
              description: person.description,
              linkedin_url: person.linkedin_url,
              role: person.role,
            })
            .select()
            .single();

          if (!personError) {
            results.people.push(personData);
          }
        }
      }

      // Insert associated links
      for (const link of extractedData.links || []) {
        if (link.program_title === program.title) {
          const { data: linkData, error: linkError } = await supabase
            .from('program_links')
            .insert({
              program_id: programData.id,
              title: link.title,
              url: link.url,
              description: link.description,
              link_type: link.link_type,
            })
            .select()
            .single();

          if (!linkError) {
            results.links.push(linkData);
          }
        }
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-program-data function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});