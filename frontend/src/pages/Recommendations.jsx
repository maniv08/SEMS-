import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import api from '../lib/axios';

export function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/recommendations').then(res => {
      // Backend returns { success: true, data: { recommendations: [...] } }
      const data = res.data.data;
      setRecommendations(data?.recommendations || data || []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Recommendations</h1>
      <div className="space-y-4">
        {loading ? <p>Loading recommendations...</p> : recommendations.length === 0 ? <p>No recommendations available.</p> :
          recommendations.map((rec, i) => (
            <Card key={i} className="bg-brand/5 border-brand/20">
              <CardHeader><CardTitle className="text-brand">{rec.title}</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-primary mb-2">{rec.description}</p>
              {rec.estimatedSavingRs > 0 && <div className="text-xs font-semibold text-brand">Potential Savings: ₹{rec.estimatedSavingRs}</div>}
              </CardContent>
            </Card>
          ))
        }
      </div>
    </div>
  );
}
