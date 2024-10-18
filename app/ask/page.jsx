// app/ask/page.js

'use client';

import { useState } from 'react';

export default function AskPage() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();

    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const result = await response.json();
    setAnswer(result.answer || result.error);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 p-4">
      <div className="bg-blue-900 p-6 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">Ask a Question</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question about your document"
            className="w-full text-black p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors duration-300"
          >
            Ask
          </button>
        </form>
        {answer && <p className="mt-4 text-center text-white">{answer}</p>}
      </div>
    </div>
  );
}
