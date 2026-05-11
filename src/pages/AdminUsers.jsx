import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Users,
  Crown,
  ArrowLeft,
  Plus,
  RotateCcw,
  Coins,
  Settings,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const TIERS = ["free", "mystic", "oracle_pro", "creator"];

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Single dialog handles grant / set-balance / set-subscription
  const [dialog, setDialog] = useState(null); // { type, user }
  const [dialogValue, setDialogValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allUsers, me] = await Promise.all([User.list(), User.me()]);
      if (me.role !== "admin") {
        toast.error("Access denied. Admin privileges required.");
        navigate(createPageUrl("Dashboard"));
        return;
      }
      setUsers(allUsers);
    } catch {
      toast.error("Failed to load users. You may not have admin privileges.");
      navigate(createPageUrl("Dashboard"));
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openDialog = (type, user) => {
    const defaultValue =
      type === "grant" ? "100"
      : type === "set" ? String(user.token_balance || 0)
      : user.subscription_tier || "free";
    setDialog({ type, user });
    setDialogValue(defaultValue);
  };

  const closeDialog = () => {
    if (isSaving) return;
    setDialog(null);
    setDialogValue("");
  };

  const handleSave = async () => {
    if (!dialog) return;
    const { type, user } = dialog;
    setIsSaving(true);
    try {
      if (type === "grant") {
        const num = parseInt(dialogValue);
        if (!num || num <= 0) { toast.error("Enter a positive number."); return; }
        const newBalance = (user.token_balance || 0) + num;
        await User.update(user.id, {
          token_balance: newBalance,
          lifetime_tokens_purchased: (user.lifetime_tokens_purchased || 0) + num,
        });
        toast.success(`Granted ${num} tokens to ${user.email}. New balance: ${newBalance}`);

      } else if (type === "set") {
        const num = parseInt(dialogValue);
        if (isNaN(num) || num < 0) { toast.error("Enter a non-negative number."); return; }
        await User.update(user.id, { token_balance: num });
        toast.success(`Token balance set to ${num} for ${user.email}`);

      } else if (type === "sub") {
        const tier = dialogValue.toLowerCase();
        if (!TIERS.includes(tier)) { toast.error("Invalid tier."); return; }
        await User.update(user.id, {
          subscription_tier: tier,
          subscription_status: tier === "free" ? "cancelled" : "active",
          subscription_end_date:
            tier === "free"
              ? null
              : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        });
        toast.success(`Subscription set to ${tier} for ${user.email}`);
      }

      closeDialog();
      loadUsers();
    } catch (error) {
      toast.error(`Failed: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-pulse" />
          <p className="text-white">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(createPageUrl("Dashboard"))}
              className="border-white/20 text-purple-200 hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-3xl font-bold text-white tracking-wide flex items-center gap-2">
              <Users className="w-8 h-8 text-purple-400" />
              User Management
            </h1>
          </div>
          <Button onClick={loadUsers} variant="outline" className="border-purple-500 text-purple-300">
            <RotateCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </motion.div>

        <div className="bg-slate-900/50 backdrop-blur-lg rounded-2xl border border-purple-500/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-purple-900/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-purple-300 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-purple-300 uppercase">Tokens</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-purple-300 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-purple-300 uppercase">Subscription</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-purple-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {users.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{user.full_name || "No name"}</div>
                      <div className="text-sm text-purple-300">{user.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-amber-400" />
                        <span className="font-semibold text-white">{user.token_balance || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.role === "admin" ? "bg-red-900/50 text-red-300" : "bg-slate-700 text-slate-300"
                      }`}>
                        {user.role || "user"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.subscription_tier === "free"       ? "bg-gray-700 text-gray-300"     :
                        user.subscription_tier === "mystic"     ? "bg-purple-700 text-purple-200" :
                        user.subscription_tier === "oracle_pro" ? "bg-blue-700 text-blue-200"     :
                                                                   "bg-amber-700 text-amber-200"
                      }`}>
                        {user.subscription_tier || "free"}
                      </span>
                      {user.subscription_end_date && (
                        <div className="text-xs text-purple-300 mt-1">
                          Expires: {new Date(user.subscription_end_date).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => openDialog("grant", user)} className="bg-amber-600 hover:bg-amber-700">
                          <Plus className="w-3 h-3 mr-1" /> Add Tokens
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openDialog("set", user)} className="border-purple-500 text-purple-300">
                          <Settings className="w-3 h-3 mr-1" /> Set Balance
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openDialog("sub", user)} className="border-blue-500 text-blue-300 hover:bg-blue-900/30">
                          <Crown className="w-3 h-3 mr-1" /> Set Sub
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Unified action dialog — replaces all prompt() calls */}
      <Dialog open={!!dialog} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="bg-slate-900 border border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {dialog?.type === "grant" && "Add Tokens"}
              {dialog?.type === "set"   && "Set Token Balance"}
              {dialog?.type === "sub"   && "Set Subscription"}
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-3">
            <p className="text-sm text-white/60">{dialog?.user?.email}</p>

            {(dialog?.type === "grant" || dialog?.type === "set") && (
              <div>
                <label className="text-sm text-white/80 block mb-1">
                  {dialog?.type === "grant"
                    ? `Tokens to add (current: ${dialog?.user?.token_balance || 0})`
                    : "New balance"}
                </label>
                <Input
                  type="number"
                  value={dialogValue}
                  onChange={(e) => setDialogValue(e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                  min={dialog?.type === "set" ? 0 : 1}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                />
              </div>
            )}

            {dialog?.type === "sub" && (
              <div>
                <label className="text-sm text-white/80 block mb-1">Tier</label>
                <Select value={dialogValue} onValueChange={setDialogValue}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10 text-white">
                    {TIERS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1).replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeDialog} disabled={isSaving} className="border-white/20 text-white hover:bg-white/10">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-purple-600 hover:bg-purple-700">
              {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}