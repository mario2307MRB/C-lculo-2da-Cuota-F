

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Rendicion, ResultadoCalculo, RendicionCalculo } from './types';
import Card from './components/Card';
import Input from './components/Input';
import RendicionesTable from './components/RendicionesTable';
import ResultadosPanel from './components/ResultadosPanel';
import PdfReport from './components/PdfReport';
import { formatCLP, parseCLP } from './utils/formatters';
import { InfoIcon, LinkIcon } from './constants';

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

    // State
    const [codigoProyecto, setCodigoProyecto] = useState<string>('AB-123456-78901-CD');
    const [nombreEncargado, setNombreEncargado] = useState<string>('Juan Pérez González');
    const [montoTotalProyecto, setMontoTotalProyecto] = useState<string>('20.000.000');
    const [cantidadCuotas, setCantidadCuotas] = useState<string>('2');
    const [primeraCuota, setPrimeraCuota] = useState<string>('10.000.000');
    const [rendiciones, setRendiciones] = useState<Rendicion[]>(initialRendiciones);
    const [resultado, setResultado] = useState<ResultadoCalculo | null>(null);
    const [error, setError] = useState<string>('');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [librariesReady, setLibrariesReady] = useState(false);
    const [showCopiedMessage, setShowCopiedMessage] = useState(false);
    const [shareableLink, setShareableLink] = useState<string>('');

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

    // Hydrate state from URL on initial load
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const data = urlParams.get('data');
        if (data) {
            try {
                const state = JSON.parse(atob(data));
                setCodigoProyecto(state.codigoProyecto || '');
                setNombreEncargado(state.nombreEncargado || '');
                setMontoTotalProyecto(state.montoTotalProyecto || '0');
                setCantidadCuotas(state.cantidadCuotas || '0');
                setPrimeraCuota(state.primeraCuota || '0');
                setRendiciones(state.rendiciones || []);
            } catch (e) {
                console.error("Error al cargar datos desde la URL", e);
                setError("No se pudieron cargar los datos de verificación desde la URL.");
            }
        }
    }, []);

     // Effect to generate the shareable link whenever relevant data changes
    useEffect(() => {
        const stateToSave = {
            codigoProyecto,
            nombreEncargado,
            montoTotalProyecto,
            cantidadCuotas,
            primeraCuota,
            rendiciones: rendiciones.map(r => ({ id: r.id, montoRendido: r.montoRendido })),
        };
        try {
            const jsonString = JSON.stringify(stateToSave);
            const base64String = btoa(jsonString);
            const url = new URL(window.location.origin + window.location.pathname);
            url.searchParams.set('data', base64String);
            setShareableLink(url.toString());
        } catch (e) {
            console.error("Error al generar el enlace para guardar:", e);
            setShareableLink('');
        }
    }, [codigoProyecto, nombreEncargado, montoTotalProyecto, cantidadCuotas, primeraCuota, rendiciones]);

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
        
        const montoPrimeraCuota = parseCLP(primeraCuota);
        if (montoPrimeraCuota <= 0) {
            setError('El monto de la 1ª cuota debe ser mayor a 0.');
            return;
        }

        let hasErrors = false;
        const validatedRendiciones = rendiciones.map((r: Rendicion) => {
            const rendido = parseCLP(r.montoRendido);
            let currentError: string | undefined = undefined;

            if (rendido <= 0) {
                currentError = "El monto rendido debe ser positivo.";
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
        const elegible = sumaRendida >= umbral60;
        const brechaPara60 = Math.max(0, umbral60 - sumaRendida);
        const porcentajeEjecucion = montoPrimeraCuota > 0 ? (sumaRendida / montoPrimeraCuota) * 100 : 0;
        
        const montoTotal = parseCLP(montoTotalProyecto);

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
        };
        
        setResultado(newResult);

    }, [primeraCuota, rendiciones, montoTotalProyecto]);

    const handleSaveProgress = () => {
        if (shareableLink) {
            window.history.pushState({}, '', shareableLink);
            navigator.clipboard.writeText(shareableLink).then(() => {
                setShowCopiedMessage(true);
                setTimeout(() => setShowCopiedMessage(false), 3000);
            });
        } else {
            setError("No se pudo generar el enlace para guardar. Intente de nuevo.");
        }
    };


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
                   <ResultadosPanel resultado={resultado} />
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
                        disabled={!librariesReady}
                        className="w-full sm:w-auto flex-grow px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-400 disabled:cursor-wait"
                    >
                        {librariesReady ? 'Calcular Cumplimiento' : 'Cargando herramientas...'}
                    </button>
                    <button
                        onClick={handleSaveProgress}
                        className="w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-md text-slate-700 bg-slate-200 hover:bg-slate-300 flex items-center gap-2 justify-center"
                    >
                        <LinkIcon />
                        Guardar avance
                    </button>
                     <button 
                        onClick={handleExportPDF} 
                        disabled={!resultado || isGeneratingPdf}
                        className="w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-md text-slate-700 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                     >
                        {isGeneratingPdf ? 'Generando...' : 'Exportar a PDF'}
                    </button>
                    {showCopiedMessage && (
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-800 text-white text-xs font-semibold py-1 px-3 rounded-md shadow-lg">
                            ¡Enlace copiado al portapapeles!
                        </div>
                    )}
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
                            shareableLink={shareableLink}
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