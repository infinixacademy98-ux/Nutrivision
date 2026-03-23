import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Play, Pause, Square, Navigation, Activity, Clock, Flame, Map as MapIcon } from 'lucide-react';
import { UserProfile, Workout } from '../types';

// Fix Leaflet default icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Helper component to update map center
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

interface RunTrackerProps {
  profile: UserProfile;
  onSaveWorkout: (workout: Omit<Workout, 'uid'>) => void;
  onOpenWatchEntry: () => void;
}

// Haversine formula to calculate distance between two points in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export default function RunTracker({ profile, onSaveWorkout, onOpenWatchEntry }: RunTrackerProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [route, setRoute] = useState<[number, number][]>([]);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
  const watchId = useRef<number | null>(null);
  const timerId = useRef<number | null>(null);

  // Get initial position
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentPos([position.coords.latitude, position.coords.longitude]);
      },
      (error) => console.error("Initial GPS Error:", error),
      { enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    if (isTracking && !isPaused) {
      timerId.current = window.setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerId.current) clearInterval(timerId.current);
    }
    return () => {
      if (timerId.current) clearInterval(timerId.current);
    };
  }, [isTracking, isPaused]);

  const startTracking = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsTracking(true);
    setIsPaused(false);
    setRoute([]);
    setDistance(0);
    setDuration(0);

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newPos: [number, number] = [latitude, longitude];
        setCurrentPos(newPos);

        setRoute(prev => {
          if (prev.length > 0) {
            const lastPos = prev[prev.length - 1];
            const d = calculateDistance(lastPos[0], lastPos[1], newPos[0], newPos[1]);
            if (d > 0.005) { // Only add if moved more than 5 meters to avoid jitter
              setDistance(prevD => prevD + d);
              return [...prev, newPos];
            }
            return prev;
          }
          return [newPos];
        });
      },
      (error) => console.error(error),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const pauseTracking = () => {
    setIsPaused(true);
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  };

  const resumeTracking = () => {
    setIsPaused(false);
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newPos: [number, number] = [latitude, longitude];
        setCurrentPos(newPos);
        setRoute(prev => {
          if (prev.length > 0) {
            const lastPos = prev[prev.length - 1];
            const d = calculateDistance(lastPos[0], lastPos[1], newPos[0], newPos[1]);
            if (d > 0.005) {
              setDistance(prevD => prevD + d);
              return [...prev, newPos];
            }
            return prev;
          }
          return [newPos];
        });
      },
      (error) => console.error(error),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const stopTracking = () => {
    setIsTracking(false);
    setIsPaused(false);
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    if (timerId.current) clearInterval(timerId.current);

    // Calories = Distance (km) × Weight (kg) × 1.036
    const calories = distance * profile.weight * 1.036;
    const pace = distance > 0 ? (duration / 60) / distance : 0;

    onSaveWorkout({
      type: 'run',
      distance,
      duration,
      calories,
      pace,
      route: route.map(p => ({ lat: p[0], lng: p[1] })),
      timestamp: new Date().toISOString()
    });
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPace = (pace: number) => {
    if (pace === 0) return '0:00';
    const mins = Math.floor(pace);
    const secs = Math.round((pace - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const mapCenter: [number, number] = currentPos || [37.42, -122.08];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-100 h-[40vh] relative z-0">
        <MapContainer 
          center={mapCenter} 
          zoom={15} 
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
        >
          <ChangeView center={mapCenter} zoom={15} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {currentPos && (
            <Marker position={currentPos} />
          )}
          <Polyline positions={route} color="#FF6321" weight={4} opacity={0.8} />
        </MapContainer>
        
        {!isTracking && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[1000]">
            <button
              onClick={startTracking}
              className="bg-brand-orange text-white px-8 py-4 rounded-full font-black shadow-2xl shadow-brand-orange/40 flex items-center gap-3 hover:bg-brand-orange/90 transition-all transform hover:scale-105 active:scale-95"
            >
              <Play className="w-6 h-6 fill-current" />
              START RUN
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm">
          <div className="flex items-center gap-2 text-stone-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Navigation className="w-3 h-3" />
            Distance
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-stone-900">{distance.toFixed(2)}</span>
            <span className="text-stone-400 font-medium">km</span>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm">
          <div className="flex items-center gap-2 text-stone-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Clock className="w-3 h-3" />
            Time
          </div>
          <div className="text-3xl font-bold text-stone-900">{formatTime(duration)}</div>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm">
          <div className="flex items-center gap-2 text-stone-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Activity className="w-3 h-3" />
            Pace
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-stone-900">{formatPace(distance > 0 ? (duration / 60) / distance : 0)}</span>
            <span className="text-stone-400 font-medium">/km</span>
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm">
          <div className="flex items-center gap-2 text-stone-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Flame className="w-3 h-3" />
            Calories
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-brand-orange">{Math.round(distance * profile.weight * 1.036)}</span>
            <span className="text-stone-400 font-medium">kcal</span>
          </div>
        </div>
      </div>

      {isTracking && (
        <div className="flex justify-center gap-4">
          {isPaused ? (
            <button
              onClick={resumeTracking}
              className="w-16 h-16 bg-brand-orange text-white rounded-full flex items-center justify-center shadow-lg shadow-brand-orange/20 hover:bg-brand-orange/90 transition-all active:scale-90"
            >
              <Play className="w-8 h-8 fill-current" />
            </button>
          ) : (
            <button
              onClick={pauseTracking}
              className="w-16 h-16 bg-brand-dark text-white rounded-full flex items-center justify-center shadow-lg hover:bg-brand-dark/90 transition-all active:scale-90"
            >
              <Pause className="w-8 h-8 fill-current" />
            </button>
          )}
          <button
            onClick={stopTracking}
            className="w-16 h-16 bg-stone-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-black transition-all active:scale-90"
          >
            <Square className="w-8 h-8 fill-current" />
          </button>
        </div>
      )}

      {!isTracking && (
        <div className="pt-4">
          <button
            onClick={onOpenWatchEntry}
            className="w-full bg-white border-2 border-stone-100 text-stone-600 font-black py-5 rounded-3xl flex items-center justify-center gap-3 shadow-sm hover:bg-stone-50 transition-all active:scale-95"
          >
            <Activity className="w-6 h-6 text-brand-orange" />
            IMPORT SMART WATCH DATA
          </button>
          <p className="text-center mt-4 text-[10px] text-stone-400 font-bold uppercase tracking-widest">
            Manually log calories, heart rate, and steps
          </p>
        </div>
      )}
    </div>
  );
}
