import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useLanguage } from '../context/LanguageContext';
import { MapPin } from 'lucide-react';

// Fix leaflet default icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface UserLocation {
  email: string;
  name?: string;
  location: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
  lastSeen?: string;
  device?: string;
}

interface UserLocationMapProps {
  users: UserLocation[];
  language: 'en' | 'ne';
}

export const UserLocationMap: React.FC<UserLocationMapProps> = ({ users, language }) => {
  const hasLocations = users.some(u => u.location && typeof u.location.lat === 'number');

  if (!hasLocations) {
    return (
      <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-8 border border-slate-100 dark:border-white/5 text-center">
        <MapPin size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
          {language === 'en' ? 'No location data available' : 'स्थान डाटा उपलब्ध छैन'}
        </p>
        <p className="text-[10px] text-slate-400 mt-1">
          {language === 'en' ? 'Enable geolocation in settings to track users' : 'यूजरहरू ट्र्याक गर्न सेटिङमा भौगोलिक स्थान सक्रिय गर्नुहोस्'}
        </p>
      </div>
    );
  }

  const center = users.reduce((acc, u) => {
    if (u.location) {
      acc.lat += u.location.lat;
      acc.lng += u.location.lng;
    }
    return acc;
  }, { lat: 0, lng: 0 });

  center.lat = users.length > 0 ? center.lat / users.length : 27.7172;
  center.lng = users.length > 0 ? center.lng / users.length : 85.324;

  return (
    <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        style={{ height: '400px', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {users.filter(u => u.location && typeof u.location.lat === 'number').map((user) => (
          <Marker
            key={user.email}
            position={[user.location.lat, user.location.lng]}
          >
            <Popup>
              <div className="text-xs font-bold text-slate-800">
                {user.name || user.email}
              </div>
              <div className="text-[10px] text-slate-500">
                {user.email}
              </div>
              {user.lastSeen && (
                <div className="text-[10px] text-slate-400">
                  {language === 'en' ? 'Last seen' : 'अन्तिम पटक'}: {user.lastSeen}
                </div>
              )}
              <div className="text-[10px] text-slate-400 font-mono">
                {user.location.lat.toFixed(4)}, {user.location.lng.toFixed(4)}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
