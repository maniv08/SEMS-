import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { DataTable } from '../../components/shared/DataTable';
import api from '../../lib/axios';

export function AdminBuildings() {
  const [buildings, setBuildings] = useState([]);
  
  useEffect(() => {
    api.get('/buildings').then(res => setBuildings(res.data.data.items || []));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin Buildings</h1>
      <Card>
        <CardHeader><CardTitle>All Buildings</CardTitle></CardHeader>
        <CardContent>
          <DataTable 
            columns={[
              { header: 'Name', accessorKey: 'name' },
              { header: 'Address', accessorKey: 'address' },
              { header: 'City', accessorKey: 'city' }
            ]}
            data={buildings}
          />
        </CardContent>
      </Card>
    </div>
  );
}
