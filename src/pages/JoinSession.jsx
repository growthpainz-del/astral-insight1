import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import ReadingStage from "@/components/reading/ReadingStage";

const POLL_MS = 3000;

export default function JoinSession() {
  const { sessionId } = useParams();

  const [session, setSession] = useState(null);
  const [reader, setReader] = useState(null);
  const [deckCards, setDeckCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [guestName, setGuestName] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const [chatInput, setChatInput] = useState("");

  // --- Load session + reader on mount ---
  useEffect(() => {
    if (!sessionId) {
      setError("This link is missing a session ID.");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const results = await base44.entities.ReaderSession.filter({
          id: sessionId,
        });
        if (results.length === 0) {
          setError("This session doesn't exist or has expired.");
          setLoading(false);
          return;
        }
        const found = results[0];
        setSession(found);

        const readers = await base44.entities.Reader.filter({
          id: found.reader_id,
        });
        if (readers.length > 0) setReader(readers[0]);

        setLoading(false);
      } catch (e) {
        setError("Couldn't load this session. The link may be invalid.");
        setLoading(false);
      }
    })();
  }, [sessionId]);

  // --- Load deck cards when session has a deck ---
  useEffect(() => {
    if (!session?.deck_id) return;
    (async () => {
      const cards = await base44.entities.Card.filter({
        deck_id: session.deck_id,
      });
      setDeckCards(cards);
    })();
  }, [session?.deck_id]);

  // --- Poll session state once joined (mirrors reader's actions) ---
  useEffect(() => {
    if (!hasJoined || !sessionId) return;
    const interval = setInterval(async () => {
      const results = await base44.entities.ReaderSession.filter({
        id: sessionId,
      });
      if (results.length > 0) setSession(results[0]);
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [hasJoined, sessionId]);

  // --- Guest enters their name to join ---
  const handleJoin = async () => {
    if (!guestName.trim()) return;
    await base44.entities.ReaderSession.update(session.id, {
      guest_name: guestName.trim(),
    });
    setSession({ ...session, guest_name: guestName.trim() });
    setHasJoined(true);
  };

  // --- Guest sends a chat message ---
  const sendChatMessage = async () => {
    if (!chatInput.trim() || !session) return;
    const messages = session.chat_messages || [];
    const newMessages = [
      ...messages,
      {
        sender: "client",
        text: chatInput.trim(),
        timestamp: new Date().toISOString(),
      },
    ];
    await base44.entities.ReaderSession.update(session.id, {
      chat_messages: newMessages,
    });
    setSession({ ...session, chat_messages: newMessages });
    setChatInput("");
  };

  if (loading) {
    return (
      <div style={styles.centered}>
        <p style={styles.mutedText}>Loading your session...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.centered}>
        <p style={styles.errorText}>{error}</p>
      </div>
    );
  }

  // --- Name entry gate (no login required) ---
  if (!hasJoined) {
    return (
      <div style={styles.centered}>
        <div style={styles.joinCard}>
          <h1 style={styles.title}>
            {reader?.display_name
              ? `Join ${reader.display_name}'s reading`
              : "Join your reading"}
          </h1>
          <p style={styles.mutedText}>
            No account needed — just enter a name so your reader knows who's
            joined.
          </p>
          <input
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            placeholder="Your name"
            style={styles.nameInput}
            autoFocus
          />
          <button
            onClick={handleJoin}
            style={styles.joinButton}
            disabled={!guestName.trim()}
          >
            Enter Session
          </button>
        </div>
      </div>
    );
  }

  // --- Waiting room ---
  if (session.status === "waiting") {
    return (
      <div style={styles.centered}>
        <p style={styles.mutedText}>
          You're in the waiting room —{" "}
          {reader?.display_name ? reader.display_name : "your reader"} will be with you
          shortly.
        </p>
      </div>
    );
  }

  // --- Ended ---
  if (session.status === "ended") {
    return (
      <div style={styles.centered}>
        <p style={styles.mutedText}>
          This reading has ended. Thank you for joining.
        </p>
      </div>
    );
  }

  // --- Active session: mirrored card table + chat ---
  return (
    <div style={styles.page}>
      <div style={styles.sessionHeader}>
        <span style={styles.mutedText}>
          Reading with {reader?.display_name ? reader.display_name : "your reader"}
        </span>
      </div>

      <ReadingStage session={session} interactive={false} deckCards={deckCards} />

      <div style={styles.chatPanel}>
        <div style={styles.chatMessages}>
          {(session.chat_messages || []).map((msg, i) => (
            <div
              key={i}
              style={{
                ...styles.chatBubble,
                alignSelf: msg.sender === "client" ? "flex-end" : "flex-start",
                backgroundColor:
                  msg.sender === "client" ? "#5B2A86" : "#2a2a3a",
              }}
            >
              {msg.text}
            </div>
          ))}
        </div>
        <div style={styles.chatInputRow}>
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
            placeholder="Type a message..."
            style={styles.chatInput}
          />
          <button onClick={sendChatMessage} style={styles.sendButton}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "20px",
    background: "radial-gradient(circle at top, #1a0f2e, #0b0614)",
    color: "#f0e6ff",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  centered: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "radial-gradient(circle at top, #1a0f2e, #0b0614)",
    padding: "20px",
    textAlign: "center",
  },
  joinCard: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    maxWidth: "360px",
    width: "100%",
  },
  title: { fontSize: "20px", fontWeight: 700, color: "#FFD700" },
  mutedText: { color: "#a893c9", fontSize: "14px" },
  errorText: { color: "#ff8080", fontSize: "15px" },
  nameInput: {
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #5B2A86",
    background: "rgba(91,42,134,0.15)",
    color: "#fff",
    fontSize: "15px",
    outline: "none",
  },
  joinButton: {
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    background: "#FFD700",
    color: "#0b0b0b",
    fontWeight: 700,
    fontSize: "15px",
  },
  sessionHeader: { marginBottom: "2px" },
  chatPanel: {
    height: "28vh",
    display: "flex",
    flexDirection: "column",
    border: "1px solid #5B2A86",
    borderRadius: "12px",
    overflow: "hidden",
  },
  chatMessages: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "12px",
    overflowY: "auto",
  },
  chatBubble: {
    maxWidth: "75%",
    padding: "8px 12px",
    borderRadius: "12px",
    fontSize: "14px",
  },
  chatInputRow: { display: "flex", borderTop: "1px solid #5B2A86" },
  chatInput: {
    flex: 1,
    padding: "12px",
    background: "transparent",
    border: "none",
    color: "#fff",
    outline: "none",
  },
  sendButton: {
    padding: "0 20px",
    background: "#FFD700",
    color: "#0b0b0b",
    border: "none",
    fontWeight: 700,
  },
};