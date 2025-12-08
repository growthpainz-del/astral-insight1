
import React, { useState } from "react";
import { BookOpen, Clipboard, Check } from "lucide-react"; // Only keeping icons used by CodeBlock and the new ManualGuide

const CodeBlock = ({ children }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    // Ensure children is treated as a string for clipboard operations
    const textToCopy = typeof children === 'string' ? children.trim() : '';

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }).catch(err => {
        console.error("Failed to copy text: ", err);
        // Optionally, add a user notification for copy failure
      });
    }
  };

  return (
    <div className="relative group my-4">
      <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto text-sm text-gray-300 border border-gray-700 pr-12">
        <code>{children}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 rounded-lg bg-gray-700/80 text-gray-400 hover:bg-gray-600/80 hover:text-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Copy code to clipboard"
        title="Copy to clipboard"
      >
        {isCopied ? <Check className="h-4 w-4 text-green-400" /> : <Clipboard className="h-4 w-4" />}
      </button>
    </div>
  );
};

export default function ManualGuide() {
  // Dummy state for demonstration purposes, as the outline implies dynamic content.
  // In a real application, these would be managed by context, props, or fetched data.
  const [selectedDeck, setSelectedDeck] = useState({ name: "Sample Deck Name" }); 
  const [manualFiles, setManualFiles] = useState([
    { id: "intro", name: "Introduction to Readings" },
    { id: "spreads", name: "Advanced Spread Techniques" },
  ]);

  return (
    <div className="text-gray-300 p-4 rounded-lg bg-gray-900/50 border border-gray-800 space-y-6">
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-blue-300 mb-4 flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          Reading Manuals - Learn to Read Without AI
        </h2>
        <p className="text-white/80 mb-4">
          Manuals are comprehensive guides that teach you how to interpret cards and perform readings 
          <strong> without relying on AI assistance</strong>. They contain card meanings, spreads, 
          and interpretation techniques specific to each deck.
        </p>
        <div className="bg-blue-500/10 border-l-4 border-blue-400 pl-4 py-2 text-blue-200">
          <p className="font-semibold mb-1">Why learn manual reading?</p>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>Develop your own intuitive connection with the cards</li>
            <li>Build confidence in your interpretation skills</li>
            <li>Understand the traditional meanings and symbolism</li>
            <li>Read anywhere, anytime - no tokens needed</li>
          </ul>
        </div>
      </div>

      {/* This section would typically include a deck selector */}
      {/* For this example, we're assuming a deck is already selected */}

      {selectedDeck && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">
            Manual Reading Guide for {selectedDeck.name}
          </h3>
          
          {/* Manual files display */}
          {manualFiles?.length > 0 ? (
            <div className="mt-4">
              <h4 className="text-lg font-semibold text-white/90 mb-2">Available Manual Files:</h4>
              <ul className="list-disc list-inside text-white/70 pl-4">
                {manualFiles.map(file => (
                  <li key={file.id} className="py-1 cursor-pointer hover:text-white transition-colors duration-200">{file.name}</li>
                ))}
              </ul>
              <p className="text-sm text-white/60 mt-4">
                Click on a manual file above to view its content. This section would dynamically load and display manual content for {selectedDeck.name}.
              </p>
            </div>
          ) : null}


          {!manualFiles?.length && (
            <div className="text-center py-8 text-white/60">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No manual reading guide available for this deck yet.</p>
              <p className="text-sm mt-2">Check back later or contact the deck creator.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
