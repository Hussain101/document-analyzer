import { supabase } from '../../lib/supabaseClient';
import OpenAI from 'openai';
import pdf from 'pdf-parse';   // For parsing PDF files
import mammoth from 'mammoth'; // For parsing DOCX files

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    console.log('Received request to upload document');

    const formData = await request.formData();
    const file = formData.get('file');  // Get the file from the FormData

    if (!file) {
      console.log('No file uploaded');
      return new Response(JSON.stringify({ error: 'No file uploaded' }), {
        status: 400,
      });
    }

    console.log('File received:', file.name);

    // Get file type and extract content accordingly
    let content = '';

    if (file.name.endsWith('.pdf')) {
      console.log('Processing PDF file...');
      const buffer = await file.arrayBuffer();  // Get the buffer from the uploaded PDF
      const data = await pdf(Buffer.from(buffer));
      content = data.text;  // Extracted text from PDF
      console.log('PDF text extracted successfully');
    } else if (file.name.endsWith('.docx')) {
      console.log('Processing DOCX file...');
      const arrayBuffer = await file.arrayBuffer();  // Get the buffer for DOCX
      const result = await mammoth.extractRawText({ arrayBuffer });
      content = result.value;  // Extracted text from DOCX
      console.log('DOCX text extracted successfully');
    } else if (file.name.endsWith('.txt')) {
      console.log('Processing TXT file...');
      const text = await file.text();  // For plain text files
      content = text;
      console.log('TXT text extracted successfully');
    } else {
      console.log('Unsupported file format:', file.name);
      return new Response(JSON.stringify({ error: 'Unsupported file format' }), {
        status: 400,
      });
    }

    // Ensure content was extracted
    if (!content) {
      console.log('No content extracted from file');
      return new Response(JSON.stringify({ error: 'Unable to extract text from file' }), {
        status: 400,
      });
    }

    console.log('Text content extracted:', content.slice(0, 100), '...'); // Log the first 100 characters for reference

    // Step 1: Generate the embedding for the document using OpenAI
    console.log('Generating embedding with OpenAI...');
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: content,
    });

    const embedding = embeddingResponse.data[0].embedding;

    console.log('Embedding generated successfully:', embedding.slice(0, 10), '...'); // Log part of the embedding for reference

    // Step 2: Store document and embedding in Supabase
    console.log('Inserting document and embedding into Supabase...');
    const { data, error } = await supabase
      .from('documents')
      .insert([{ content, embedding }]);

    if (error) {
      console.log('Error inserting into Supabase:', error);
      throw error;
    }

    console.log('Document and embedding successfully stored in Supabase');
    
    return new Response(JSON.stringify({ message: 'Document uploaded successfully' }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
