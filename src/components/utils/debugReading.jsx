// Temporary debug component to test Reading page
import React from 'react';

export default function DebugReading() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Reading Page</h1>
      <p>If you can see this, the basic React rendering works.</p>
      <p>Checking URL params:</p>
      <pre className="bg-gray-100 p-4 rounded mt-2">
        {JSON.stringify(Object.fromEntries(new URLSearchParams(window.location.search)), null, 2)}
      </pre>
    </div>
  );
}