import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import SpreadEditor from '@/components/spread/SpreadEditor';
import { Loader2 } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function SpreadDesigner() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const [spread, setSpread] = useState(null);
  const [loading, setLoading] = useState(!!id);
  const [me, setMe] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => {});
    
    if (id) {
      base44.entities.Spread.get(id)
        .then(setSpread)
        .catch(() => navigate(createPageUrl('SpreadManager')))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07050f]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07050f]">
      <SpreadEditor 
        spread={spread}
        user={me}
        onSave={() => navigate(createPageUrl('SpreadManager'))}
        onCancel={() => navigate(createPageUrl('SpreadManager'))}
      />
    </div>
  );
}