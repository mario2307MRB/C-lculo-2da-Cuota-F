

import React from 'react';
import type { ResultadoCalculo } from '../types';
import { formatCLP } from '../utils/formatters';

interface PdfReportProps {
  resultado: ResultadoCalculo;
  codigoProyecto: string;
  montoTotalProyecto: string;
  primeraCuota: string;
  cantidadCuotas: string;
  nombreEncargado: string;
  shareableLink: string;
}

const PdfReport: React.FC<PdfReportProps> = ({ 
    resultado, 
    codigoProyecto, 
    montoTotalProyecto, 
    primeraCuota,
    cantidadCuotas,
    nombreEncargado,
    shareableLink,
}) => {
  const {
    elegible,
    sumaRendida,
    umbral60,
    brechaPara60,
    montoSegundaCuotaSugerido,
    rendicionesConsideradas,
  } = resultado;

  const today = new Date();
  const formattedGenerationDate = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;

  return (
    <div className="p-8 font-sans bg-white text-black">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800">Verificación de gastos para desembolso 2ª Cuota FOSIS</h1>
        <p className="text-sm text-gray-500">Generado el: {formattedGenerationDate}</p>
      </header>
      
      <section className="mb-6">
        <h2 className="text-lg font-semibold border-b pb-2 mb-3">Datos del Proyecto</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <div><strong>Código Proyecto:</strong> {codigoProyecto || 'No especificado'}</div>
          <div><strong>Monto Total:</strong> ${montoTotalProyecto || 'No especificado'}</div>
          <div><strong>Nº Cuotas:</strong> {cantidadCuotas || 'No especificado'}</div>
          <div><strong>Monto 1ª Cuota:</strong> ${primeraCuota}</div>
          <div><strong>Encargado:</strong> {nombreEncargado || 'No especificado'}</div>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold border-b pb-2 mb-3">Resumen del Cálculo</h2>
        <div className={`p-4 rounded-md border ${elegible ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
          <h3 className={`text-xl font-bold ${elegible ? 'text-green-800' : 'text-red-800'}`}>
            Resultado: {elegible ? 'Autorizar 2ª Cuota' : 'No Autorizar 2ª Cuota'}
          </h3>
          <p className="text-sm mt-1">
            El monto rendido ({`$${formatCLP(sumaRendida)}`}) representa un 
            <strong> {resultado.porcentajeEjecucion.toFixed(1)}% </strong>
            del monto de la primera cuota.
          </p>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold border-b pb-2 mb-3">Métricas Clave</h2>
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div className="bg-gray-100 p-3 rounded">
            <p className="text-gray-600">Suma Rendida</p>
            <p className="font-bold text-base">${formatCLP(sumaRendida)}</p>
          </div>
          <div className="bg-gray-100 p-3 rounded">
            <p className="text-gray-600">Umbral 60%</p>
            <p className="font-bold text-base">${formatCLP(umbral60)}</p>
          </div>
          <div className="bg-gray-100 p-3 rounded">
            <p className="text-gray-600">Brecha para Umbral</p>
            <p className="font-bold text-base">${formatCLP(brechaPara60)}</p>
          </div>
        </div>
        <div className="mt-4 bg-blue-50 border border-blue-200 p-4 rounded">
          <p className="text-sm text-blue-800">Monto 2ª Cuota Sugerido</p>
          <p className="font-bold text-xl text-blue-900">${formatCLP(montoSegundaCuotaSugerido)}</p>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold border-b pb-2 mb-3">Detalle de Rendiciones</h2>
        {rendicionesConsideradas.length > 0 ? (
            <table className="min-w-full text-sm border">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-4 py-2 text-left font-semibold">Ítem</th>
                        <th className="px-4 py-2 text-right font-semibold">Monto Rendido (CLP)</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {rendicionesConsideradas.map(r => (
                        <tr key={r.id}>
                            <td className="px-4 py-2">{r.label}</td>
                            <td className="px-4 py-2 text-right">${formatCLP(r.montoRendido)}</td>
                        </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold">
                         <td className="px-4 py-2 text-right">Total</td>
                         <td className="px-4 py-2 text-right">${formatCLP(sumaRendida)}</td>
                    </tr>
                </tbody>
            </table>
        ) : <p className="text-sm text-gray-500">No hay rendiciones consideradas.</p>}
      </section>

      <div className="mt-8 mb-4 text-xs text-center bg-yellow-50 border border-yellow-200 p-3 rounded-md text-yellow-800">
        <strong>Nota:</strong> Este es un informe generado por una herramienta de cálculo auxiliar y sus resultados no constituyen una verificación oficial del proyecto. La validez final de los datos depende de la revisión formal por parte de la entidad correspondiente.
      </div>
      
      <section className="mt-8 mb-4">
        <h2 className="text-lg font-semibold border-b pb-2 mb-3">Acceso a los Datos</h2>
        <div className="text-sm p-3 bg-gray-50 border rounded-md">
            <p className="text-gray-700 mb-2">
                Puede cargar los datos de este informe directamente en la aplicación para su revisión o modificación futura usando el siguiente enlace:
            </p>
            <a 
                href={shareableLink} 
                className="text-blue-600 hover:underline break-all"
                target="_blank"
                rel="noopener noreferrer"
            >
                {shareableLink}
            </a>
            <p className="text-xs text-gray-500 mt-2">
                Si el enlace no es interactivo, por favor copie y pegue la URL completa en su navegador.
            </p>
        </div>
      </section>

      <footer className="mt-12 pt-4 border-t">
          <div className="flex justify-center items-center">
              <div className="w-64 text-center text-sm">
                 <div className="border-b border-gray-400 h-16 mb-2"></div>
                 <p>{nombreEncargado}</p>
                 <p className="text-xs text-gray-500 mt-1">Nombre Encargado</p>
              </div>
          </div>
      </footer>
    </div>
  );
};

export default PdfReport;