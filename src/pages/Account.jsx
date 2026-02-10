import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Trash2, ChevronLeft, Loader2 } from "lucide-react";
import { deleteAccount } from "@/functions/deleteAccount";

export default function Account() {
  const [me, setMe] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try { setMe(await base44.auth.me()); } catch { setMe(null); }
    })();
  }, []);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccount({});
      // After deletion, redirect to home
      window.location.href = createPageUrl('Home');
    } catch (e) {
      alert('Failed to delete account: ' + (e?.response?.data?.error || e.message));
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link to={createPageUrl('Dashboard')} className="text-white/70 hover:text-white flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" /> Back
          </Link>
          <h1 className="text-2xl font-bold">Account</h1>
          <div className="w-10" />
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          {me ? (
            <>
              <div className="text-white/80">Signed in as</div>
              <div className="font-semibold">{me.full_name || me.email}</div>
            </>
          ) : (
            <div className="text-white/60 text-sm">Not signed in</div>
          )}
        </div>

        <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-4">
          <h2 className="text-lg font-bold text-red-300 mb-2">Danger Zone</h2>
          <p className="text-white/80 mb-4">Deleting your account is permanent and cannot be undone.</p>
          <Button onClick={() => setConfirmOpen(true)} variant="outline" className="border-red-500/50 text-red-300 hover:bg-red-500/10">
            <Trash2 className="w-4 h-4 mr-2" /> Delete Account
          </Button>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="bg-slate-900 border border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Account Deletion</DialogTitle>
          </DialogHeader>
          <p className="text-white/80 mb-4">This will permanently delete your account and associated data you own. Type DELETE to confirm.</p>
          <ConfirmBox onConfirm={handleDelete} loading={deleting} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConfirmBox({ onConfirm, loading }) {
  const [text, setText] = useState("");
  return (
    <div className="flex items-center gap-2">
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Type DELETE"
        className="flex-1 bg-black/40 border border-white/20 rounded px-3 py-2 text-white"
      />
      <Button disabled={text !== 'DELETE' || loading} onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
      </Button>
    </div>
  );
}