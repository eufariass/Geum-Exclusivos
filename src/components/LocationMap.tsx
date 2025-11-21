import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LocationMapProps {
  cep?: string;
  endereco: string;
}

interface Coordinates {
  lat: number;
  lng: number;
}

export const LocationMap = ({ cep, endereco }: LocationMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para buscar coordenadas usando Nominatim (OpenStreetMap)
  const fetchCoordinatesFromCEP = async (cep: string): Promise<Coordinates | null> => {
    try {
      // Remove caracteres não numéricos do CEP
      const cleanCEP = cep.replace(/\D/g, '');
      
      if (cleanCEP.length !== 8) {
        return null;
      }

      // Usar Nominatim do OpenStreetMap para geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${cleanCEP}&country=Brazil&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'Geum Imoveis App'
          }
        }
      );

      const data = await response.json();

      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar coordenadas do CEP:', error);
      return null;
    }
  };

  // Coordenadas aproximadas do centro de Londrina como fallback
  const getApproximateCoordinates = (endereco: string): Coordinates => {
    const regioes: { [key: string]: Coordinates } = {
      'centro': { lat: -23.3045, lng: -51.1696 },
      'gleba': { lat: -23.3350, lng: -51.1900 },
      'jardim': { lat: -23.2900, lng: -51.1500 },
      'lago': { lat: -23.3200, lng: -51.1400 },
    };
    
    const enderecoLower = endereco.toLowerCase();
    for (const [key, coords] of Object.entries(regioes)) {
      if (enderecoLower.includes(key)) {
        return coords;
      }
    }
    
    return { lat: -23.3045, lng: -51.1696 };
  };

  useEffect(() => {
    const loadCoordinates = async () => {
      setLoading(true);
      
      if (cep) {
        const coords = await fetchCoordinatesFromCEP(cep);
        if (coords) {
          setCoordinates(coords);
        } else {
          setCoordinates(getApproximateCoordinates(endereco));
        }
      } else {
        setCoordinates(getApproximateCoordinates(endereco));
      }
      
      setLoading(false);
    };

    loadCoordinates();
  }, [cep, endereco]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || !coordinates || loading) return;

    const radius = 300; // Raio em metros

    // Criar o mapa
    const map = L.map(mapRef.current).setView([coordinates.lat, coordinates.lng], 15);
    mapInstanceRef.current = map;

    // Adicionar camada de tiles do OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Adicionar círculo para mostrar área aproximada
    L.circle([coordinates.lat, coordinates.lng], {
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
  }, [coordinates, loading]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Localização Aproximada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[400px] flex items-center justify-center bg-muted rounded-lg">
            <p className="text-muted-foreground">Carregando mapa...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
