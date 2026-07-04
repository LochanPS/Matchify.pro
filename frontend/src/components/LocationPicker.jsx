import { useEffect, useRef, useState } from 'react';

// Free venue-location picker — OpenStreetMap tiles via Leaflet (no API key, no cost).
// Organizer searches an address or taps/drags a pin; we store latitude/longitude.
// Viewers later get an "Open in Google Maps" link built from those coordinates.

let leafletPromise = null;
function loadLeaflet() {
  if (typeof window !== 'undefined' && window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-leaflet]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.setAttribute('data-leaflet', '1');
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error('leaflet-load-failed'));
    document.head.appendChild(script);
  });
  return leafletPromise;
}

const INDIA_CENTER = [20.5937, 78.9629];

export default function LocationPicker({ latitude, longitude, locationName, onChange }) {
  const mapDiv = useRef(null);
  const mapObj = useRef(null);
  const marker = useRef(null);
  const setPinRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const nameRef = useRef(locationName || '');
  onChangeRef.current = onChange;
  nameRef.current = locationName || '';

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [note, setNote] = useState(null);

  const hasPin = latitude != null && longitude != null;

  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !mapDiv.current || mapObj.current) return;

        const startLat = latitude != null ? latitude : INDIA_CENTER[0];
        const startLng = longitude != null ? longitude : INDIA_CENTER[1];
        const startZoom = latitude != null ? 15 : 4;

        const map = L.map(mapDiv.current, { attributionControl: true }).setView([startLat, startLng], startZoom);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);
        mapObj.current = map;

        const icon = L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41], iconAnchor: [12, 41],
        });

        const emit = (lat, lng, name) => {
          onChangeRef.current?.({
            latitude: +(+lat).toFixed(6),
            longitude: +(+lng).toFixed(6),
            locationName: name != null ? name : nameRef.current,
          });
        };

        const attachDrag = () => {
          marker.current.on('dragend', () => {
            const p = marker.current.getLatLng();
            emit(p.lat, p.lng);
          });
        };

        const setPin = (lat, lng, name) => {
          if (!marker.current) {
            marker.current = L.marker([lat, lng], { draggable: true, icon }).addTo(map);
            attachDrag();
          } else {
            marker.current.setLatLng([lat, lng]);
          }
          map.setView([lat, lng], Math.max(map.getZoom(), 15));
          emit(lat, lng, name);
        };
        setPinRef.current = setPin;

        if (hasPin) {
          marker.current = L.marker([latitude, longitude], { draggable: true, icon }).addTo(map);
          attachDrag();
        }

        map.on('click', (e) => setPin(e.latlng.lat, e.latlng.lng));

        // The map often mounts inside a step that sizes after paint — recalc tiles.
        setTimeout(() => map.invalidateSize(), 250);
      })
      .catch(() => setNote('Map could not load. You can still enter the venue address above and skip the map.'));

    return () => {
      cancelled = true;
      if (mapObj.current) { mapObj.current.remove(); mapObj.current = null; marker.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doSearch = async (e) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setNote(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
        { headers: { 'Accept': 'application/json' } }
      );
      const arr = await res.json();
      if (arr && arr[0] && setPinRef.current) {
        setPinRef.current(parseFloat(arr[0].lat), parseFloat(arr[0].lon), q);
      } else {
        setNote('No place found. Try a different search, or tap the map to drop the pin yourself.');
      }
    } catch {
      setNote('Search unavailable right now — tap the map to drop the pin manually.');
    } finally {
      setSearching(false);
    }
  };

  const clearPin = () => {
    if (marker.current && mapObj.current) { mapObj.current.removeLayer(marker.current); marker.current = null; }
    onChangeRef.current?.({ latitude: null, longitude: null, locationName: '' });
  };

  return (
    <div>
      <label className="block text-xs font-bold text-cyan-400 mb-1.5">
        Location on map <span className="text-gray-500 font-normal">(optional)</span>
      </label>

      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') doSearch(e); }}
          placeholder="Search the venue or address…"
          className="flex-1 px-3 py-2.5 text-sm rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 transition-all"
          style={{ background: 'rgba(0,0,0,0.3)', border: '1.5px solid rgba(245,158,11,0.3)' }}
        />
        <button
          type="button"
          onClick={doSearch}
          disabled={searching}
          className="px-4 py-2.5 text-sm font-bold rounded-xl text-black flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#FCD34D,#D97706)', opacity: searching ? 0.6 : 1 }}
        >
          {searching ? '…' : 'Search'}
        </button>
      </div>

      <div
        ref={mapDiv}
        style={{ height: '220px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1.5px solid rgba(245,158,11,0.3)', background: 'rgba(0,0,0,0.3)' }}
      />

      <p className="mt-1.5 text-xs text-gray-500">
        Tap the map to drop a pin, or drag it to fine-tune. This lets participants open the exact venue in Google Maps.
      </p>

      {note && <p className="mt-1 text-xs text-amber-400">{note}</p>}

      {hasPin && (
        <div className="mt-1.5 flex items-center justify-between text-xs">
          <span className="text-emerald-400">
            📍 Pin set{locationName ? `: ${locationName}` : ''} ({Number(latitude).toFixed(4)}, {Number(longitude).toFixed(4)})
          </span>
          <button type="button" onClick={clearPin} className="text-red-400 font-semibold">Remove pin</button>
        </div>
      )}
    </div>
  );
}
