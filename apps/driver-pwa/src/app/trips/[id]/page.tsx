'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Truck, MapPin, Package, CheckCircle, Camera, Pen } from 'lucide-react';

const sopChecklist = [
  { id: '1', label: 'Vehicle inspected', completed: false },
  { id: '2', label: 'Cargo secured properly', completed: false },
  { id: '3', label: 'Handling tags verified', completed: false },
  { id: '4', label: 'Safety compliance confirmed', completed: false },
];

export function generateStaticParams() {
  return [{ id: 'TRIP-2024-001' }, { id: 'TRIP-2024-002' }];
}

export default function TripDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [checklist, setChecklist] = useState(sopChecklist);
  const [tripStatus, setTripStatus] = useState('SOP_CHECKLIST_PENDING');

  const toggleChecklist = (id: string) => {
    setChecklist(checklist.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const allCompleted = checklist.every(item => item.completed);

  const startTrip = () => {
    if (!allCompleted) {
      alert('Please complete all SOP checklist items');
      return;
    }
    setTripStatus('IN_TRANSIT');
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="bg-slate-900 text-white p-4">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="text-white">
            ← Back
          </button>
          <h1 className="text-lg font-semibold ml-2">Trip {params.id}</h1>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Trip Status */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Status</span>
            <span className={`status-badge ${
              tripStatus === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {tripStatus.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Trip Details */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-3">Order Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">Pickup</p>
                <p className="text-gray-600">Industrial Zone A, Lagos</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">Delivery</p>
                <p className="text-gray-600">Factory Complex B, Ogun</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Package className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">Cargo</p>
                <p className="text-gray-600">Industrial machinery parts (5000kg)</p>
                <p className="text-xs text-gray-500">Tags: Fragile, Heavy</p>
              </div>
            </div>
          </div>
        </div>

        {/* SOP Checklist */}
        {tripStatus === 'SOP_CHECKLIST_PENDING' && (
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-3">SOP Checklist</h2>
            <p className="text-sm text-gray-500 mb-3">Complete all items before starting trip</p>
            <div className="space-y-2">
              {checklist.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer active:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleChecklist(item.id)}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <span className={`${item.completed ? 'line-through text-gray-400' : ''}`}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {tripStatus === 'SOP_CHECKLIST_PENDING' ? (
            <button
              onClick={startTrip}
              disabled={!allCompleted}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Trip
            </button>
          ) : (
            <>
              <button className="w-full btn-primary flex items-center justify-center gap-2">
                <Camera className="w-5 h-5" />
                Capture POD
              </button>
              <button className="w-full btn-secondary flex items-center justify-center gap-2">
                <Pen className="w-5 h-5" />
                Get Signature
              </button>
              <button className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Complete Delivery
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
