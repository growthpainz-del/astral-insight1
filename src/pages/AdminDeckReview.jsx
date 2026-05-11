import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Deck, User } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  FileText,
  User as UserIcon,
  Calendar,
  Mail,
} from "lucide-react";

export default function AdminDeckReview() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [approving, setApproving] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [testingEmail, setTestingEmail] = useState(false);

  // Dialog state
  const [deckToApprove, setDeckToApprove] = useState(null);
  const [deckToReject, setDeckToReject] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [testEmailDialogOpen, setTestEmailDialogOpen] = useState(false);

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
    setDeckToApprove(deck);
  };

  const confirmApproveDeck = async (deck) => {
    setApproving(deck.id);
    setError("");
    try {
      const response = await base44.functions.invoke("adminDeckAction", {
        deckId: deck.id,
        action: "approve",
      });
      if (!response.data?.success) {
        setError("Failed to approve deck: " + (response.data?.message || "Unknown error"));
        return;
      }
      toast.success(`"${deck.name}" approved and published.`);
      await loadDecks();
    } catch (error) {
      setError("Failed to approve deck: " + (error.message || "Unknown error"));
    } finally {
      setApproving(null);
      setDeckToApprove(null);
    }
  };

  const rejectDeck = (deck) => {
    setDeckToReject(deck);
    setRejectReason("");
  };

  const confirmRejectDeck = async () => {
    if (!deckToReject || !rejectReason.trim()) return;
    setRejecting(deckToReject.id);
    setError("");
    try {
      const response = await base44.functions.invoke("adminDeckAction", {
        deckId: deckToReject.id,
        action: "reject",
        reason: rejectReason.trim(),
      });
      if (!response.data?.success) {
        setError("Failed to reject deck: " + (response.data?.message || "Unknown error"));
        return;
      }
      toast.success(`"${deckToReject.name}" rejected. Creator notified.`);
      await loadDecks();
    } catch (error) {
      setError("Failed to reject deck: " + (error.message || "Unknown error"));
    } finally {
      setRejecting(null);
      setDeckToReject(null);
      setRejectReason("");
    }
  };

  const sendTestEmail = async () => {
    if (!testEmailAddress.trim()) return;
    setTestingEmail(true);
    setError("");
    try {
      await base44.integrations.Core.SendEmail({
        to: testEmailAddress.trim(),
        subject: "🧪 Test Email - Astral Insight Publishing System",
        body: `This is a test email from the Astral Insight publishing system.

Your email notifications are working correctly! ✅

Sent by: ${user?.email}
Sent at: ${new Date().toLocaleString()}`,
      });
      toast.success(`Test email sent to ${testEmailAddress}.`);
      setTestEmailDialogOpen(false);
    } catch (err) {
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
          onClick={() => { setTestEmailAddress(user?.email || ""); setTestEmailDialogOpen(true); }}
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

      {/* Approve confirmation */}
      <AlertDialog open={!!deckToApprove} onOpenChange={(open) => !open && setDeckToApprove(null)}>
        <AlertDialogContent className="bg-slate-900 border border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Deck</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Approve <span className="font-semibold text-white">"{deckToApprove?.name}"</span> for publication? The creator will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmApproveDeck(deckToApprove)} className="bg-emerald-600 hover:bg-emerald-700">
              Approve & Publish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject dialog with reason */}
      <Dialog open={!!deckToReject} onOpenChange={(open) => !open && setDeckToReject(null)}>
        <DialogContent className="bg-slate-900 border border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Deck</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-white/70">
              Rejecting <span className="font-semibold text-white">"{deckToReject?.name}"</span>.
              Provide a reason — this will be sent to the creator.
            </p>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why this deck is being rejected..."
              className="bg-white/10 border-white/20 text-white min-h-[100px]"
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeckToReject(null)} className="border-white/20 text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button
              onClick={confirmRejectDeck}
              disabled={!rejectReason.trim() || !!rejecting}
              className="bg-red-600 hover:bg-red-700"
            >
              {rejecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test email dialog */}
      <Dialog open={testEmailDialogOpen} onOpenChange={setTestEmailDialogOpen}>
        <DialogContent className="bg-slate-900 border border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-white/70">Enter an email address to send a test notification.</p>
            <Input
              value={testEmailAddress}
              onChange={(e) => setTestEmailAddress(e.target.value)}
              placeholder="email@example.com"
              className="bg-white/10 border-white/20 text-white"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && sendTestEmail()}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTestEmailDialogOpen(false)} className="border-white/20 text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button onClick={sendTestEmail} disabled={testingEmail || !testEmailAddress.trim()} className="bg-blue-600 hover:bg-blue-700">
              {testingEmail ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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