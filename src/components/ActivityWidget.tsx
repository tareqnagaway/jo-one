import React from 'react';
import { Activity } from 'lucide-react';
import { Ride } from '../types';
import { cn } from '../lib/utils';

export default function ActivityWidget({ activities }: { activities: Ride[] }) {
  return (
    <div className="mx-4 mt-6">
      <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
        <Activity size={20} className="text-primary" />
        آخر الرحلات
      </h3>
      <div className="space-y-3">
        {activities.length > 0 ? (
          activities.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">رحلة من {item.pickup_address}</p>
                <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString()}</p>
              </div>
              <span className={cn("font-black text-gray-900")}>
                {item.fare} ج.أ
              </span>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center text-gray-400 text-sm">
            لم يتم العثور على رحلات حديثة.
          </div>
        )}
      </div>
    </div>
  );
}

