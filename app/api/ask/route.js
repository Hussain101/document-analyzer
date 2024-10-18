// app/api/ask/route.js
import { supabase } from '../../lib/supabaseClient';
import OpenAI from 'openai';

// Initialize the OpenAI API client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    console.log('Received request for /api/ask');

    const { query } = await request.json();
    console.log('Query received:', query);

    if (!query) {
      console.log('No query provided');
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
      });
    }

    // Step 1: Generate the query embedding using OpenAI's correct method
    console.log('Generating embedding for query...');
    
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query,
    });
    console.log('Embedding response received:', embeddingResponse);

    const queryEmbedding = embeddingResponse.data[0].embedding;
    console.log('Query embedding:', queryEmbedding);

    // Step 2: Perform a vector search in Supabase to find the most similar document
    console.log('Querying Supabase for matching documents...');
    
    const { data: documents, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      similarity_threshold: 0.8,
      match_count: 1,
    });

    if (error) {
      console.log('Error querying Supabase:', error);
      throw error;
    }

    console.log('Documents returned from Supabase:', documents);

    if (documents.length === 0) {
      console.log('No matching documents found');
      return new Response(JSON.stringify({ error: 'No matching documents found' }), {
        status: 404,
      });
    }

    const document = documents[0];
    console.log('Matching document:', document);

    // Step 3: Generate the answer using the document content and OpenAI's model
    const prompt = `Using the following document, answer the question: ${query}\n\nDocument: ${document.doc_content}`;
    console.log('Generating completion with prompt:', prompt);

    const completionResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
    });

    // Log the entire response to debug the structure
    console.log('Completion response from OpenAI:', JSON.stringify(completionResponse, null, 2));

    // Since choices is directly in completionResponse, access it directly
    const choices = completionResponse.choices;
    if (choices && choices.length > 0 && choices[0].message && choices[0].message.content) {
      const answer = choices[0].message.content;
      console.log('Final answer:', answer);

      return new Response(JSON.stringify({ answer }), { status: 200 });
    } else {
      console.log('Unexpected completion response structure:', JSON.stringify(completionResponse, null, 2));
      return new Response(JSON.stringify({ error: 'Unexpected response structure from OpenAI' }), { status: 500 });
    }

  } catch (error) {
    console.log('Error in /api/ask:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
