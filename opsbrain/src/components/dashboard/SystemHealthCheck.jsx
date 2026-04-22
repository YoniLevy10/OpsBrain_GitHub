import React, { useState, useEffect } from 'react';
import { opsbrain } from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, XCircle, Loader2 } from 'lucide-react';

export default function SystemHealthCheck() {
  const [health, setHealth] = useState({
    entities: {},
    overall: 'checking'
  });

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    const checks = {
      Client: { healthy: false, count: 0, error: null },
      Project: { healthy: false, count: 0, error: null },
      Task: { healthy: false, count: 0, error: null },
      Transaction: { healthy: false, count: 0, error: null },
      Invoice: { healthy: false, count: 0, error: null },
      Subscription: { healthy: false, count: 0, error: null },
      Business: { healthy: false, count: 0, error: null },
      AIInsight: { healthy: false, count: 0, error: null }
    };

    let overallHealthy = true;

    for (const entity of Object.keys(checks)) {
      try {
        const data = await opsbrain.entities[entity].list();
        checks[entity].healthy = true;
        checks[entity].count = data.length;
      } catch (error) {
        checks[entity].healthy = false;
        checks[entity].error = error.message;
        overallHealthy = false;
      }
    }

    setHealth({
      entities: checks,
      overall: overallHealthy ? 'healthy' : 'issues'
    });
  };

  const getStatusIcon = (healthy) => {
    if (healthy === null) return <Loader2 className="w-4 h-4 animate-spin text-gray-400" />;
    return healthy ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <XCircle className="w-4 h-4 text-red-600" />
    );
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          {health.overall === 'checking' && <Loader2 className="w-4 h-4 animate-spin" />}
          {health.overall === 'healthy' && <CheckCircle className="w-4 h-4 text-green-600" />}
          {health.overall === 'issues' && <AlertCircle className="w-4 h-4 text-red-600" />}
          System Health
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {Object.entries(health.entities).map(([entity, status]) => (
            <div key={entity} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              {getStatusIcon(status.healthy)}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{entity}</div>
                <div className="text-gray-500">{status.count} records</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}