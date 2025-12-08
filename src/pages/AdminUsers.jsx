
import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import {
  Users,
  ArrowLeft,
  Plus,
  RotateCcw, // Added RotateCcw icon
  Coins,      // Added Coins icon
  Settings    // Added Settings icon
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // New state variables for token management
  const [editingUser, setEditingUser] = useState(null); // Not directly used in current prompt-based solution, but kept as per outline
  const [tokenAmount, setTokenAmount] = useState(100); // Not directly used in current prompt-based solution, but kept as per outline

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allUsers, me] = await Promise.all([
        User.list(),
        User.me()
      ]);
      
      if (me.role !== 'admin') {
        alert("Access denied. Admin privileges required.");
        navigate(createPageUrl("Dashboard"));
        return;
      }
      
      setUsers(allUsers);
      setCurrentUser(me);

    } catch (error) {
      console.error("Error loading users:", error);
      alert("Failed to load users. You may not have admin privileges.");
      navigate(createPageUrl("Dashboard"));
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleGrantTokens = async (user) => {
    const amount = prompt(`Grant how many tokens to ${user.email}?`, "100");
    if (!amount || isNaN(amount)) return;

    const numTokens = parseInt(amount);
    if (numTokens <= 0) {
      alert("Please enter a positive number");
      return;
    }

    try {
      const newBalance = (user.token_balance || 0) + numTokens;
      await User.update(user.id, {
        token_balance: newBalance,
        lifetime_tokens_purchased: (user.lifetime_tokens_purchased || 0) + numTokens
      });

      alert(`✅ Granted ${numTokens} tokens to ${user.email}\nNew balance: ${newBalance}`);
      loadUsers();
    } catch (error) {
      console.error("Failed to grant tokens:", error);
      alert(`❌ Failed to grant tokens: ${error.message}`);
    }
  };

  const handleSetTokenBalance = async (user) => {
    const amount = prompt(`Set token balance for ${user.email}?\n\nCurrent: ${user.token_balance || 0}`, "100");
    if (!amount || isNaN(amount)) return;

    const numTokens = parseInt(amount);
    if (numTokens < 0) {
      alert("Please enter a non-negative number");
      return;
    }

    try {
      await User.update(user.id, {
        token_balance: numTokens
      });

      alert(`✅ Set token balance to ${numTokens} for ${user.email}`);
      loadUsers();
    } catch (error) {
      console.error("Failed to set tokens:", error);
      alert(`❌ Failed to set tokens: ${error.message}`);
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
                      <div>
                        <div className="font-medium text-white">{user.full_name || 'No name'}</div>
                        <div className="text-sm text-purple-300">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4 text-amber-400" />
                        <span className="font-semibold text-white">{user.token_balance || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.role === 'admin' ? 'bg-red-900/50 text-red-300' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.subscription_tier === 'free' ? 'bg-gray-700 text-gray-300' :
                        user.subscription_tier === 'mystic' ? 'bg-purple-700 text-purple-200' :
                        user.subscription_tier === 'oracle_pro' ? 'bg-blue-700 text-blue-200' :
                        'bg-amber-700 text-amber-200'
                      }`}>
                        {user.subscription_tier || 'free'}
                      </span>
                      {user.subscription_end_date && (
                          <div className="text-xs text-purple-300 mt-1">
                            Expires: {new Date(user.subscription_end_date).toLocaleDateString()}
                          </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleGrantTokens(user)}
                          className="bg-amber-600 hover:bg-amber-700"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add Tokens
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetTokenBalance(user)}
                          className="border-purple-500 text-purple-300"
                        >
                          <Settings className="w-3 h-3 mr-1" />
                          Set Balance
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
    </div>
  );
}
