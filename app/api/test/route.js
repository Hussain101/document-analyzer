import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import OpenAI from 'openai';
import { supabase } from '@/app/lib/supabaseClient';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}); 

export async function POST(request) {
  console.log('Attempting to parse form data');
  const formData = await request.formData();
  const file = formData.get('file');
  if (file) {
    console.log('Received file:', file.name);
    // You can now process the file or perform other operations
  } else {
    console.log('No file found in form data');
    return NextResponse.json({ message: 'No file found in form data' }, { status: 400 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    console.log('Buffer received:', arrayBuffer);
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    console.log('PDF document loaded');
    let content = '';

    for (let i = 0; i < pdfDoc.getPageCount(); i++) {
      const page = pdfDoc.getPages()[i];
      // Note: pdf-lib doesn't have a direct method to extract text
      // You might need to use a different library for text extraction
      content += `Page ${i + 1} content placeholder`;
    }
    console.log('Text content extracted:', content.slice(0, 100), '...');
    const maxLength = 8000; // Adjust based on OpenAI's token limit
        const truncatedContent = content.slice(0, maxLength);
    
        console.log('Generating embedding with OpenAI...');
        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: truncatedContent,
        });
        console.log('Embedding generated:', embeddingResponse);
        const embedding = embeddingResponse.data[0].embedding;

        console.log('Embedding generated successfully:', embedding.slice(0, 10), '...');

        console.log('Inserting document and embedding into Supabase...');
        const { data, error } = await supabase
      .from('documents')
      .insert([{ 
        content: truncatedContent, 
        embedding,
        file_name: file.name,
        file_type: file.type
      }]).select('*');
      console.log('Data inserted into Supabase:', data);
      console.log('Supabase Error:', error);
    return NextResponse.json({ message: 'Data received successfully', content });

  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json({ message: 'An error occurred', error: error.message }, { status: 500 });
  }
}
