import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Crown,
  Calendar,
  Coins,
  Mail,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  CreditCard, // Added for new pricing section
  Sparkles, // Added for new pricing section
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SubscriptionManagement() {
  const [user, setUser] = useState(null);
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Weekly reading preferences
  const [weeklyEnabled, setWeeklyEnabled] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState("");
  const [spreadType, setSpreadType] = useState("three_card");
  const [dayOfWeek, setDayOfWeek] = useState("sunday");
  const [weeklyQuestion, setWeeklyQuestion] = useState("What do I need to know this week?");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [currentUser, deckList] = await Promise.all([
        User.me(),
        // Load user's personal decks + public decks
        // For simplicity, we'll just load all available decks
        fetch('/api/decks').then(r => r.json()).catch(() => [])
      ]);

      setUser(currentUser);
      setDecks(deckList || []);

      // Load existing preferences
      const prefs = currentUser.weekly_reading_preferences || {};
      setWeeklyEnabled(currentUser.weekly_reading_enabled || false);
      setSelectedDeck(prefs.deck_id || "");
      setSpreadType(prefs.spread_type || "three_card");
      setDayOfWeek(prefs.day_of_week || "sunday");
      setWeeklyQuestion(prefs.question || "What do I need to know this week?");

    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    setMessage("");
    
    try {
      await User.updateMyUserData({
        weekly_reading_enabled: weeklyEnabled,
        weekly_reading_preferences: {
          deck_id: selectedDeck,
          spread_type: spreadType,
          day_of_week: dayOfWeek,
          question: weeklyQuestion,
        },
      });

      setMessage("Preferences saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  const tierNames = {
    free: "Free",
    mystic: "Mystic",
    oracle_pro: "Oracle Pro",
    creator: "Creator Studio",
  };

  const tier = user?.subscription_tier || "free";
  const status = user?.subscription_status || "active";
  const tokenBalance = user?.token_balance || 0;
  const endDate = user?.subscription_end_date;
  const lifetimePurchased = user?.lifetime_tokens_purchased || 0;
  const lifetimeUsed = user?.lifetime_tokens_used || 0;

  const isPremium = tier !== "free";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-purple-400" />
          Subscription & Tokens
        </h1>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Current Plan Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="bg-slate-900/80 border-purple-500/30 h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-400" />
                    Current Plan
                  </CardTitle>
                  <Badge className={`${
                    tier === 'free' ? 'bg-gray-600' :
                    tier === 'mystic' ? 'bg-purple-600' :
                    tier === 'oracle_pro' ? 'bg-amber-600' :
                    'bg-pink-600'
                  }`}>
                    {tierNames[tier]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isPremium && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/70">Status:</span>
                      <Badge variant={status === 'active' ? 'success' : 'warning'} className="bg-green-600">
                        {status === 'active' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertCircle className="w-3 h-3 mr-1" />}
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Badge>
                    </div>
                    {endDate && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/70">Renews:</span>
                        <span className="text-white font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(endDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </>
                )}
                <div className="pt-4 border-t border-white/10">
                  <Link to={createPageUrl("Upgrade")}>
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                      {isPremium ? 'Change Plan' : 'Upgrade Now'}
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Token Balance Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="bg-slate-900/80 border-purple-500/30 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-400" />
                  Token Balance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4">
                  <div className="text-5xl font-bold text-white mb-2">{tokenBalance}</div>
                  <div className="text-white/60">tokens available</div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70">Lifetime purchased:</span>
                    <span className="text-white font-medium">{lifetimePurchased}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Lifetime used:</span>
                    <span className="text-white font-medium">{lifetimeUsed}</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <Link to={createPageUrl("Upgrade")}>
                    <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                      Buy More Tokens
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* NEW PRICING TABLE */}
        <div className="bg-slate-900/70 border border-purple-500/40 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            New Lower Pricing!
          </h2>
          <p className="text-purple-300 mb-6">Better value, lower costs - choose the plan that fits your needs</p>

          {/* Subscription Tiers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Mystic Tier */}
            <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border-2 border-purple-500/40 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-2">Mystic Tier</h3>
              <div className="text-3xl font-bold text-purple-300 mb-1">$4.99</div>
              <div className="text-sm text-purple-400 mb-4">/month</div>
              <div className="bg-purple-900/30 rounded-lg p-3 mb-4">
                <div className="text-2xl font-bold text-amber-400">50 tokens</div>
                <div className="text-xs text-purple-300">per month</div>
              </div>
              <ul className="space-y-2 text-sm text-purple-200 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>~50 AI readings</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>~25 AI images</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>All basic features</span>
                </li>
              </ul>
              <a 
                href="https://gumroad.com/l/mystic-tier" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full"
              >
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  Subscribe
                </Button>
              </a>
            </div>

            {/* Oracle Pro */}
            <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border-2 border-blue-500/60 rounded-xl p-6 relative">
              <div className="absolute -top-3 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                ⭐ POPULAR
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Oracle Pro</h3>
              <div className="text-3xl font-bold text-blue-300 mb-1">$12.99</div>
              <div className="text-sm text-blue-400 mb-4">/month</div>
              <div className="bg-blue-900/30 rounded-lg p-3 mb-4">
                <div className="text-2xl font-bold text-amber-400">150 tokens</div>
                <div className="text-xs text-blue-300">per month</div>
              </div>
              <ul className="space-y-2 text-sm text-blue-200 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>~150 AI readings</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>~75 AI images</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Custom personas</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Fusion readings</span>
                </li>
              </ul>
              <a 
                href="https://growthpainz.gumroad.com/l/ibcai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full"
              >
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Subscribe
                </Button>
              </a>
            </div>

            {/* Creator Studio */}
            <div className="bg-gradient-to-br from-amber-900/40 to-amber-800/20 border-2 border-amber-500/40 rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-2">Creator Studio</h3>
              <div className="text-3xl font-bold text-amber-300 mb-1">$24.99</div>
              <div className="text-sm text-amber-400 mb-4">/month</div>
              <div className="bg-amber-900/30 rounded-lg p-3 mb-4">
                <div className="text-2xl font-bold text-amber-400">400 tokens</div>
                <div className="text-xs text-amber-300">per month</div>
              </div>
              <ul className="space-y-2 text-sm text-amber-200 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>~400 AI readings</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>~200 AI images</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Bulk AI generation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Publish public decks</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Commercial use</span>
                </li>
              </ul>
              <a 
                href="https://gumroad.com/l/creator-studio" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full"
              >
                <Button className="w-full bg-amber-600 hover:bg-amber-700">
                  Subscribe
                </Button>
              </a>
            </div>
          </div>

          {/* Token Packs */}
          <div className="border-t border-purple-500/30 pt-6">
            <h3 className="text-xl font-bold text-white mb-4">Need More Tokens? Buy One-Time Packs</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 border border-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-amber-400 mb-1">20</div>
                <div className="text-xs text-purple-300 mb-3">tokens</div>
                <div className="text-lg font-bold text-white mb-3">$1.99</div>
                <a href="https://gumroad.com/l/tokens-20" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="w-full border-purple-500 text-purple-300">Buy</Button>
                </a>
              </div>

              <div className="bg-slate-800/50 border-2 border-emerald-500/60 rounded-lg p-4 text-center relative">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  POPULAR
                </div>
                <div className="text-2xl font-bold text-amber-400 mb-1">50</div>
                <div className="text-xs text-purple-300 mb-3">tokens</div>
                <div className="text-lg font-bold text-white mb-3">$3.99</div>
                <a href="https://gumroad.com/l/tokens-50" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700">Buy</Button>
                </a>
              </div>

              <div className="bg-slate-800/50 border border-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-amber-400 mb-1">100</div>
                <div className="text-xs text-purple-300 mb-3">tokens</div>
                <div className="text-lg font-bold text-white mb-1">$6.99</div>
                <div className="text-[10px] text-emerald-400 mb-2">20% savings</div>
                <a href="https://gumroad.com/l/tokens-100" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="w-full border-purple-500 text-purple-300">Buy</Button>
                </a>
              </div>

              <div className="bg-slate-800/50 border-2 border-amber-500/60 rounded-lg p-4 text-center relative">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                  BEST VALUE
                </div>
                <div className="text-2xl font-bold text-amber-400 mb-1">200</div>
                <div className="text-xs text-purple-300 mb-3">tokens</div>
                <div className="text-lg font-bold text-white mb-1">$12.99</div>
                <div className="text-[10px] text-amber-400 mb-2">35% savings</div>
                <a href="https://gumroad.com/l/tokens-200" target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="w-full bg-amber-600 hover:bg-amber-700">Buy</Button>
                </a>
              </div>
            </div>
          </div>

          {/* Token Costs */}
          <div className="border-t border-purple-500/30 pt-6 mt-6">
            <h3 className="text-lg font-bold text-white mb-3">Token Costs</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-amber-400 font-bold text-xl mb-1">1</div>
                <div className="text-purple-300">AI Reading</div>
              </div>
              <div className="text-center">
                <div className="text-amber-400 font-bold text-xl mb-1">1</div>
                <div className="text-purple-300">Fusion</div>
              </div>
              <div className="text-center">
                <div className="text-amber-400 font-bold text-xl mb-1">2</div>
                <div className="text-purple-300">AI Image</div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Reading Settings */}
        {isPremium && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-slate-900/80 border-purple-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-400" />
                  Weekly Reading Emails
                </CardTitle>
                <CardDescription className="text-white/60">
                  Receive automated card readings via email every week
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <Label htmlFor="weekly-enabled" className="text-white font-semibold">
                      Enable Weekly Readings
                    </Label>
                    <p className="text-sm text-white/60 mt-1">
                      Receive an email with cards and meanings every week
                    </p>
                  </div>
                  <Switch
                    id="weekly-enabled"
                    checked={weeklyEnabled}
                    onCheckedChange={setWeeklyEnabled}
                  />
                </div>

                {weeklyEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pl-4 border-l-2 border-purple-500/30"
                  >
                    <div>
                      <Label className="text-white/80 mb-2 block">Deck</Label>
                      <Select value={selectedDeck} onValueChange={setSelectedDeck}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Choose a deck..." />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700 text-white">
                          {decks.map(deck => (
                            <SelectItem key={deck.id} value={deck.id} className="text-white hover:bg-slate-800">
                              {deck.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-white/80 mb-2 block">Spread Type</Label>
                      <Select value={spreadType} onValueChange={setSpreadType}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700 text-white">
                          <SelectItem value="single">Single Card</SelectItem>
                          <SelectItem value="three_card">3-Card Spread</SelectItem>
                          <SelectItem value="diamond">Diamond Spread (5 cards)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-white/80 mb-2 block">Day of Week</Label>
                      <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700 text-white">
                          {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map(day => (
                            <SelectItem key={day} value={day} className="text-white hover:bg-slate-800 capitalize">
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-white/80 mb-2 block">Weekly Question</Label>
                      <Input
                        value={weeklyQuestion}
                        onChange={(e) => setWeeklyQuestion(e.target.value)}
                        placeholder="What do I need to know this week?"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>

                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-200">
                      <p className="font-semibold mb-2">📧 How it works:</p>
                      <ul className="space-y-1 text-blue-200/80">
                        <li>• You'll receive an email with the drawn cards and their meanings</li>
                        <li>• Click "Generate Full AI Reading" in the email to use tokens</li>
                        <li>• Manual meanings are always free in the email</li>
                      </ul>
                    </div>
                  </motion.div>
                )}

                <div className="flex items-center justify-between pt-4">
                  {message && (
                    <p className={`text-sm ${message.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>
                      {message}
                    </p>
                  )}
                  <Button
                    onClick={handleSavePreferences}
                    disabled={saving || !weeklyEnabled || !selectedDeck}
                    className="ml-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Preferences'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Manage Subscription Link */}
        {isPremium && user?.gumroad_subscription_id && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <Card className="bg-slate-900/60 border-white/10">
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">Manage Subscription on Gumroad</p>
                  <p className="text-sm text-white/60">Cancel, update payment method, or view invoices</p>
                </div>
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => window.open('https://app.gumroad.com/subscriptions', '_blank')}
                >
                  Manage on Gumroad
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}