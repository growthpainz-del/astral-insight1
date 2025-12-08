import React, { useState, useEffect } from 'react';
import { User } from '@/entities/all';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, CheckCircle, Loader2, RefreshCw, Zap, Coins, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function WebhookTester() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testResult, setTestResult] = useState(null);
  const [manualTokens, setManualTokens] = useState(20);
  const [isGranting, setIsGranting] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testWebhookManually = async () => {
    if (!user) {
      alert('You must be logged in to test');
      return;
    }

    setTestResult({ status: 'testing', message: 'Sending test webhook...' });

    try {
      const testPayload = {
        seller_id: 'test_seller',
        product_id: 'test_product',
        product_permalink: 'jcxfui', // 20 tokens
        email: user.email,
        price: '199',
        currency: 'usd',
        sale_id: 'test_' + Date.now(),
        subscription_id: null,
        cancelled: false,
        ended: false,
        refunded: false,
      };

      console.log('Sending test webhook payload:', testPayload);

      const response = await fetch('/functions/gumroadWebhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      });

      const result = await response.json();
      console.log('Webhook response:', result);

      if (response.ok) {
        setTestResult({
          status: 'success',
          message: '✅ Webhook processed successfully!',
          details: result,
        });
        setTimeout(loadUser, 1000);
      } else {
        setTestResult({
          status: 'error',
          message: '❌ Webhook failed',
          details: result,
        });
      }
    } catch (error) {
      console.error('Webhook test error:', error);
      setTestResult({
        status: 'error',
        message: `❌ Error: ${error.message}`,
        details: error,
      });
    }
  };

  const manuallyGrantTokens = async () => {
    if (!user) {
      alert('You must be logged in');
      return;
    }

    if (manualTokens <= 0) {
      alert('Please enter a positive number of tokens');
      return;
    }

    setIsGranting(true);
    try {
      const newBalance = (user.token_balance || 0) + manualTokens;
      await User.update(user.id, {
        token_balance: newBalance,
        lifetime_tokens_purchased: (user.lifetime_tokens_purchased || 0) + manualTokens,
      });

      alert(`✅ Granted ${manualTokens} tokens!\nNew balance: ${newBalance}`);
      loadUser();
    } catch (error) {
      console.error('Failed to grant tokens:', error);
      alert(`❌ Failed to grant tokens: ${error.message}`);
    } finally {
      setIsGranting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="outline" className="border-purple-500 text-purple-300 hover:bg-purple-800/50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <Zap className="w-8 h-8 text-purple-400" />
          Gumroad Webhook Tester
        </h1>

        {/* Current User Info */}
        {user && (
          <div className="bg-slate-900/50 border border-purple-500/40 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-400" />
              Your Account
            </h2>
            <div className="space-y-2 text-white/80">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Token Balance:</strong> <span className="text-2xl font-bold text-amber-400">{user.token_balance || 0}</span> tokens</p>
              <p><strong>Subscription:</strong> {user.subscription_tier || 'free'}</p>
              <p><strong>Lifetime Purchased:</strong> {user.lifetime_tokens_purchased || 0} tokens</p>
            </div>
            <Button onClick={loadUser} variant="outline" className="mt-4 border-purple-500 text-purple-300">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Balance
            </Button>
          </div>
        )}

        {/* Test Instructions */}
        <div className="bg-blue-900/20 border border-blue-500/40 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">📋 Testing Instructions</h2>
          <ol className="space-y-3 text-white/80 list-decimal list-inside">
            <li>Make sure your Gumroad webhook is configured</li>
            <li><strong>Option A:</strong> Click "Test Webhook" below to simulate a 20-token purchase</li>
            <li><strong>Option B:</strong> Use "Manual Token Grant" for instant tokens (testing only)</li>
            <li><strong>Option C:</strong> Make a real $1.99 purchase on Gumroad</li>
            <li>Check if your token balance increased</li>
          </ol>
        </div>

        {/* Test Webhook Button */}
        <div className="bg-slate-900/50 border border-purple-500/40 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">🧪 Simulate Webhook</h2>
          <p className="text-white/70 mb-4">
            This will simulate a Gumroad purchase of 20 tokens to your email ({user?.email})
          </p>
          <Button
            onClick={testWebhookManually}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
            disabled={!user}
          >
            <Zap className="w-5 h-5 mr-2" />
            Test Webhook (20 Tokens)
          </Button>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`border rounded-2xl p-6 mb-6 ${
            testResult.status === 'success' ? 'bg-green-900/20 border-green-500/40' :
            testResult.status === 'error' ? 'bg-red-900/20 border-red-500/40' :
            'bg-yellow-900/20 border-yellow-500/40'
          }`}>
            <div className="flex items-start gap-3">
              {testResult.status === 'success' && <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />}
              {testResult.status === 'error' && <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />}
              {testResult.status === 'testing' && <Loader2 className="w-6 h-6 text-yellow-400 animate-spin flex-shrink-0 mt-1" />}
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2">{testResult.message}</h3>
                {testResult.details && (
                  <pre className="bg-black/30 p-4 rounded-lg overflow-x-auto text-sm mt-3">
                    {JSON.stringify(testResult.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Manual Token Grant (Admin/Testing) */}
        <div className="bg-slate-900/50 border border-amber-500/40 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-amber-300">⚡ Manual Token Grant (Testing Only)</h2>
          <p className="text-white/70 mb-4">
            Grant yourself tokens directly without going through Gumroad (for testing purposes)
          </p>
          <div className="flex gap-3">
            <Input
              type="number"
              value={manualTokens}
              onChange={(e) => setManualTokens(parseInt(e.target.value) || 0)}
              placeholder="Number of tokens"
              className="bg-slate-800 border-amber-700 text-white"
              min="1"
            />
            <Button
              onClick={manuallyGrantTokens}
              disabled={isGranting || !user}
              className="bg-amber-600 hover:bg-amber-700 whitespace-nowrap"
            >
              {isGranting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Coins className="w-4 h-4 mr-2" />
              )}
              Grant Tokens
            </Button>
          </div>
        </div>

        {/* Product Mapping Reference */}
        <div className="bg-slate-900/50 border border-purple-500/40 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">📦 Product Mapping</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10">
                <tr className="text-left">
                  <th className="pb-2 pr-4">Permalink</th>
                  <th className="pb-2 pr-4">Product</th>
                  <th className="pb-2 pr-4">Tokens</th>
                  <th className="pb-2">Type</th>
                </tr>
              </thead>
              <tbody className="text-white/70">
                <tr className="border-b border-white/5">
                  <td className="py-2 pr-4"><code className="bg-black/30 px-2 py-1 rounded text-purple-300">ghsad</code></td>
                  <td className="py-2 pr-4">Mystic Tier</td>
                  <td className="py-2 pr-4">50/month</td>
                  <td className="py-2">Subscription</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 pr-4"><code className="bg-black/30 px-2 py-1 rounded text-purple-300">ibcai</code></td>
                  <td className="py-2 pr-4">Oracle Pro</td>
                  <td className="py-2 pr-4">150/month</td>
                  <td className="py-2">Subscription</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 pr-4"><code className="bg-black/30 px-2 py-1 rounded text-purple-300">wxnje</code></td>
                  <td className="py-2 pr-4">Creator Studio</td>
                  <td className="py-2 pr-4">400/month</td>
                  <td className="py-2">Subscription</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 pr-4"><code className="bg-black/30 px-2 py-1 rounded text-purple-300">jcxfui</code></td>
                  <td className="py-2 pr-4">20 Tokens</td>
                  <td className="py-2 pr-4">20</td>
                  <td className="py-2">One-time</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 pr-4"><code className="bg-black/30 px-2 py-1 rounded text-purple-300">bhzra</code></td>
                  <td className="py-2 pr-4">50 Tokens</td>
                  <td className="py-2 pr-4">50</td>
                  <td className="py-2">One-time</td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-2 pr-4"><code className="bg-black/30 px-2 py-1 rounded text-purple-300">harwmx</code></td>
                  <td className="py-2 pr-4">100 Tokens</td>
                  <td className="py-2 pr-4">100</td>
                  <td className="py-2">One-time</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4"><code className="bg-black/30 px-2 py-1 rounded text-purple-300">ndqug</code></td>
                  <td className="py-2 pr-4">200 Tokens</td>
                  <td className="py-2 pr-4">200</td>
                  <td className="py-2">One-time</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}