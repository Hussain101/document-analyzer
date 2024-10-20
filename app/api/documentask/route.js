import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/app/lib/supabaseClient';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { query } = await request.json();
    console.log('Query received:', query);
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    console.log('Generating embedding for query...');
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Convert the embedding array to a string in the format Supabase expects
    const embeddingString = `[${queryEmbedding.join(',')}]`;

    console.log('Querying Supabase for similar documents...');
    const { data: documents, error } = await supabase.rpc('match_documents', {
      query_embedding: embeddingString,
      match_threshold: 0.78, // Adjust as needed
      match_count: 5, // Number of documents to return
    });

    if (error) {
      console.error('Error querying Supabase:', error);
      return NextResponse.json({ error: 'Failed to query documents' }, { status: 500 });
    }

    if (documents.length === 0) {
      return NextResponse.json({ answer: "I couldn't find any relevant information to answer your question." });
    }

    const contextText = documents.map(doc => doc.content).join('\n\n');

    console.log('Generating answer with OpenAI...');
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant. Use the following context to answer the user's question. If the answer is not in the context, say you don't know." },
        { role: "user", content: `Context: ${contextText}\n\nQuestion: ${query}` }
      ],
    });

    const answer = completion.choices[0].message.content;

    return NextResponse.json({ answer });

  } catch (error) {
    console.error('Error processing query:', error);
    return NextResponse.json({ error: 'An error occurred while processing your query' }, { status: 500 });
  }
}