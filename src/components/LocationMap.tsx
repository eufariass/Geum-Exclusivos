import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LocationMapProps {
  endereco: string;
}

export const LocationMap = ({ endereco }: LocationMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Coordenadas aproximadas do centro de Londrina como fallback
  const getApproximateCoordinates = (endereco: string): [number, number] => {
    // Coordenadas aproximadas de diferentes regiões de Londrina
    const regioes: { [key: string]: [number, number] } = {
      'centro': [-23.3045, -51.1696],
      'gleba': [-23.3350, -51.1900],
      'jardim': [-23.2900, -51.1500],
      'lago': [-23.3200, -51.1400],
    };
    
    // Tenta identificar a região pelo endereço
    const enderecoLower = endereco.toLowerCase();
    for (const [key, coords] of Object.entries(regioes)) {
      if (enderecoLower.includes(key)) {
        return coords;
      }
    }
    
    // Retorna centro de Londrina como padrão
    return [-23.3045, -51.1696];
  };

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const center = getApproximateCoordinates(endereco);
    const radius = 300; // Raio em metros

    // Criar o mapa
    const map = L.map(mapRef.current).setView(center, 15);
    mapInstanceRef.current = map;

    // Adicionar camada de tiles do OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Adicionar círculo para mostrar área aproximada
    L.circle(center, {
      radius: radius,
      fillColor: '#8B5CF6',
      fillOpacity: 0.35,
      color: '#8B5CF6',
      weight: 2,
      opacity: 0.7,
    }).addTo(map);

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [endereco]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Localização Aproximada</CardTitle>
        <p className="text-sm text-muted-foreground">
          Região do imóvel - localização exata disponível mediante agendamento
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div 
          ref={mapRef} 
          className="w-full h-[400px] rounded-b-lg"
          style={{ zIndex: 0 }}
        />
      </CardContent>
    </Card>
  );
};
