import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export async function POST(request) {
  console.log('Received POST request to /api/upload-document');
  const formData = await request.formData();
  console.log(formData,"formData");
  
  return NextResponse.json(
    { error: 'Failed to process request' },
    { status: 500 }
  );
}