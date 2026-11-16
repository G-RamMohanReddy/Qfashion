import { useEffect, useRef, useState } from 'react';

const start = { lat: 26.163, lng: 91.735 };
let mapsReady;

function loadMaps(key) {
  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google.maps);
  mapsReady ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&callback=qfDeliveryMapsReady`;
    script.async = true;
    window.qfDeliveryMapsReady = () => {
      delete window.qfDeliveryMapsReady;
      resolve(window.google.maps);
    };
    script.onerror = () => {
      delete window.qfDeliveryMapsReady;
      script.remove();
      reject(new Error('The map could not load. Use address search or your current location.'));
    };
    document.head.append(script);
  }).catch(error => {
    mapsReady = undefined;
    throw error;
  });
  return mapsReady;
}

export default function DeliveryMap({ apiKey, initialPin, onConfirm }) {
  const mapElement = useRef(null);
  const searchElement = useRef(null);
  const mapRef = useRef(null);
  const [center, setCenter] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    let idle, autocomplete, select;
    async function setup() {
      const maps = await loadMaps(apiKey);
      const [{ Map }, { PlaceAutocompleteElement }] = await Promise.all([
        maps.importLibrary('maps'), maps.importLibrary('places'),
      ]);
      if (!mounted) return;
      const map = new Map(mapElement.current, {
        center: initialPin || start,
        zoom: initialPin ? 17 : 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      mapRef.current = map;
      idle = map.addListener('idle', () => setCenter(map.getCenter()?.toJSON() || null));
      autocomplete = new PlaceAutocompleteElement({ includedRegionCodes: ['in'] });
      autocomplete.locationBias = { center: start, radius: 30000 };
      autocomplete.placeholder = 'Search your delivery address';
      autocomplete.style.width = '100%';
      select = async ({ placePrediction }) => {
        try {
          const place = placePrediction.toPlace();
          await place.fetchFields({ fields: ['location'] });
          if (!mounted || !place.location) return;
          map.panTo(place.location);
          map.setZoom(17);
          setError('');
        } catch {
          if (mounted) setError('Address lookup failed. Move the map to your delivery spot.');
        }
      };
      autocomplete.addEventListener('gmp-select', select);
      searchElement.current.append(autocomplete);
    }
    setup().catch(() => {
      if (mounted) setError('The map could not load. Use address search or your current location.');
    });
    return () => {
      mounted = false;
      idle?.remove();
      autocomplete?.removeEventListener('gmp-select', select);
      autocomplete?.remove();
      mapRef.current = null;
    };
  }, [apiKey, initialPin]);

  return <section className="space-y-2" aria-label="Choose delivery pin">
    <p className="text-sm">Search nearby, then drag the map until the pin marks your delivery entrance.</p>
    <div ref={searchElement} />
    <div className="relative">
      <div ref={mapElement} className="h-64 w-full overflow-hidden rounded-lg" aria-label="Map of delivery location" />
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full text-3xl">📍</div>
    </div>
    {error && <p role="alert">{error}</p>}
    <button type="button" className="btn-primary" disabled={!center} onClick={() => {
      const point = mapRef.current?.getCenter()?.toJSON();
      if (point) onConfirm({ ...point, label: 'Confirmed map pin' });
    }}>Confirm this pin</button>
  </section>;
}
