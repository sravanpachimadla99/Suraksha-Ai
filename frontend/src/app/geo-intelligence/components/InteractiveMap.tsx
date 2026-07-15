"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, LayerGroup, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { renderToString } from 'react-dom/server';

// Setup custom icons since leaflet default marker images don't load nicely in next.js
const createCustomIcon = (risk: string) => {
  const color = risk === 'HIGH' ? 'text-red-500' : risk === 'MEDIUM' ? 'text-amber-500' : 'text-emerald-500';
  const html = renderToString(
    <div className={`${color} bg-slate-900 rounded-full p-1 border-2 border-current shadow-lg`}>
      <ShieldAlert size={16} />
    </div>
  );
  
  return L.divIcon({
    html,
    className: 'custom-leaflet-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
};

interface MapProps {
  incidents: any[];
  clusters: any[];
}

export default function InteractiveMap({ incidents, clusters }: MapProps) {
  // Center roughly on India
  const center: [number, number] = [20.5937, 78.9629];
  
  return (
    <div className="h-full w-full bg-slate-900 relative">
      <MapContainer 
        center={center} 
        zoom={5} 
        style={{ height: '100%', width: '100%', background: '#0f172a' }}
        zoomControl={true}
      >
        <LayersControl position="topright">
          
          <LayersControl.BaseLayer checked name="Dark Matter (CartoDB)">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='Tiles &copy; Esri'
            />
          </LayersControl.BaseLayer>

          <LayersControl.Overlay checked name="Incidents">
            <LayerGroup>
              {incidents.map((incident, idx) => (
                <Marker 
                  key={`inc-${idx}`} 
                  position={[incident.latitude, incident.longitude]}
                  icon={createCustomIcon(incident.risk_level)}
                >
                  <Popup className="custom-popup">
                    <div className="bg-slate-900 text-slate-200 p-2 rounded max-w-xs">
                      <div className="text-xs uppercase font-bold text-slate-500 mb-1">{incident.category}</div>
                      <div className="font-semibold text-white">{incident.city}</div>
                      <div className={`text-xs mt-1 font-bold ${incident.risk_level === 'HIGH' ? 'text-red-500' : 'text-amber-500'}`}>
                        Risk: {incident.risk_level}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="AI Clusters (Hotspots)">
            <LayerGroup>
              {clusters.map((cluster, idx) => (
                <Circle 
                  key={`cluster-${idx}`}
                  center={[cluster.center_lat, cluster.center_lng]}
                  radius={50000} // 50km radius for visual
                  pathOptions={{ 
                    fillColor: '#ef4444', 
                    color: '#ef4444',
                    weight: 2,
                    fillOpacity: 0.2
                  }}
                >
                  <Popup>
                    <div className="bg-slate-900 text-slate-200 p-2">
                      <div className="text-sm font-bold text-red-500 flex items-center gap-1">
                        <AlertTriangle size={14} /> Emerging Hotspot
                      </div>
                      <div className="text-xs mt-1">Cluster ID: {cluster.cluster_id}</div>
                      <div className="text-xs">Incidents: {cluster.incident_count}</div>
                    </div>
                  </Popup>
                </Circle>
              ))}
            </LayerGroup>
          </LayersControl.Overlay>

          <LayersControl.Overlay checked name="Cyber Police Stations (India)">
            <LayerGroup>
              {[
                { name: "Gurgaon Cyber Police Cell", lat: 28.4595, lng: 77.0266 },
                { name: "Delhi Cyber Crime HQ (Dwarka)", lat: 28.5859, lng: 77.0505 },
                { name: "Bangalore Cyber Cell (Infantry Road)", lat: 12.9818, lng: 77.5960 },
                { name: "Mumbai Cyber Cell (BKC)", lat: 19.0596, lng: 72.8722 }
              ].map((ps, idx) => (
                <Marker 
                  key={`ps-${idx}`} 
                  position={[ps.lat, ps.lng]}
                  icon={L.divIcon({
                    html: renderToString(
                      <div className="text-blue-400 bg-slate-900 rounded-full p-1 border-2 border-current shadow-lg">
                        <ShieldAlert size={16} />
                      </div>
                    ),
                    className: 'custom-leaflet-icon',
                    iconSize: [28, 28],
                    iconAnchor: [14, 14]
                  })}
                >
                  <Popup>
                    <div className="bg-slate-900 text-slate-200 p-2 rounded">
                      <div className="text-xs uppercase font-bold text-blue-400 mb-1">Police Station</div>
                      <div className="font-semibold text-white">{ps.name}</div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </LayerGroup>
          </LayersControl.Overlay>

        </LayersControl>
      </MapContainer>
      
      {/* Required css overrides to make popup dark theme friendly */}
      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-popup-content-wrapper {
          background-color: #0f172a;
          color: #f1f5f9;
          border: 1px solid #1e293b;
        }
        .leaflet-popup-tip {
          background-color: #0f172a;
          border-top: 1px solid #1e293b;
          border-left: 1px solid #1e293b;
        }
        .leaflet-container {
          font-family: inherit;
        }
      `}} />
    </div>
  );
}
