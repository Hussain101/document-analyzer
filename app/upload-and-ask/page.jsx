'use client';

import axios from 'axios';
import { useState } from 'react';

export default function UploadAndAskPage() {
  const [file, setFile] = useState(null);  // For file upload
  const [uploaded, setUploaded] = useState(false);
  const [message, setMessage] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  async function handleUpload(e) {
    e.preventDefault();

    if (!file) {
      setMessage('Please upload a document first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);  // Add file to FormData

    // Upload the document
    const response = await axios.post('http://localhost:3000/api/test', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const result = await response.json();
    if (response.ok) {
      setUploaded(true);
      setMessage('Document uploaded successfully. Now you can ask questions.');
    } else {
      setMessage(result.error);
    }
  }

  async function handleAskQuestion(e) {
    e.preventDefault();

    if (!uploaded) {
      setMessage('Please upload a document first.');
      return;
    }

    const response = await fetch('/api/ask-question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    });

    const result = await response.json();
    if (response.ok) {
      setAnswer(result.answer);
    } else {
      setMessage(result.error);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-100 p-4">
      <div className="bg-blue-900 p-6 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">Upload Document and Ask Questions</h1>

        {/* Upload Form */}
        <form onSubmit={handleUpload}>
          <input
            type="file"
            accept=".pdf,.txt,.docx"  // Accept only relevant document formats
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors duration-300"
          >
            Upload Document
          </button>
        </form>

        {/* Show message after upload */}
        {message && <p className="mt-4 text-center text-gray-600">{message}</p>}

        {/* Question Form (only show if document uploaded) */}
        {uploaded && (
          <form onSubmit={handleAskQuestion} className="mt-6">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about the document"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <button
              type="submit"
              className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600 transition-colors duration-300"
            >
              Ask Question
            </button>
          </form>
        )}

        {/* Show answer after question */}
        {answer && <p className="mt-4 text-center text-gray-600">Answer: {answer}</p>}
      </div>
    </div>
  );
}
