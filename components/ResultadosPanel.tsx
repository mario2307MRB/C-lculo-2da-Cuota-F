import React from 'react';
import type { ResultadoCalculo } from '../types';
import Card from './Card';
import ProgressBar from './ProgressBar';
import { formatCLP } from '../utils/formatters';
import { InfoIcon } from '../constants';

interface ResultadosPanelProps {
  resultado: ResultadoCalculo | null;
}

const ResultadosPanel: React.FC<ResultadosPanelProps> = ({ resultado }) => {
  if (!resultado) {
    return (
      <Card title="Resultados del Cálculo">
        <div className="text-center text-slate-500 py-8">
          <p>Presione "Calcular" para ver los resultados.</p>
        </div>
      </Card>
    );
  }

  const {
    elegible,
    porcentajeEjecucion,
    sumaRendida,
    umbral60,
    brechaPara60,
    montoSegundaCuotaSugerido,
    logicaSegundaCuota,
    rendicionesConsideradas,
  } = resultado;

  const statusBg = elegible ? 'bg-emerald-100 border-emerald-500' : 'bg-red-100 border-red-500';
  const statusText = elegible ? 'text-emerald-800' : 'text-red-800';
  const statusTitle = elegible ? 'Autorizar 2ª Cuota' : 'No Autorizar 2ª Cuota';

  return (
    <Card title="Resultados del Cálculo">
      <div className="space-y-6">
        <div className={`p-4 rounded-lg border ${statusBg}`}>
          <h3 className={`text-lg font-bold ${statusText}`}>{statusTitle}</h3>
          {!elegible && (
            <p className={`mt-1 text-sm ${statusText}`}>
              No se ha alcanzado el umbral del 60%. Falta por rendir un monto de ${formatCLP(brechaPara60)}.
            </p>
          )}
        </div>
        
        <div>
            <ProgressBar percentage={porcentajeEjecucion} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-slate-100 p-3 rounded-md">
                <p className="text-sm text-slate-500">Suma Rendida</p>
                <p className="text-lg font-bold text-slate-800">${formatCLP(sumaRendida)}</p>
            </div>
            <div className="bg-slate-100 p-3 rounded-md">
                <p className="text-sm text-slate-500">Umbral 60%</p>
                <p className="text-lg font-bold text-slate-800">${formatCLP(umbral60)}</p>
            </div>
            <div className="bg-slate-100 p-3 rounded-md">
                <p className="text-sm text-slate-500">Brecha para Umbral</p>
                <p className={`text-lg font-bold ${elegible ? 'text-emerald-600' : 'text-red-600'}`}>${formatCLP(brechaPara60)}</p>
            </div>
        </div>

        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
          <h4 className="font-semibold text-slate-800">Monto 2ª Cuota Sugerido</h4>
          <p className="text-2xl font-bold text-indigo-700">${formatCLP(montoSegundaCuotaSugerido)}</p>
          <div className="flex items-start gap-2 mt-2 text-xs text-indigo-600">
            <InfoIcon />
            {logicaSegundaCuota.includes(' - ') ? (
              <span>
                Cálculo: <code className="font-mono bg-indigo-100 p-1 rounded text-indigo-800">{logicaSegundaCuota}</code>
              </span>
            ) : (
              <span>{logicaSegundaCuota}</span>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-slate-800 mb-2">Rendiciones Consideradas para el Cálculo</h4>
          {rendicionesConsideradas.length > 0 ? (
            <ul className="list-disc list-inside bg-slate-50 p-3 rounded-md border text-sm text-slate-600">
              {rendicionesConsideradas.map(r => (
                <li key={r.id}>
                  {r.label}: <strong>${formatCLP(r.montoRendido)}</strong>
                </li>
              ))}
            </ul>
          ) : (
             <p className="text-sm text-slate-500">No se ingresaron rendiciones.</p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ResultadosPanel;