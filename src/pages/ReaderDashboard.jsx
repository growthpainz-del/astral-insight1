import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import ReadingStage from "@/components/reading/ReadingStage";

const POLL_MS = 4000;

export default function ReaderDashboard() {
  const [readerProfile, setReaderProfile] = useState(null);
  const [incomingSessions, setIncomingSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [deckCards, setDeckCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [inviteLink, setInviteLink] = useState(null);

  // --- Load current user + Reader profile ---
  useEffect(() => {
    (async () => {
      const user = await base44.auth.me();
      const readers = await base44.entities.Reader.filter({ user_id: user.id });
      if (readers.length > 0) setReaderProfile(readers[0]);
      setLoading(false);
    })();
  }, []);

  // --- Load deck cards when a session becomes active ---
  useEffect(() => {
    if (!activeSession?.deck_id) return;
    (async () => {
      const cards = await base44.entities.Card.filter({
        deck_id: activeSession.deck_id,
      });
      setDeckCards(cards);
    })();
  }, [activeSession?.deck_id]);

  // --- Poll for waiting sessions + refresh active session ---
  const pollSessions = useCallback(async () => {
    if (!readerProfile) return;
    const waiting = await base44.entities.ReaderSession.filter({
      reader_id: readerProfile.id,
      status: "waiting",
    });
    setIncomingSessions(waiting);

    if (activeSession) {
      const refreshed = await base44.entities.ReaderSession.filter({
        id: activeSession.id,
      });
      if (refreshed.length > 0) setActiveSession(refreshed[0]);
    }
  }, [readerProfile, activeSession]);

  useEffect(() => {
    if (!readerProfile) return;
    pollSessions();
    const interval = setInterval(pollSessions, POLL_MS);
    return () => clearInterval(interval);
  }, [readerProfile, pollSessions]);

  // --- Toggle online/offline ---
  const toggleStatus = async () => {
    const newStatus = readerProfile.status === "online" ? "offline" : "online";
    await base44.entities.Reader.update(readerProfile.id, { status: newStatus });
    setReaderProfile({ ...readerProfile, status: newStatus });
  };

  // --- Create a session + shareable guest invite link ---
  const createInviteSession = async (deckId) => {
    const res = await base44.functions.invoke('createLiveRoom', {});
    if (!res.data?.roomUrl) {
      alert("Failed to create live room");
      return;
    }
    const session = await base44.entities.ReaderSession.create({
      reader_id: readerProfile.id,
      client_id: null,
      mode: "audio",
      status: "waiting",
      deck_id: deckId || null,
      card_positions: [],
      chat_messages: [],
      host_room_url: res.data.hostRoomUrl,
      room_url: res.data.roomUrl,
    });
    setInviteLink(`${window.location.origin}/join/${session.id}`);
  };

  // --- Accept an incoming session ---
  const acceptSession = async (session) => {
    const updates = {
      status: "active",
      started_at: new Date().toISOString(),
    };
    await base44.entities.ReaderSession.update(session.id, updates);
    setActiveSession({ ...session, ...updates });
    setIncomingSessions((prev) => prev.filter((s) => s.id !== session.id));
  };

  // --- Decline ---
  const declineSession = async (session) => {
    await base44.entities.ReaderSession.update(session.id, { status: "declined" });
    setIncomingSessions((prev) => prev.filter((s) => s.id !== session.id));
  };

  // --- End session ---
  const endSession = async () => {
    if (!activeSession) return;
    await base44.entities.ReaderSession.update(activeSession.id, {
      status: "ended",
      ended_at: new Date().toISOString(),
    });
    setActiveSession(null);
    setDeckCards([]);
  };

  // Chat logic removed in favor of live audio

  if (loading) {
    return (
      <div style={styles.centered}>
        <p style={styles.mutedText}>Loading your dashboard...</p>
      </div>
    );
  }

  if (!readerProfile) {
    return (
      <div style={styles.centered}>
        <p style={styles.mutedText}>
          No reader profile found for this account. Contact an admin to be set
          up as a professional reader.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Reader Dashboard</h1>
        <button
          onClick={toggleStatus}
          style={{
            ...styles.statusButton,
            backgroundColor:
              readerProfile.status === "online" ? "#7CFC9C" : "#444",
            color: readerProfile.status === "online" ? "#0b0b0b" : "#ccc",
          }}
        >
          {readerProfile.status === "online" ? "● Online" : "○ Offline"}
        </button>
      </div>

      {activeSession ? (
        <div style={styles.sessionPanel}>
          <div style={styles.sessionHeader}>
            <span style={styles.mutedText}>
              Live session with{" "}
              {activeSession.guest_name || "client"}
            </span>
            <button onClick={endSession} style={styles.endButton}>
              End Session
            </button>
          </div>

          <ReadingStage
            session={activeSession}
            interactive={true}
            deckCards={deckCards}
          />

          {activeSession.host_room_url && (
            <div style={styles.audioPanel}>
              <iframe
                src={`${activeSession.host_room_url}?embed=true&audio=on&video=off&background=off`}
                allow="camera; microphone; fullscreen; speaker; display-capture"
                style={styles.iframe}
              />
            </div>
          )}
        </div>
      ) : (
        <div style={styles.queueSection}>
          <div style={styles.inviteBlock}>
            <button
              onClick={() => createInviteSession(null)}
              style={styles.inviteButton}
            >
              + Create Invite Link
            </button>
            {inviteLink && (
              <div style={styles.inviteLinkRow}>
                <input readOnly value={inviteLink} style={styles.inviteInput} />
                <button
                  onClick={() => navigator.clipboard.writeText(inviteLink)}
                  style={styles.copyButton}
                >
                  Copy
                </button>
              </div>
            )}
          </div>

          <h2 style={styles.subtitle}>Incoming Requests</h2>
          {incomingSessions.length === 0 ? (
            <p style={styles.mutedText}>
              {readerProfile.status === "online"
                ? "No requests right now. You'll see them here as clients connect."
                : "You're offline. Go online to start receiving requests."}
            </p>
          ) : (
            incomingSessions.map((session) => (
              <div key={session.id} style={styles.requestCard}>
                <span>
                  💬 {session.guest_name || "Client"} —{" "}
                  {session.guest_name ? "joined via invite link" : "new request"}
                </span>
                <div style={styles.requestButtons}>
                  <button
                    onClick={() => acceptSession(session)}
                    style={styles.acceptButton}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => declineSession(session)}
                    style={styles.declineButton}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "20px",
    background: "radial-gradient(circle at top, #1a0f2e, #0b0614)",
    color: "#f0e6ff",
  },
  centered: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0b0614",
    padding: "20px",
    textAlign: "center",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  title: { fontSize: "22px", fontWeight: 700, color: "#FFD700" },
  subtitle: {
    fontSize: "16px",
    fontWeight: 600,
    margin: "18px 0 10px",
    color: "#e0c8ff",
  },
  statusButton: {
    padding: "8px 16px",
    borderRadius: "999px",
    border: "none",
    fontWeight: 600,
    fontSize: "14px",
  },
  mutedText: { color: "#a893c9", fontSize: "14px" },
  queueSection: { display: "flex", flexDirection: "column", gap: "10px" },
  inviteBlock: { display: "flex", flexDirection: "column", gap: "8px" },
  inviteButton: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px dashed #FFD700",
    background: "rgba(255,215,0,0.08)",
    color: "#FFD700",
    fontWeight: 600,
  },
  inviteLinkRow: { display: "flex", gap: "8px" },
  inviteInput: {
    flex: 1,
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #5B2A86",
    background: "rgba(91,42,134,0.15)",
    color: "#fff",
    fontSize: "12px",
  },
  copyButton: {
    padding: "0 16px",
    borderRadius: "8px",
    border: "none",
    background: "#FFD700",
    color: "#0b0b0b",
    fontWeight: 700,
  },
  requestCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid #5B2A86",
    background: "rgba(91,42,134,0.15)",
  },
  requestButtons: { display: "flex", gap: "8px" },
  acceptButton: {
    background: "#7CFC9C",
    color: "#0b0b0b",
    border: "none",
    borderRadius: "8px",
    padding: "6px 12px",
    fontWeight: 600,
  },
  declineButton: {
    background: "transparent",
    color: "#ff8080",
    border: "1px solid #ff8080",
    borderRadius: "8px",
    padding: "6px 12px",
  },
  sessionPanel: { display: "flex", flexDirection: "column", gap: "12px" },
  sessionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  endButton: {
    background: "#ff4d4d",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "8px 14px",
    fontWeight: 600,
  },
  audioPanel: {
    height: "120px",
    border: "1px solid #5B2A86",
    borderRadius: "12px",
    overflow: "hidden",
    marginTop: "auto",
    background: "#0a0618",
  },
  iframe: {
    width: "100%",
    height: "100%",
    border: "none",
  },
};