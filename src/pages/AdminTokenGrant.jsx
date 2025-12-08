import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, CheckCircle, AlertCircle } from "lucide-react";

export default function AdminTokenGrant() {
  const [email, setEmail] = useState("");
  const [tokens, setTokens] = useState(50);
  const [tier, setTier] = useState("mystic");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Load current user to show their email
    User.me().then(user => {
      setCurrentUser(user);
      setEmail(user.email); // Pre-fill with current user's email
    }).catch(() => {});
  }, []);

  const grantTokens = async () => {
    if (!email) {
      setResult({ success: false, message: "Email required" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Case-insensitive email search
      const allUsers = await User.list();
      const user = allUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        setResult({ 
          success: false, 
          message: `User not found: ${email}. Make sure this user has logged in at least once.` 
        });
        return;
      }

      const currentBalance = user.token_balance || 0;

      await User.update(user.id, {
        token_balance: currentBalance + tokens,
        lifetime_tokens_purchased: (user.lifetime_tokens_purchased || 0) + tokens,
        subscription_tier: tier,
        subscription_status: 'active',
        subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });

      setResult({ 
        success: true, 
        message: `✅ Granted ${tokens} tokens to ${email}. New balance: ${currentBalance + tokens}. Tier: ${tier}` 
      });
    } catch (error) {
      setResult({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Coins className="w-6 h-6 text-amber-400" />
              Manual Token Grant (Admin Test)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentUser && (
              <div className="bg-blue-500/20 border border-blue-500/40 rounded-lg p-3 text-blue-200 text-sm">
                <div className="font-semibold mb-1">👤 You're logged in as:</div>
                <div className="font-mono">{currentUser.email}</div>
                <div className="text-xs mt-2">Current balance: {currentUser.token_balance || 0} tokens</div>
              </div>
            )}

            <div>
              <label className="text-white text-sm mb-2 block">User Email</label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="bg-white/10 border-white/20 text-white"
              />
              <p className="text-xs text-white/50 mt-1">
                Case-insensitive. User must have logged in at least once.
              </p>
            </div>

            <div>
              <label className="text-white text-sm mb-2 block">Tokens to Grant</label>
              <Input
                type="number"
                value={tokens}
                onChange={(e) => setTokens(parseInt(e.target.value) || 0)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div>
              <label className="text-white text-sm mb-2 block">Subscription Tier</label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white rounded-md p-2"
              >
                <option value="free">Free</option>
                <option value="mystic">Mystic (50 tokens/month)</option>
                <option value="oracle_pro">Oracle Pro (150 tokens/month)</option>
                <option value="creator">Creator (400 tokens/month)</option>
              </select>
            </div>

            <Button
              onClick={grantTokens}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
            >
              {loading ? "Granting..." : "Grant Tokens"}
            </Button>

            {result && (
              <div className={`p-4 rounded-lg flex items-start gap-3 ${
                result.success ? 'bg-green-500/20 border border-green-500/40' : 'bg-red-500/20 border border-red-500/40'
              }`}>
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <p className={result.success ? 'text-green-200' : 'text-red-200'}>
                  {result.message}
                </p>
              </div>
            )}

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-200">
              <p className="font-semibold mb-2">💡 Testing Tips:</p>
              <ul className="space-y-1 text-xs">
                <li>• Email is pre-filled with your account</li>
                <li>• Grant yourself tokens to test the system</li>
                <li>• Check the Upgrade page to see updated balance</li>
                <li>• Test AI readings to verify token deduction</li>
                <li>• Changes take effect immediately</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}