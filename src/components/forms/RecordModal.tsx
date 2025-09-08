'use client';

import RecordForm from './RecordForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface RecordModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'property' | 'client' | 'contract' | 'ticket' | 'maintenance' | 'payment'
  onSubmit: (data: any) => void
  initialData?: any
  mode?: 'create' | 'edit'
}

export default function RecordModal({
  isOpen,
  onClose,
  type,
  onSubmit,
  initialData,
  mode = 'create',
}: RecordModalProps) {
  const handleSubmit = (data: any) => {
    onSubmit(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Crear' : 'Editar'}{' '}
            {type === 'property' && 'Propiedad'}
            {type === 'client' && 'Cliente'}
            {type === 'contract' && 'Contrato'}
            {type === 'ticket' && 'Ticket'}
            {type === 'maintenance' && 'Solicitud de Mantenimiento'}
            {type === 'payment' && 'Pago'}
          </DialogTitle>
        </DialogHeader>
        
        <RecordForm
          type={type}
          onSubmit={handleSubmit}
          onCancel={onClose}
          initialData={initialData}
          mode={mode}
        />
      </DialogContent>
    </Dialog>
  );
}
