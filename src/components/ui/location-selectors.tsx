'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getRegions, getCommunesByRegion, Region, Commune } from '@/lib/chile-locations';

interface LocationSelectorsProps {
  selectedRegion: string;
  selectedCommune: string;
  onRegionChange: (regionId: string) => void;
  onCommuneChange: (communeName: string) => void;
  regionLabel?: string;
  communeLabel?: string;
  regionPlaceholder?: string;
  communePlaceholder?: string;
}

export function LocationSelectors({
  selectedRegion,
  selectedCommune,
  onRegionChange,
  onCommuneChange,
  regionLabel = 'Región',
  communeLabel = 'Comuna',
  regionPlaceholder = 'Selecciona región',
  communePlaceholder = 'Selecciona comuna',
}: LocationSelectorsProps) {
  const [regions] = useState<Region[]>(getRegions());
  const [communes, setCommunes] = useState<Commune[]>([]);

  useEffect(() => {
    if (selectedRegion) {
      setCommunes(getCommunesByRegion(selectedRegion));
    } else {
      setCommunes([]);
    }
  }, [selectedRegion]);

  const handleRegionChange = (regionId: string) => {
    onRegionChange(regionId);
    onCommuneChange(''); // Limpiar comuna cuando cambia la región
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="region">{regionLabel}</Label>
        <Select value={selectedRegion} onValueChange={handleRegionChange}>
          <SelectTrigger>
            <SelectValue placeholder={regionPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {regions.map(region => (
              <SelectItem key={region.id} value={region.id}>
                {region.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="commune">{communeLabel}</Label>
        <Select value={selectedCommune} onValueChange={onCommuneChange} disabled={!selectedRegion}>
          <SelectTrigger>
            <SelectValue placeholder={communePlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {communes.map(commune => (
              <SelectItem key={commune.id} value={commune.name}>
                {commune.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
