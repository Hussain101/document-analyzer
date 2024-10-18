// app/api/embed/route.js

import { supabase } from '../../lib/supabaseClient';
import OpenAI from 'openai';

// Initialize the OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { content } = await request.json();

    // Log the content received from the request
    console.log('Received content:', content);

    if (!content) {
      console.log('No content received');
      return new Response(JSON.stringify({ error: 'Content is required' }), {
        status: 400,
      });
    }

    // Step 1: Generate embedding using OpenAI's correct method
    console.log('Generating embedding for content...');
    
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: content,
    });

    console.log('Embedding response:', embeddingResponse);

    // Extract the embedding from the response
    const embedding = embeddingResponse.data[0].embedding;

    // Log the embedding to ensure it's being retrieved correctly
    console.log('Generated embedding:', embedding);

    // Step 2: Store document and embedding in Supabase
    console.log('Inserting document and embedding into Supabase...');

    const { data, error } = await supabase
      .from('documents')
      .insert([{ content, embedding }]);

    if (error) {
      // Log the error if the Supabase insertion fails
      console.log('Supabase insertion error:', error);
      throw error;
    }

    // Log successful response from Supabase
    console.log('Document inserted successfully into Supabase:', data);

    return new Response(JSON.stringify({ message: 'Document embedded successfully' }), {
      status: 200,
    });
  } catch (error) {
    // Log the error to help diagnose issues
    console.log('Error in POST /api/embed:', error);

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
