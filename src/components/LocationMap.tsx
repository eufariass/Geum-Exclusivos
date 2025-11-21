import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Token público do Mapbox para exibir o mapa na landing page
// Este token pode ser rotacionado a qualquer momento na sua conta Mapbox
const MAPBOX_TOKEN = 'pk.eyJ1IjoiZmVsaXBlZmFyaWFzMzYyOSIsImEiOiJjbWk5NnU5b2swazQ4MmxvYWd0a2xoNmV5In0.vVK5Q-UMqPUTiyJ17cI72w';

interface LocationMapProps {
  cep?: string;
  endereco: string;
}

interface Coordinates {
  lat: number;
  lng: number;
}

export const LocationMap = ({ cep, endereco }: LocationMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para buscar coordenadas usando o Mapbox Geocoding
  // 1º tenta pelo CEP; se não encontrar, usa o endereço completo do imóvel
  const fetchCoordinatesFromAddress = async (endereco: string, cep?: string): Promise<Coordinates | null> => {
    try {
      // Tentar buscar por CEP primeiro se disponível
      if (cep) {
        const cleanCEP = cep.replace(/\D/g, '');

        if (cleanCEP.length === 8) {
          const cepQuery = encodeURIComponent(`${cleanCEP}, Brasil`);
          const cepUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${cepQuery}.json?access_token=${MAPBOX_TOKEN}&limit=1&language=pt-BR`;

          const responseCEP = await fetch(cepUrl);
          const dataCEP = await responseCEP.json();

          if (dataCEP && Array.isArray(dataCEP.features) && dataCEP.features.length > 0) {
            const [lng, lat] = dataCEP.features[0].center;
            return { lat, lng };
          }
        }
      }

      // Se não encontrou por CEP, buscar pelo endereço completo incluindo cidade/estado
      const enderecoCompleto = `${endereco}, Londrina, Paraná, Brasil`;
      const addressQuery = encodeURIComponent(enderecoCompleto);
      const addressUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${addressQuery}.json?access_token=${MAPBOX_TOKEN}&limit=1&language=pt-BR`;

      const responseAddress = await fetch(addressUrl);
      const dataAddress = await responseAddress.json();

      if (dataAddress && Array.isArray(dataAddress.features) && dataAddress.features.length > 0) {
        const [lng, lat] = dataAddress.features[0].center;
        return { lat, lng };
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar coordenadas no Mapbox:', error);
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
      
      // Buscar coordenadas pelo endereço completo (e CEP se disponível)
      const coords = await fetchCoordinatesFromAddress(endereco, cep);
      
      if (coords) {
        setCoordinates(coords);
      } else {
        // Fallback para centro de Londrina se não encontrar
        setCoordinates(getApproximateCoordinates(endereco));
      }
      
      setLoading(false);
    };

    loadCoordinates();
  }, [cep, endereco]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !coordinates || loading) return;

    // Configura o token do Mapbox (público)
    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Criar mapa com estilo moderno
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/light-v11', // Estilo clean e moderno
      center: [coordinates.lng, coordinates.lat],
      zoom: 14.5,
      pitch: 45, // Inclinação 3D
      bearing: 0,
      antialias: true
    });

    mapRef.current = map;

    // Adicionar controles de navegação
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Quando o mapa carregar, adicionar círculo e efeitos
    map.on('load', () => {
      // Adicionar layer 3D de prédios
      const layers = map.getStyle().layers;
      const labelLayerId = layers?.find(
        (layer) => layer.type === 'symbol' && layer.layout && (layer.layout as any)['text-field']
      )?.id;

      if (labelLayerId) {
        map.addLayer(
          {
            id: 'add-3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            minzoom: 15,
            paint: {
              'fill-extrusion-color': '#aaa',
              'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['get', 'height']
              ],
              'fill-extrusion-base': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['get', 'min_height']
              ],
              'fill-extrusion-opacity': 0.6
            }
          },
          labelLayerId
        );
      }

      // Adicionar fonte de dados para o círculo
      map.addSource('location-circle', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [coordinates.lng, coordinates.lat]
          },
          properties: {}
        }
      });

      // Adicionar círculo com gradiente
      map.addLayer({
        id: 'location-circle-outer',
        type: 'circle',
        source: 'location-circle',
        paint: {
          'circle-radius': {
            stops: [
              [0, 0],
              [20, 300]
            ],
            base: 2
          },
          'circle-color': '#8B5CF6',
          'circle-opacity': 0.15,
          'circle-blur': 0.5
        }
      });

      // Adicionar círculo interno
      map.addLayer({
        id: 'location-circle-inner',
        type: 'circle',
        source: 'location-circle',
        paint: {
          'circle-radius': {
            stops: [
              [0, 0],
              [20, 150]
            ],
            base: 2
          },
          'circle-color': '#8B5CF6',
          'circle-opacity': 0.3,
          'circle-blur': 0.3
        }
      });

      // Adicionar ponto central
      map.addLayer({
        id: 'location-point',
        type: 'circle',
        source: 'location-circle',
        paint: {
          'circle-radius': 8,
          'circle-color': '#8B5CF6',
          'circle-opacity': 1,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 1
        }
      });
    });

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
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
          ref={mapContainerRef} 
          className="w-full h-[450px] rounded-b-lg"
          style={{ zIndex: 0 }}
        />
      </CardContent>
    </Card>
  );
};
