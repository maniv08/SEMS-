import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/shared/DataTable';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import api from '../../lib/axios';

export function AdminUnits() {
  const [units, setUnits] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const { showToast } = useToast();

  const fetchUnits = () => api.get('/units').then(res => setUnits(res.data.data.items || []));
  useEffect(() => { fetchUnits(); }, []);

  const handleDelete = async () => {
    try {
      await api.delete(`/units/${deleteId}`);
      showToast('Unit deleted');
      fetchUnits();
    } catch (e) {
      showToast('Failed to delete unit', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Manage Units</h1>
      <Card>
        <DataTable 
          columns={[
            { header: 'Unit Name', accessorKey: 'name' },
            { header: 'Owner Email', accessorKey: 'ownerEmail' },
            { header: 'Limit (kWh)', accessorKey: 'monthlyLimitKwh' },
            { header: 'Type', accessorKey: 'unitType' },
            { header: 'Actions', cell: row => (
                <Button variant="danger" onClick={() => setDeleteId(row._id)}>Delete</Button>
              ) 
            }
          ]}
          data={units}
        />
      </Card>
      
      <ConfirmDialog 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Unit?"
        message="Are you sure you want to delete this unit? All energy history and alerts will be permanently removed."
        isDestructive={true}
      />
    </div>
  );
}
