import React from 'react';
import type { ResultadoCalculo } from '../types';
import Card from './Card';
import ProgressBar from './ProgressBar';
import { formatCLP } from '../utils/formatters';
import { InfoIcon, BrainIcon } from '../constants';

interface ResultadosPanelProps {
  resultado: ResultadoCalculo | null;
  aiAnalysis: string | null;
  isAnalyzing: boolean;
}

const ResultadosPanel: React.FC<ResultadosPanelProps> = ({ resultado, aiAnalysis, isAnalyzing }) => {
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
    garantiaCumple,
    garantiaBrecha,
  } = resultado;

  const statusBg = elegible ? 'bg-emerald-100 border-emerald-500' : 'bg-red-100 border-red-500';
  const statusText = elegible ? 'text-emerald-800' : 'text-red-800';
  const statusTitle = elegible ? 'Autorizar 2ª Cuota' : 'No Autorizar 2ª Cuota';
  const rendicionCumple = porcentajeEjecucion >= 60;

  return (
    <Card title="Resultados del Cálculo">
      <div className="space-y-6">
        <div className={`p-4 rounded-lg border ${statusBg}`}>
          <h3 className={`text-lg font-bold ${statusText}`}>{statusTitle}</h3>
          {elegible && <p className={`mt-1 text-sm ${statusText}`}>Se cumplen todas las condiciones para proceder con el desembolso.</p>}
        </div>
        
        <div>
            <h4 className="font-semibold text-slate-800 mb-2">Condiciones para Desembolso</h4>
            <ul className="space-y-2 text-sm">
                <li className={`flex items-start gap-3 p-3 rounded-md border ${rendicionCumple ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <span className={`font-bold text-lg ${rendicionCumple ? 'text-emerald-600' : 'text-red-600'}`}>{rendicionCumple ? '✓' : '✗'}</span>
                    <div>
                        <span className={rendicionCumple ? 'text-emerald-800' : 'text-red-800'}>La rendición de gastos es <strong>igual o mayor al 60%</strong> de la 1ª cuota.</span>
                        {!rendicionCumple && <p className="text-xs text-red-700 mt-1">Falta por rendir ${formatCLP(brechaPara60)}.</p>}
                    </div>
                </li>
                <li className={`flex items-start gap-3 p-3 rounded-md border ${garantiaCumple ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                        <span className={`font-bold text-lg ${garantiaCumple ? 'text-emerald-600' : 'text-red-600'}`}>{garantiaCumple ? '✓' : '✗'}</span>
                    <div>
                        <span className={garantiaCumple ? 'text-emerald-800' : 'text-red-800'}>La garantía de anticipo es <strong>igual o mayor al monto total</strong> del proyecto.</span>
                            {!garantiaCumple && <p className="text-xs text-red-700 mt-1">La garantía es inferior por ${formatCLP(garantiaBrecha)}.</p>}
                    </div>
                </li>
            </ul>
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
                <p className={`text-lg font-bold ${rendicionCumple ? 'text-emerald-600' : 'text-red-600'}`}>${formatCLP(brechaPara60)}</p>
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
        
        {(isAnalyzing || aiAnalysis) && (
            <div className="mt-6 border-t pt-6">
                <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <BrainIcon /> Sugerencias IA
                </h4>
                {isAnalyzing ? (
                    <div className="text-sm text-slate-500 animate-pulse">
                        Analizando datos y generando recomendaciones...
                    </div>
                ) : (
                    aiAnalysis && (
                         <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-md border border-slate-200 space-y-2">
                            {aiAnalysis.split('*').filter(s => s.trim()).map((line, index) => (
                                <p key={index} className="flex items-start gap-2">
                                    <span className="text-indigo-500 mt-1">▪</span>
                                    <span>{line.trim()}</span>
                                </p>
                            ))}
                        </div>
                    )
                )}
            </div>
        )}

      </div>
    </Card>
  );
};

export default ResultadosPanel;