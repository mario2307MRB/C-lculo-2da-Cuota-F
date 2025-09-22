import React from 'react';
import type { Rendicion } from '../types';
import { TrashIcon, PlusIcon } from '../constants';
import { formatCLP, parseCLP } from '../utils/formatters';

interface RendicionesTableProps {
  rendiciones: Rendicion[];
  onRendicionChange: (index: number, field: keyof Rendicion, value: string) => void;
  onAddRendicion: () => void;
  onRemoveRendicion: (index: number) => void;
}

const RendicionesTable: React.FC<RendicionesTableProps> = ({ rendiciones, onRendicionChange, onAddRendicion, onRemoveRendicion }) => {

  const handleNumericChange = (index: number, field: 'montoRendido', value: string) => {
    const numericValue = parseCLP(value);
    onRendicionChange(index, field, formatCLP(numericValue));
  };

  return (
    <div className="w-full">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/4">Ítem</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Monto Rendido (CLP)</th>
                        <th scope="col" className="relative px-4 py-3"><span className="sr-only">Eliminar</span></th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                    {rendiciones.map((r, index) => (
                        <tr key={r.id} className={r.error ? 'bg-red-50' : ''}>
                            <td className="px-4 py-2 whitespace-nowrap font-medium text-sm text-slate-600">
                                Rendición {index + 1}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                                <input type="text" value={r.montoRendido} onBlur={(e) => handleNumericChange(index, 'montoRendido', e.target.value)} onChange={(e) => onRendicionChange(index, 'montoRendido', e.target.value)} className="w-40 p-1 border rounded-md border-slate-300 text-sm"/>
                                {r.error && <p className="text-xs text-red-600 mt-1">{r.error}</p>}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                <button onClick={() => onRemoveRendicion(index)} className="text-red-600 hover:text-red-900">
                                    <TrashIcon />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="mt-4">
            <button onClick={onAddRendicion} className="flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <PlusIcon /> Agregar Rendición
            </button>
        </div>
    </div>
  );
};

export default RendicionesTable;