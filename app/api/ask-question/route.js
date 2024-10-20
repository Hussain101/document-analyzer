import { supabase } from '../../lib/supabaseClient';
import OpenAI from 'openai';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export async function POST(request) {
  const { question } = await request.json();

  if (!question) {
    return new Response(JSON.stringify({ error: 'Question is required' }), {
      status: 400,
    });
  }

  try {
    // Step 1: Generate the embedding for the query using OpenAI
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: question,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Step 2: Perform a vector search in Supabase to find the most similar document
    const { data: documents, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      similarity_threshold: 0.8,  // Adjust threshold as needed
      match_count: 1,             // Retrieve only the most relevant document
    });

    if (error) {
      throw error;
    }

    const document = documents[0];

    // Step 3: Use OpenAI to generate the answer based on the document content
    const prompt = `Using the following document, answer the question: ${question}\n\nDocument: ${document.content}`;
    const completionResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
    });

    const answer = completionResponse.data.choices[0].message.content;
    console.log('Answer:', answer);

    return new Response(JSON.stringify({ answer }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
