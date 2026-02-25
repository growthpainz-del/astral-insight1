import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Sparkles,
  Zap,
  Crown,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";

// ACTUAL GUMROAD PRODUCT LINKS
const GUMROAD_LINKS = {
  mystic: "https://growthpainz.gumroad.com/l/ghsad",
  oracle_pro: "https://growthpainz.gumroad.com/l/ibcai",
  creator: "https://growthpainz.gumroad.com/l/wxnje",
  tokens_20: "https://growthpainz.gumroad.com/l/jcxfui",
  tokens_50: "https://growthpainz.gumroad.com/l/bhzra",
  tokens_100: "https://growthpainz.gumroad.com/l/harwmx",
  tokens_200: "https://growthpainz.gumroad.com/l/ndqug",
};

export default function Upgrade() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Failed to load user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (tier) => {
    // Redirect to Gumroad checkout with pre-filled email
    let url = GUMROAD_LINKS[tier];
    if (user?.email) {
      url += (url.includes('?') ? '&' : '?') + 'email=' + encodeURIComponent(user.email);
    }
    window.open(url, '_blank');
  };

  const tiers = [
    {
      id: "mystic",
      name: "Mystic",
      price: "CAD$4.99",
      icon: Sparkles,
      color: "from-purple-600 to-blue-600",
      popular: true,
      tokens: "50 tokens/month",
      features: [
        "50 AI reading tokens per month",
        "Weekly automated reading emails",
        "Unlimited reading history",
        "Access to premium decks",
        "Fusion readings (combine 2 decks)",
        "Advanced spreads (Zodiac, Chakra)",
        "Create up to 5 personal decks",
        "Priority support",
      ],
    },
    {
      id: "oracle_pro",
      name: "Oracle Pro",
      price: "CAD$12.99",
      icon: Zap,
      color: "from-amber-600 to-orange-600",
      popular: false,
      tokens: "150 tokens/month",
      features: [
        "150 AI reading tokens per month",
        "Everything in Mystic, PLUS:",
        "🎨 Full Deck Builder Suite",
        "Bulk card import (JSON, CSV)",
        "AI deck generation",
        "Bulk image upload & auto-matching",
        "AI image generation (10 cards/month)",
        "Manual PDF extraction",
        "Custom spread designer",
        "Unlimited personal decks",
        "Make decks public",
        "Export deck as PDF",
      ],
    },
    {
      id: "creator",
      name: "Creator Pro",
      price: "CAD$24.99",
      icon: Crown,
      color: "from-pink-600 to-purple-600",
      popular: false,
      tokens: "400 tokens/month",
      features: [
        "400 AI reading tokens per month",
        "Everything in Oracle Pro, PLUS:",
        "Unlimited AI image generation",
        "White-label options",
        "Custom branding on exports",
        "API access (coming soon)",
        "Priority AI model (faster)",
        "1-on-1 onboarding call",
        "Beta access to new features",
      ],
    },
  ];

  const tokenPackages = [
    { id: "tokens_20", amount: 20, price: "CAD$1.99", perToken: "$0.10" },
    { id: "tokens_50", amount: 50, price: "CAD$3.99", perToken: "$0.08", popular: true },
    { id: "tokens_100", amount: 100, price: "CAD$6.99", perToken: "$0.07" },
    { id: "tokens_200", amount: 200, price: "CAD$12.99", perToken: "$0.06", bestValue: true },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  const currentTier = user?.subscription_tier || "free";
  const tokenBalance = user?.token_balance || 0;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-4"
          >
            Unlock Your Mystical Potential
          </motion.h1>
          <p className="text-xl text-white/80">
            Choose the plan that fits your spiritual journey
          </p>
          {user && (
            <div className="mt-4 flex items-center justify-center gap-4">
              <Badge className="bg-purple-600/30 text-purple-200 text-lg px-4 py-2">
                Current: {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}
              </Badge>
              <Badge className="bg-blue-600/30 text-blue-200 text-lg px-4 py-2">
                {tokenBalance} tokens available
              </Badge>
            </div>
          )}
        </div>

        {/* Subscription Tiers */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {tiers.map((tier, index) => {
            const Icon = tier.icon;
            const isCurrentTier = currentTier === tier.id;

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`relative bg-slate-900/80 border-2 ${
                  tier.popular ? 'border-amber-500/50' : 'border-purple-500/30'
                } h-full flex flex-col`}>
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${tier.color} flex items-center justify-center`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-3xl text-white">{tier.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-5xl font-bold text-white">{tier.price}</span>
                      <span className="text-white/60">/month</span>
                    </div>
                    <CardDescription className="text-lg text-purple-300 mt-2">
                      {tier.tokens}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-3 mb-6 flex-1">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 text-white/90">
                          <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                          <span className={feature.startsWith('🎨') || feature.includes('PLUS') ? 'font-semibold text-amber-300' : ''}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => handleUpgrade(tier.id)}
                      disabled={isCurrentTier}
                      className={`w-full ${
                        isCurrentTier
                          ? 'bg-gray-600 cursor-not-allowed'
                          : `bg-gradient-to-r ${tier.color} hover:opacity-90`
                      } text-white font-bold py-6 text-lg`}
                    >
                      {isCurrentTier ? (
                        'Current Plan'
                      ) : currentTier === 'free' ? (
                        <>Upgrade Now <ExternalLink className="w-5 h-5 ml-2" /></>
                      ) : (
                        <>Change Plan <ExternalLink className="w-5 h-5 ml-2" /></>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Token Top-Up Packages */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Need More Tokens?</h2>
            <p className="text-white/70">One-time token packages to top up your balance</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {tokenPackages.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`bg-slate-900/60 ${
                  pkg.popular ? 'border-2 border-green-500/50' : 
                  pkg.bestValue ? 'border-2 border-amber-500/50' :
                  'border border-purple-500/30'
                }`}>
                  {pkg.popular && (
                    <div className="bg-green-600/20 text-green-300 text-xs font-semibold text-center py-1">
                      ⭐ Most Popular
                    </div>
                  )}
                  {pkg.bestValue && (
                    <div className="bg-amber-600/20 text-amber-300 text-xs font-semibold text-center py-1">
                      💎 Best Value
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-4xl text-white">{pkg.amount}</CardTitle>
                    <CardDescription className="text-white/60">tokens</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold text-white">{pkg.price}</span>
                      <div className="text-sm text-white/50 mt-1">{pkg.perToken} per token</div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleUpgrade(pkg.id)}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:opacity-90 text-white"
                    >
                      Buy Now <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto bg-slate-900/60 border border-purple-500/30 rounded-xl p-8">
          <h3 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h3>
          <div className="space-y-4 text-white/80">
            <div>
              <p className="font-semibold text-white mb-2">How do tokens work?</p>
              <p>Each AI-generated reading costs tokens based on complexity. A quick reading is 1 token, standard is 2 tokens, and deep dive is 4 tokens. Tokens roll over month-to-month as long as you're subscribed!</p>
            </div>
            <div>
              <p className="font-semibold text-white mb-2">Can I cancel anytime?</p>
              <p>Yes! Cancel anytime through Gumroad. You'll keep your premium features until the end of your billing period, and any remaining tokens will stay in your account.</p>
            </div>
            <div>
              <p className="font-semibold text-white mb-2">What if I run out of tokens?</p>
              <p>You can buy one-time token packages anytime, or wait until your monthly tokens refresh. Manual card meanings are always unlimited!</p>
            </div>
            <div>
              <p className="font-semibold text-white mb-2">Do tokens expire?</p>
              <p>Subscription tokens roll over as long as you maintain your subscription. One-time purchased tokens never expire.</p>
            </div>
            <div>
              <p className="font-semibold text-white mb-2">What currency are the prices in?</p>
              <p>All prices are in Canadian Dollars (CAD). Your card will be charged in CAD, and your bank may apply a conversion fee if you're outside Canada.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}