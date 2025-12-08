
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Deck, User } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  FileText,
  User as UserIcon,
  Calendar,
  Mail // NEW: Import Mail icon
} from "lucide-react";

export default function AdminDeckReview() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [approving, setApproving] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [testingEmail, setTestingEmail] = useState(false); // NEW

  useEffect(() => {
    User.me().then(setUser).catch(() => setUser(null));
    loadDecks();
  }, []);

  const loadDecks = async () => {
    setLoading(true);
    setError("");
    try {
      const allDecks = await Deck.list("-submission_date", 200);
      setDecks(allDecks || []);
    } catch (err) {
      setError("Failed to load decks: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const approveDeck = async (deck) => {
    if (!confirm(`Approve "${deck.name}" for publication?`)) return;
    
    setApproving(deck.id);
    setError("");
    
    try {
      // Call backend function to approve deck and send email
      const response = await base44.functions.invoke('adminDeckAction', {
        deckId: deck.id,
        action: 'approve'
      });

      if (response.data?.success) {
        console.log(`✅ Deck approved: ${response.data.message}`);
      } else {
        // Handle cases where the backend function might return success: false but not throw an error
        console.error(`❌ Backend reported failure for approval: ${response.data?.message || 'Unknown reason'}`);
        setError("Failed to approve deck: " + (response.data?.message || "Unknown error from backend"));
        setApproving(null); // Ensure loading state is cleared
        return; // Exit if backend indicated failure
      }

      await loadDecks();
    } catch (error) {
      console.error("Failed to approve deck:", error);
      setError("Failed to approve deck: " + (error.message || "Unknown error"));
    } finally {
      setApproving(null);
    }
  };

  const rejectDeck = async (deck) => {
    const reason = prompt(`Why are you rejecting "${deck.name}"? (This will be sent to the creator)`);
    if (!reason) return;
    
    setRejecting(deck.id);
    setError("");
    
    try {
      // Call backend function to reject deck and send email
      const response = await base44.functions.invoke('adminDeckAction', {
        deckId: deck.id,
        action: 'reject',
        reason: reason
      });

      if (response.data?.success) {
        console.log(`✅ Deck rejected: ${response.data.message}`);
      } else {
        // Handle cases where the backend function might return success: false but not throw an error
        console.error(`❌ Backend reported failure for rejection: ${response.data?.message || 'Unknown reason'}`);
        setError("Failed to reject deck: " + (response.data?.message || "Unknown error from backend"));
        setRejecting(null); // Ensure loading state is cleared
        return; // Exit if backend indicated failure
      }

      await loadDecks();
    } catch (error) {
      console.error("Failed to reject deck:", error);
      setError("Failed to reject deck: " + (error.message || "Unknown error"));
    } finally {
      setRejecting(null);
    }
  };

  // NEW: Test email functionality
  const sendTestEmail = async () => {
    const testEmail = prompt("Enter email address to send test notification to:", user?.email);
    if (!testEmail) return;

    setTestingEmail(true);
    setError("");

    try {
      await base44.integrations.Core.SendEmail({
        to: testEmail,
        subject: "🧪 Test Email - Astral Insight Publishing System",
        body: `This is a test email from the Astral Insight publishing system.

Your email notifications are working correctly! ✅

When deck approvals/rejections happen, creators will receive emails like this one with:
- Subject: Relevant status update
- Body: Full details about the action
- Links: Direct links to view their decks
- Next steps: Clear instructions on what to do

Test Details:
- Sent by: ${user?.email}
- Sent at: ${new Date().toLocaleString()}
- Test successful: Yes

If you received this email, everything is configured correctly!

Best regards,
The Astral Insight Team`
      });

      alert(`✅ Test email sent successfully to ${testEmail}!\n\nCheck the inbox (and spam folder) to confirm delivery.`);
    } catch (err) {
      console.error("Failed to send test email:", err);
      setError("Failed to send test email: " + (err.message || "Unknown error"));
    } finally {
      setTestingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  const pendingDecks = decks.filter(d => d.publish_status === "pending_review");
  const publishedDecks = decks.filter(d => d.publish_status === "published");
  const rejectedDecks = decks.filter(d => d.publish_status === "rejected");
  const draftDecks = decks.filter(d => !d.publish_status || d.publish_status === "draft");

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-2">
          Deck Review Queue
        </h1>
        <p className="text-white/70">Review and approve decks submitted by creators</p>
      </div>

      {/* NEW: Test Email Button */}
      <div className="mb-6 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold mb-1">Test Email Notifications</h3>
          <p className="text-white/60 text-sm">
            Send a test email to verify that approval/rejection notifications are working
          </p>
        </div>
        <Button
          onClick={sendTestEmail}
          disabled={testingEmail}
          variant="outline"
          className="border-blue-500/40 text-blue-300 hover:bg-blue-900/30"
        >
          {testingEmail ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4 mr-2" />
              Send Test Email
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert className="mb-6 bg-red-900/20 border-red-500/40 text-red-200">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-amber-900/20 border-amber-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Pending Review</p>
                <p className="text-3xl font-bold text-white">{pendingDecks.length}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-900/20 border-green-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Published</p>
                <p className="text-3xl font-bold text-white">{publishedDecks.length}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-900/20 border-red-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Rejected</p>
                <p className="text-3xl font-bold text-white">{rejectedDecks.length}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/20 border-slate-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Drafts</p>
                <p className="text-3xl font-bold text-white">{draftDecks.length}</p>
              </div>
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Review Section */}
      {pendingDecks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-400" />
            Pending Review ({pendingDecks.length})
          </h2>
          <div className="space-y-4">
            {pendingDecks.map(deck => (
              <DeckReviewCard 
                key={deck.id} 
                deck={deck} 
                onApprove={approveDeck}
                onReject={rejectDeck}
                approving={approving === deck.id}
                rejecting={rejecting === deck.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Published Section */}
      {publishedDecks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            Published ({publishedDecks.length})
          </h2>
          <div className="space-y-4">
            {publishedDecks.slice(0, 5).map(deck => (
              <DeckReviewCard key={deck.id} deck={deck} readOnly />
            ))}
          </div>
        </div>
      )}

      {/* Rejected Section */}
      {rejectedDecks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <XCircle className="w-6 h-6 text-red-400" />
            Rejected ({rejectedDecks.length})
          </h2>
          <div className="space-y-4">
            {rejectedDecks.slice(0, 5).map(deck => (
              <DeckReviewCard key={deck.id} deck={deck} readOnly />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DeckReviewCard({ deck, onApprove, onReject, approving, rejecting, readOnly }) {
  const statusColors = {
    pending_review: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    published: "bg-green-500/20 text-green-300 border-green-500/30",
    rejected: "bg-red-500/20 text-red-300 border-red-500/30",
    draft: "bg-slate-500/20 text-slate-300 border-slate-500/30"
  };

  const statusLabels = {
    pending_review: "Pending Review",
    published: "Published",
    rejected: "Rejected",
    draft: "Draft"
  };

  return (
    <Card className="bg-slate-900/60 border-purple-500/30">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {deck.cover_image && (
                <img 
                  src={deck.cover_image} 
                  alt={deck.name}
                  className="w-16 h-16 rounded-lg object-cover border border-white/20"
                />
              )}
              <div>
                <CardTitle className="text-white text-xl">{deck.name}</CardTitle>
                <CardDescription className="text-white/60">
                  {deck.category || "Uncategorized"}
                </CardDescription>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-white/60 mt-3">
              <div className="flex items-center gap-1">
                <UserIcon className="w-4 h-4" />
                {deck.created_by}
              </div>
              {deck.submission_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Submitted {new Date(deck.submission_date).toLocaleDateString()}
                </div>
              )}
              {deck.reviewed_by && (
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Reviewed by {deck.reviewed_by}
                </div>
              )}
            </div>

            {deck.description && (
              <p className="text-white/70 mt-3 text-sm">{deck.description}</p>
            )}

            {deck.review_notes && (
              <div className="mt-3 p-3 bg-black/30 rounded-lg border border-white/10">
                <p className="text-xs text-white/50 mb-1">Review Notes:</p>
                <p className="text-sm text-white/80">{deck.review_notes}</p>
              </div>
            )}
          </div>

          <Badge className={statusColors[deck.publish_status || "draft"]}>
            {statusLabels[deck.publish_status || "draft"]}
          </Badge>
        </div>
      </CardHeader>

      {!readOnly && (
        <CardContent>
          <div className="flex gap-3">
            <Button
              onClick={() => onApprove(deck)}
              disabled={approving || rejecting}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
            >
              {approving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve & Publish
                </>
              )}
            </Button>

            <Button
              onClick={() => onReject(deck)}
              disabled={approving || rejecting}
              variant="outline"
              className="flex-1 border-red-500/30 text-red-300 hover:bg-red-900/20"
            >
              {rejecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </>
              )}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
