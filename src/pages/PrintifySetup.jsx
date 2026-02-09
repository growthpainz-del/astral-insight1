import React from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Store } from 'lucide-react';

export default function PrintifySetup() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [shops, setShops] = React.useState([]);
  const [selectedShopId, setSelectedShopId] = React.useState('');
  const [checkingOut, setCheckingOut] = React.useState(false);

  const fetchShops = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await base44.functions.invoke('printifyListShops');
      setShops(data?.shops || []);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load shops');
    } finally {
      setLoading(false);
    }
  };

  const handleTestCheckout = async () => {
    if (window.top !== window.self) {
      alert('Checkout only works from the published app. Please open your published app in a new tab.');
      return;
    }
    setCheckingOut(true);
    setError('');
    try {
      const { data } = await base44.functions.invoke('createStripeCheckout', {
        name: 'Tarot Deck Test',
        amount_cents: 500,
        quantity: 1,
        shop_id: selectedShopId || undefined,
      });
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setError('Failed to create checkout session.');
      }
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  React.useEffect(() => { fetchShops(); }, []);

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Store className="w-6 h-6 text-purple-400" />
          <h1 className="text-2xl md:text-3xl font-bold">Print On Demand · Printify</h1>
        </div>
        <p className="text-white/70">Pick your Printify shop to continue setting up tarot/oracle deck printing.</p>

        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-lg">Your Shops</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-white/80"><Loader2 className="w-5 h-5 animate-spin" /> Loading shops…</div>
            ) : error ? (
              <div className="text-red-300 text-sm">{error}</div>
            ) : (
              <div className="space-y-3">
                {shops.length === 0 && (
                  <div className="text-white/70 text-sm">No shops found. Ensure your Printify account has at least one shop.</div>
                )}
                <div className="grid gap-3">
                  {shops.map((s) => (
                    <label key={s.id} className={`flex items-center gap-3 p-3 rounded border cursor-pointer ${selectedShopId === String(s.id) ? 'border-purple-500/60 bg-white/10' : 'border-white/10 hover:bg-white/5'}`}>
                      <input
                        type="radio"
                        name="shop"
                        className="accent-purple-500"
                        checked={selectedShopId === String(s.id)}
                        onChange={() => setSelectedShopId(String(s.id))}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{s.title || s.name || `Shop ${s.id}`}</div>
                        <div className="text-xs text-white/60">ID: {s.id}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="pt-4 flex gap-2 flex-wrap">
                  <Button variant="outline" onClick={fetchShops}>
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleTestCheckout}
                    disabled={checkingOut}
                    className="gap-2"
                  >
                    {checkingOut ? (<><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</>) : 'Test $5 checkout'}
                  </Button>
                  <Button disabled={!selectedShopId} className="bg-purple-600 hover:bg-purple-700">
                    Continue
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}