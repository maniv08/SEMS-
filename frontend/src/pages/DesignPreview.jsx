import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { ProgressGauge } from '../components/ui/ProgressGauge';
import { EmptyState } from '../components/shared/EmptyState';
import { ErrorState } from '../components/shared/ErrorState';
import { DataTable } from '../components/shared/DataTable';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../context/ToastContext';

export function DesignPreview() {
  const { showToast } = useToast();
  const [isModalOpen, setModalOpen] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [period, setPeriod] = useState('Day');

  return (
    <div className="space-y-8 pb-12">
      <section>
        <h2 className="text-xl font-bold mb-4">Typography & Colors</h2>
        <div className="flex gap-4 mb-4">
          <div className="w-16 h-16 bg-background border border-border rounded-md"></div>
          <div className="w-16 h-16 bg-surface border border-border rounded-md"></div>
          <div className="w-16 h-16 bg-brand rounded-md"></div>
          <div className="w-16 h-16 bg-accent rounded-md"></div>
          <div className="w-16 h-16 bg-warning rounded-md"></div>
          <div className="w-16 h-16 bg-critical rounded-md"></div>
          <div className="w-16 h-16 bg-violet rounded-md"></div>
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Page Title H1</h1>
          <p className="text-sm">Body text with tabular nums: <span className="tabular-nums">1,234.56</span></p>
          <p className="text-xs text-muted">Muted caption text</p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Buttons & Inputs</h2>
        <div className="flex gap-4 mb-4 items-center flex-wrap">
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="danger">Danger Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="grid grid-cols-2 gap-4 max-w-lg">
          <Input label="Standard Input" placeholder="Placeholder..." />
          <Input label="Error Input" defaultValue="Wrong value" error="Invalid format" />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Consumption</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tabular-nums">42.5 kWh</div>
              <div className="text-xs text-brand mt-1">+12% vs last week</div>
            </CardContent>
          </Card>
          
          <Card className="flex items-center justify-center p-6">
            <ProgressGauge percentage={47.3} />
          </Card>
          
          <Card className="flex flex-col justify-center items-center p-6 gap-4">
            <SegmentedControl 
              options={[{label: 'Day', value: 'Day'}, {label: 'Week', value: 'Week'}]} 
              value={period} 
              onChange={setPeriod} 
            />
            <Button onClick={() => showToast('Action successful!', 'success')}>Show Toast</Button>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">States & Modals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card><EmptyState title="No units found" description="Add your first unit to start monitoring." action={<Button>Add Unit</Button>} /></Card>
          <Card><ErrorState description="Failed to load data from server." onRetry={() => {}} /></Card>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
          <Button onClick={() => setConfirmOpen(true)} variant="danger">Open Confirm</Button>
        </div>
      </section>
      
      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Example Modal">
        <p className="text-sm text-muted mb-4">This is a standard modal for forms or info.</p>
        <Button onClick={() => setModalOpen(false)} className="w-full">Close</Button>
      </Modal>
      
      <ConfirmDialog 
        isOpen={isConfirmOpen} 
        onClose={() => setConfirmOpen(false)} 
        onConfirm={() => showToast('Deleted!', 'error')} 
        title="Delete Unit?" 
        message="Are you sure you want to delete this unit? This action cannot be undone." 
        isDestructive={true}
        confirmText="Delete"
      />
    </div>
  );
}
