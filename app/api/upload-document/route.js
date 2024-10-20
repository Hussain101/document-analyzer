import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

// Initialize Supabase client
// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
// );

// // Initialize OpenAI
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY, // Remove NEXT_PUBLIC_ prefix
// });

// export async function POST(request) {
//   console.log('Received request to upload document');
//   try {
//     const formData = await request.formData();
//     const file = formData.get('file');

//     if (!file) {
//       console.log('No file uploaded');
//       return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
//     }

//     console.log('File received:', file.name);

//     let content = '';

//     if (file.name.endsWith('.pdf')) {
//       console.log('Processing PDF file...');
//       const buffer = await file.arrayBuffer();
//       const data = await pdf(Buffer.from(buffer));
//       content = data.text;
//       console.log('PDF text extracted successfully');
//     } else if (file.name.endsWith('.docx')) {
//       console.log('Processing DOCX file...');
//       const arrayBuffer = await file.arrayBuffer();
//       const result = await mammoth.extractRawText({ arrayBuffer });
//       content = result.value;
//       console.log('DOCX text extracted successfully');
//     } else if (file.name.endsWith('.txt')) {
//       console.log('Processing TXT file...');
//       content = await file.text();
//       console.log('TXT text extracted successfully');
//     } else {
//       console.log('Unsupported file format:', file.name);
//       return NextResponse.json({ error: 'Unsupported file format' }, { status: 400 });
//     }

//     if (!content) {
//       console.log('No content extracted from file');
//       return NextResponse.json({ error: 'Unable to extract text from file' }, { status: 400 });
//     }

//     console.log('Text content extracted:', content.slice(0, 100), '...');

//     // Truncate content if it's too long for embedding
//     const maxLength = 8000; // Adjust based on OpenAI's token limit
//     const truncatedContent = content.slice(0, maxLength);

//     console.log('Generating embedding with OpenAI...');
//     const embeddingResponse = await openai.embeddings.create({
//       model: 'text-embedding-ada-002',
//       input: truncatedContent,
//     });

//     const embedding = embeddingResponse.data[0].embedding;

//     console.log('Embedding generated successfully:', embedding.slice(0, 10), '...');

//     console.log('Inserting document and embedding into Supabase...');
//     const { data, error } = await supabase
//       .from('documents')
//       .insert([{ 
//         content: truncatedContent, 
//         embedding,
//         file_name: file.name,
//         file_type: file.type
//       }]);

//     if (error) {
//       console.log('Error inserting into Supabase:', error);
//       throw error;
//     }

//     console.log('Document and embedding successfully stored in Supabase');
    
//     return NextResponse.json({ message: 'Document uploaded successfully' }, { status: 200 });
//   } catch (error) {
//     console.error('Error uploading document:', error);
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }


export async function POST(request) {
  console.log('Received POST request to /api/upload-document');
  
  try {
    // Attempt to parse the request body
    const body = await request.json();
    
    // Log the received data
    console.log('Received data:', body);

    // Return a success response
    return NextResponse.json(
      { message: 'POST request received successfully', data: body },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    
    // If there's an error parsing JSON, it might be form data
    if (error instanceof SyntaxError) {
      try {
        const formData = await request.formData();
        const file = formData.get('file');
        
        if (file) {
          console.log('Received file:', file.name);
          return NextResponse.json(
            { message: 'File received successfully', fileName: file.name },
            { status: 200 }
          );
        } else {
          return NextResponse.json(
            { message: 'No file found in form data' },
            { status: 400 }
          );
        }
      } catch (formError) {
        console.error('Error processing form data:', formError);
      }
    }

    // Return an error response
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}