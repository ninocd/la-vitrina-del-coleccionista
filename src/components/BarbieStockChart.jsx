import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function BarbieStockChart({ data = [] }) {
  // Si no hay datos todavía, mostramos un mensaje de carga elegante en lugar de dar error
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 w-full max-w-md text-center py-12">
        <p className="text-sm text-gray-400">Cargando cotización bursátil...</p>
      </div>
    );
  }

  // Usamos operadores seguros (?.) por si algún elemento viene vacío
  const priceStart = data[0]?.price ?? 0;
  const priceEnd = data[data.length - 1]?.price ?? priceStart;
  const isUp = priceEnd >= priceStart;
  const strokeColor = isUp ? '#10B981' : '#EF4444'; // Verde si sube, rojo si baja

  return (
    <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 w-full max-w-md">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Cotización de Mercado</h3>
          <p className="text-2xl font-bold text-gray-800">€{Number(priceEnd).toFixed(2)}</p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {isUp ? '▲ Tendencia Alza' : '▼ Tendencia Baja'}
        </span>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1F2937', borderRadius: '8px', color: '#fff', border: 'none' }}
              formatter={(value) => [`€${value}`, 'Precio']}
              labelStyle={{ color: '#9CA3AF', fontSize: '12px' }}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke={strokeColor} 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorPrice)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}