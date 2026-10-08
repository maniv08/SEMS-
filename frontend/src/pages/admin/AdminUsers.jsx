import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/shared/DataTable';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import api from '../../lib/axios';

export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const { showToast } = useToast();

  const fetchUsers = () => api.get('/users').then(res => setUsers(res.data.data.items || []));
  useEffect(() => { fetchUsers(); }, []);

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.patch(`/users/${id}`, { isActive: !currentStatus });
      showToast('User status updated');
      fetchUsers();
    } catch (e) {
      showToast('Update failed', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Manage Users</h1>
      <Card>
        <DataTable 
          columns={[
            { header: 'Name', accessorKey: 'name' },
            { header: 'Email', accessorKey: 'email' },
            { header: 'Role', cell: row => <span className="capitalize">{row.role}</span> },
            { header: 'Status', cell: row => row.isActive ? <span className="text-brand font-medium">Active</span> : <span className="text-critical font-medium">Inactive</span> },
            { header: 'Joined', cell: row => new Date(row.createdAt).toLocaleDateString() },
            { header: 'Actions', cell: row => (
                row.role !== 'admin' ? 
                <Button variant={row.isActive ? 'danger' : 'primary'} onClick={() => toggleStatus(row._id, row.isActive)}>
                  {row.isActive ? 'Deactivate' : 'Activate'}
                </Button> : null
              ) 
            }
          ]}
          data={users}
        />
      </Card>
    </div>
  );
}
