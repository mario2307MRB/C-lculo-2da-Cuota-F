import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Rendicion, ResultadoCalculo, RendicionCalculo } from './types';
import Card from './components/Card';
import Input from './components/Input';
import RendicionesTable from './components/RendicionesTable';
import ResultadosPanel from './components/ResultadosPanel';
import PdfReport from './components/PdfReport';
import { formatCLP, parseCLP, formatDecimal, parseDecimal, formatDateForInput } from './utils/formatters';
import { InfoIcon } from './constants';
import { GoogleGenAI } from "@google/genai";

// Define types for external libraries attached to the window object
interface CustomWindow extends Window {
    html2canvas?: any;
    jspdf?: any;
}

declare const window: CustomWindow;

const App: React.FC = () => {
    const reportRef = useRef<HTMLDivElement>(null);
    
    // Seed Data
    const initialRendiciones: Rendicion[] = [
        { id: crypto.randomUUID(), montoRendido: '3.000.000' },
        { id: crypto.randomUUID(), montoRendido: '2.200.000' },
        { id: crypto.randomUUID(), montoRendido: '800.000' },
    ];

    const defaultEndDate = new Date();
    defaultEndDate.setFullYear(defaultEndDate.getFullYear() + 1);


    // State
    const [codigoProyecto, setCodigoProyecto] = useState<string>('AB-123456-78901-CD');
    const [nombreEncargado, setNombreEncargado] = useState<string>('Juan Pérez González');
    const [montoTotalProyecto, setMontoTotalProyecto] = useState<string>('20.000.000');
    const [cantidadCuotas, setCantidadCuotas] = useState<string>('2');
    const [garantiaAnticipoUF, setGarantiaAnticipoUF] = useState<string>('1.500,00');
    const [valorUFdelDia, setValorUFdelDia] = useState<string>('37.511,83');
    const [fechaTerminoVigencia, setFechaTerminoVigencia] = useState<string>(formatDateForInput(defaultEndDate));
    const [primeraCuota, setPrimeraCuota] = useState<string>('10.000.000');
    const [rendiciones, setRendiciones] = useState<Rendicion[]>(initialRendiciones);
    const [resultado, setResultado] = useState<ResultadoCalculo | null>(null);
    const [error, setError] = useState<string>('');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [librariesReady, setLibrariesReady] = useState(false);
    
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);


    // Check for external libraries
    useEffect(() => {
        const checkLibraries = () => {
            return (
                typeof window.jspdf !== 'undefined' &&
                typeof window.jspdf.jsPDF !== 'undefined' &&
                typeof window.html2canvas === 'function'
            );
        };

        if (checkLibraries()) {
            setLibrariesReady(true);
            return;
        }

        const interval = setInterval(() => {
            if (checkLibraries()) {
                setLibrariesReady(true);
                clearInterval(interval);
            }
        }, 200);

        const timeout = setTimeout(() => {
            clearInterval(interval);
            // Re-check at the end of the timeout before setting an error
            if (!checkLibraries()) {
                console.error("External libraries (jspdf, html2canvas) failed to load within 10 seconds.");
                setError("Error: No se pudieron cargar las herramientas. Por favor, revise su conexión a internet y recargue la página.");
            }
        }, 10000); // 10-second timeout

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, []);
    
    const getAIAnalysis = async (calculoResultado: ResultadoCalculo, montoTotalProyectoStr: string, primeraCuotaStr: string) => {
        if (!process.env.API_KEY) {
            console.error("API key for GenAI is not configured.");
            return;
        }
        
        setIsAnalyzing(true);
        setAiAnalysis(null);

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const montoPrimeraCuota = parseCLP(primeraCuotaStr);
        const rendicionCumple = calculoResultado.sumaRendida >= calculoResultado.umbral60;

        const prompt = `
Eres un asesor financiero experto del FOSIS, especializado en la evaluación de proyectos sociales.
Tu tarea es analizar los datos de la rendición de la primera cuota de un convenio y proporcionar un resumen claro y accionable para el encargado del proyecto.

Datos del Proyecto:
- Monto Total del Proyecto: $${formatCLP(parseCLP(montoTotalProyectoStr))}
- Monto Primera Cuota: $${formatCLP(montoPrimeraCuota)}
- Monto Total Rendido: $${formatCLP(calculoResultado.sumaRendida)}
- Porcentaje de Ejecución: ${calculoResultado.porcentajeEjecucion.toFixed(1)}%
- Umbral Requerido (60%): $${formatCLP(calculoResultado.umbral60)}
- Estado Rendición (>=60%): ${rendicionCumple ? 'CUMPLE' : 'NO CUMPLE'}
- Estado Garantía (>= Total Proyecto): ${calculoResultado.garantiaCumple ? 'CUMPLE' : 'NO CUMPLE'}
- Estado Final: ${calculoResultado.elegible ? 'AUTORIZADO' : 'NO AUTORIZADO'}

Basado en estos datos, genera una recomendación profesional en español con los siguientes puntos en formato de lista (usando '*' para cada punto):
- Un resumen del estado final (si se autoriza o no y por qué, mencionando ambas condiciones: rendición y garantía).
- Si la rendición no cumple, indica claramente cuánto falta por rendir ($${formatCLP(calculoResultado.brechaPara60)}).
- Si la garantía no cumple, indica claramente la diferencia ($${formatCLP(calculoResultado.garantiaBrecha)}) y que se debe actualizar la póliza.
- Si ambas condiciones se cumplen, felicita al encargado y menciona que se puede proceder con la solicitud de la segunda cuota.
- Finaliza con una nota de ánimo.

Sé conciso y profesional. No agregues encabezados, saludos ni despedidas.
        `;
        
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setAiAnalysis(response.text);
        } catch (err) {
            console.error("Error al generar análisis con IA:", err);
            setAiAnalysis("No se pudo generar el análisis. Por favor, intente de nuevo.");
        } finally {
            setIsAnalyzing(false);
        }
    };


    const handleNumericInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const parsed = parseCLP(value);
        if (value === '' || value === '0') {
             setter('0');
             return;
        }
        if (!isNaN(parsed)) {
            setter(formatCLP(parsed));
        } else {
            setter(value);
        }
    };

    const handleDecimalInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setter(e.target.value);
    };

    const handleFormatDecimalOnBlur = (setter: React.Dispatch<React.SetStateAction<string>>, options: Intl.NumberFormatOptions = {}) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const parsed = parseDecimal(value);
        if(!isNaN(parsed)) {
            setter(formatDecimal(parsed, options));
        } else {
            setter(formatDecimal(0, options));
        }
    };
    
    const handleRendicionChange = (index: number, field: keyof Rendicion, value: string) => {
        const newRendiciones = [...rendiciones];
        const updatedRendicion = { ...newRendiciones[index], [field]: value };

        if (updatedRendicion.error) {
            updatedRendicion.error = undefined;
        }
        
        newRendiciones[index] = updatedRendicion;
        setRendiciones(newRendiciones);
    };


    const handleAddRendicion = () => {
        setRendiciones([...rendiciones, { id: crypto.randomUUID(), montoRendido: '0' }]);
    };

    const handleRemoveRendicion = (index: number) => {
        setRendiciones(rendiciones.filter((_, i) => i !== index));
    };
    
    const handleCalculate = useCallback(() => {
        setError('');
        setResultado(null);
        setAiAnalysis(null);

        const montoTotal = parseCLP(montoTotalProyecto);
        const garantiaTotal = parseDecimal(garantiaAnticipoUF) * parseDecimal(valorUFdelDia);
        
        const garantiaCumple = montoTotal > 0 ? garantiaTotal >= montoTotal : true;
        const garantiaBrecha = montoTotal > 0 ? Math.max(0, montoTotal - garantiaTotal) : 0;
        
        const montoPrimeraCuota = parseCLP(primeraCuota);
        if (montoPrimeraCuota <= 0) {
            setError('El monto de la 1ª cuota debe ser mayor a 0.');
            return;
        }

        let hasErrors = false;
        const validatedRendiciones = rendiciones.map((r: Rendicion) => {
            const rendido = parseCLP(r.montoRendido);
            let currentError: string | undefined = undefined;

            if (rendido < 0) { // Should allow 0, but not negative
                currentError = "El monto rendido no puede ser negativo.";
            }
            
            if (currentError) {
                hasErrors = true;
            }

            return { ...r, error: currentError };
        });

        setRendiciones(validatedRendiciones);

        if(hasErrors) {
             setError('Por favor, corrija los errores marcados en rojo en las rendiciones.');
             return;
        }
        
        const rendicionesConsideradas: RendicionCalculo[] = validatedRendiciones.map((r: Rendicion, index: number) => ({
            id: r.id,
            label: `Rendición ${index + 1}`,
            montoRendido: parseCLP(r.montoRendido)
        }));

        const sumaRendida = rendicionesConsideradas.reduce((sum, r) => sum + r.montoRendido, 0);
        const umbral60 = montoPrimeraCuota * 0.6;
        const rendicionCumple = sumaRendida >= umbral60;
        const brechaPara60 = Math.max(0, umbral60 - sumaRendida);
        const porcentajeEjecucion = montoPrimeraCuota > 0 ? (sumaRendida / montoPrimeraCuota) * 100 : 0;
        
        const elegible = rendicionCumple && garantiaCumple;

        let montoSegundaCuotaSugerido = montoPrimeraCuota;
        let logicaSegundaCuota = "El monto de la 2ª cuota se asume igual al de la 1ª cuota, ya que no se ingresó un Monto Total de Proyecto válido.";

        if (montoTotal > 0) {
            montoSegundaCuotaSugerido = Math.max(0, montoTotal - montoPrimeraCuota);
            logicaSegundaCuota = `${formatCLP(montoTotal)} - ${formatCLP(montoPrimeraCuota)}`;
        }
        
        const newResult: ResultadoCalculo = {
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
        };
        
        setResultado(newResult);
        getAIAnalysis(newResult, montoTotalProyecto, primeraCuota);

    }, [primeraCuota, rendiciones, montoTotalProyecto, garantiaAnticipoUF, valorUFdelDia]);

    const handleExportPDF = async () => {
        if (typeof window.html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
            setError("Las librerías para generar PDF no se han cargado. Por favor, revise su conexión o intente de nuevo.");
            console.error("html2canvas or jspdf is not defined.");
            return;
        }
        
        if (!reportRef.current || !resultado) return;
        
        setIsGeneratingPdf(true);
        setError('');

        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            });

            await pdf.html(reportRef.current, {
                x: 15,
                y: 15,
                width: 180, // A4 is 210mm wide, using 15mm margins
                windowWidth: 800, // matching the hidden div's width for correct scaling
                autoPaging: 'text'
            });
            
            const fileName = `Verificacion_2da_Cuota_${codigoProyecto || 'proyecto'}.pdf`;
            pdf.save(fileName);

        } catch (err) {
            setError("Ocurrió un error al generar el PDF. Por favor, intente de nuevo.");
            console.error(err);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const garantiaEnPesos = parseDecimal(garantiaAnticipoUF) * parseDecimal(valorUFdelDia);

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Verificación de gastos para desembolso 2ª Cuota FOSIS</h1>
                <p className="mt-2 text-lg text-slate-600">Verifique los gastos de la 1ª cuota y genere un informe para el desembolso.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <Card title="Datos del Convenio">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <Input label="Código del Proyecto" id="codigoProyecto" value={codigoProyecto} onChange={(e) => setCodigoProyecto(e.target.value)} placeholder="XX-XXXXXX-XXXXX-XX" />
                               <Input label="Nombre del Encargado" id="nombreEncargado" value={nombreEncargado} onChange={(e) => setNombreEncargado(e.target.value)} placeholder="Nombre completo" />
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Monto Total del Proyecto" id="montoTotalProyecto" value={montoTotalProyecto} onChange={handleNumericInputChange(setMontoTotalProyecto)} prefix="CLP$" />
                                <Input label="Cantidad de Cuotas" id="cantidadCuotas" value={cantidadCuotas} onChange={(e) => setCantidadCuotas(e.target.value.replace(/[^0-9]/g, ''))} type="text" placeholder="Ej: 5" />
                            </div>
                            <hr className="!my-6 border-slate-200" />
                            <p className="text-sm text-slate-500 -mt-4 mb-2">Garantía de Anticipo:</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Input
                                    label="Valor Garantía (UF)"
                                    id="garantiaUF"
                                    value={garantiaAnticipoUF}
                                    onChange={handleDecimalInputChange(setGarantiaAnticipoUF)}
                                    onBlur={handleFormatDecimalOnBlur(setGarantiaAnticipoUF, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    prefix="UF"
                                />
                                <Input
                                    label="Valor UF del día"
                                    id="valorUF"
                                    value={valorUFdelDia}
                                    onChange={handleDecimalInputChange(setValorUFdelDia)}
                                    onBlur={handleFormatDecimalOnBlur(setValorUFdelDia, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    prefix="$"
                                />
                                <div>
                                    <label className="block text-sm font-medium text-slate-600">
                                        Valor Garantía (CLP)
                                    </label>
                                    <div className="mt-1 relative rounded-md shadow-sm">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                                            <span className="text-slate-500 sm:text-sm">CLP$</span>
                                        </div>
                                        <input
                                            type="text"
                                            readOnly
                                            value={formatCLP(garantiaEnPesos)}
                                            className="block w-full rounded-md border-slate-300 bg-slate-100 pl-10 pr-3 py-2 sm:text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4">
                               <Input
                                    label="Fecha Término Vigencia Garantía"
                                    id="fechaTerminoVigencia"
                                    type="date"
                                    value={fechaTerminoVigencia}
                                    onChange={(e) => setFechaTerminoVigencia(e.target.value)}
                                />
                            </div>
                            <hr className="!my-6 border-slate-200" />
                            <p className="text-sm text-slate-500 -mt-4 mb-2">Datos para el cálculo:</p>
                            <Input label="Monto 1ª Cuota" id="primeraCuota" value={primeraCuota} onChange={handleNumericInputChange(setPrimeraCuota)} prefix="CLP$" required />
                        </div>
                    </Card>
                    <Card title="Rendiciones Mensuales">
                        <RendicionesTable
                            rendiciones={rendiciones}
                            onRendicionChange={handleRendicionChange}
                            onAddRendicion={handleAddRendicion}
                            onRemoveRendicion={handleRemoveRendicion}
                        />
                    </Card>
                </div>
                
                <div className="lg:sticky top-8 self-start">
                   <ResultadosPanel resultado={resultado} aiAnalysis={aiAnalysis} isAnalyzing={isAnalyzing} />
                   <div className="mt-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm p-4 rounded-lg flex items-start gap-3">
                       <InfoIcon />
                       <p><strong>Nota:</strong> Esta es una herramienta de cálculo auxiliar y sus resultados no constituyen una verificación oficial del proyecto. La validez final depende de la revisión formal.</p>
                   </div>
                </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-200">
                <div className="max-w-lg mx-auto flex flex-col sm:flex-row items-center gap-4 relative">
                    <button 
                        onClick={handleCalculate} 
                        disabled={!librariesReady || isAnalyzing}
                        className="w-full sm:w-auto flex-grow px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-400 disabled:cursor-wait"
                    >
                        {isAnalyzing ? 'Analizando...' : (librariesReady ? 'Calcular Cumplimiento' : 'Cargando herramientas...')}
                    </button>
                     <button 
                        onClick={handleExportPDF} 
                        disabled={!resultado || isGeneratingPdf}
                        className="w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-md text-slate-700 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                     >
                        {isGeneratingPdf ? 'Generando...' : 'Exportar a PDF'}
                    </button>
                </div>
                {error && <p className="text-red-600 text-sm font-medium mt-4 text-center">{error}</p>}
            </div>


            <div className="absolute top-0 -left-[9999px] -z-10 w-[800px] bg-white text-black" aria-hidden="true">
                <div ref={reportRef}>
                     {resultado && (
                        <PdfReport 
                            resultado={resultado}
                            codigoProyecto={codigoProyecto}
                            montoTotalProyecto={montoTotalProyecto}
                            primeraCuota={primeraCuota}
                            cantidadCuotas={cantidadCuotas}
                            nombreEncargado={nombreEncargado}
                            garantiaAnticipoUF={garantiaAnticipoUF}
                            valorUFdelDia={valorUFdelDia}
                            fechaTerminoVigencia={fechaTerminoVigencia}
                        />
                    )}
                </div>
            </div>

            <footer className="text-center mt-12 text-sm text-slate-500">
                <p>Aplicación desarrollada para una gestión de convenios eficiente.</p>
            </footer>
        </div>
    );
};

export default App;