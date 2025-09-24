'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/components/notifications/NotificationSystem';

interface Signer {
  id: string;
  email: string;
  name: string;
  rut?: string;
  phone?: string;
  order: number;
  isRequired: boolean;
}

interface SignerManagerProps {
  signers: Signer[];
  onSignersChange: (signers: Signer[]) => void;
  maxSigners?: number;
}

export const SignerManager: React.FC<SignerManagerProps> = ({
  signers,
  onSignersChange,
  maxSigners = 10
}) => {
  const { error } = useToast();

  const addSigner = () => {
    if (signers.length >= maxSigners) {
      error('Error', `Máximo ${maxSigners} firmantes permitidos`);
      return;
    }

    const newSigner: Signer = {
      id: Date.now().toString(),
      email: '',
      name: '',
      rut: '',
      phone: '',
      order: signers.length + 1,
      isRequired: false,
    };

    onSignersChange([...signers, newSigner]);
  };

  const removeSigner = (id: string) => {
    if (signers.length <= 1) {
      error('Error', 'Debe haber al menos un firmante');
      return;
    }

    const updatedSigners = signers.filter(signer => signer.id !== id);
    // Reordenar los firmantes restantes
    const reorderedSigners = updatedSigners.map((signer, index) => ({
      ...signer,
      order: index + 1
    }));

    onSignersChange(reorderedSigners);
  };

  const updateSigner = (id: string, field: keyof Signer, value: any) => {
    const updatedSigners = signers.map(signer =>
      signer.id === id ? { ...signer, [field]: value } : signer
    );
    onSignersChange(updatedSigners);
  };

  const validateSigner = (signer: Signer): boolean => {
    if (!signer.email || !signer.name) {
      return false;
    }
    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(signer.email);
  };

  const isValid = signers.every(validateSigner);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Gestionar Firmantes
          <Badge variant="secondary">{signers.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {signers.map((signer, index) => (
          <div key={signer.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Firmante {index + 1}</h4>
              <div className="flex items-center gap-2">
                {signer.isRequired && (
                  <Badge variant="destructive">Obligatorio</Badge>
                )}
                {signers.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeSigner(signer.id)}
                    aria-label={`Remover firmante ${index + 1}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor={`name-${signer.id}`}>Nombre completo *</Label>
                <Input
                  id={`name-${signer.id}`}
                  value={signer.name}
                  onChange={(e) => updateSigner(signer.id, 'name', e.target.value)}
                  placeholder="Juan Pérez"
                  required
                  aria-describedby={`name-error-${signer.id}`}
                />
              </div>

              <div>
                <Label htmlFor={`email-${signer.id}`}>Email *</Label>
                <Input
                  id={`email-${signer.id}`}
                  type="email"
                  value={signer.email}
                  onChange={(e) => updateSigner(signer.id, 'email', e.target.value)}
                  placeholder="juan@example.com"
                  required
                  aria-describedby={`email-error-${signer.id}`}
                />
              </div>

              <div>
                <Label htmlFor={`rut-${signer.id}`}>RUT (opcional)</Label>
                <Input
                  id={`rut-${signer.id}`}
                  value={signer.rut || ''}
                  onChange={(e) => updateSigner(signer.id, 'rut', e.target.value)}
                  placeholder="12.345.678-9"
                />
              </div>

              <div>
                <Label htmlFor={`phone-${signer.id}`}>Teléfono (opcional)</Label>
                <Input
                  id={`phone-${signer.id}`}
                  value={signer.phone || ''}
                  onChange={(e) => updateSigner(signer.id, 'phone', e.target.value)}
                  placeholder="+569 1234 5678"
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={addSigner}
            disabled={signers.length >= maxSigners}
            aria-label="Agregar nuevo firmante"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Firmante
          </Button>

          {!isValid && (
            <span className="text-sm text-destructive">
              Complete todos los campos requeridos
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SignerManager;
