export interface Rendicion {
  id: string;
  montoRendido: string;
  error?: string;
}

export interface RendicionCalculo {
  id: string;
  label: string;
  montoRendido: number;
}

export interface ResultadoCalculo {
  elegible: boolean;
  porcentajeEjecucion: number;
  sumaRendida: number;
  umbral60: number;
  brechaPara60: number;
  montoSegundaCuotaSugerido: number;
  logicaSegundaCuota: string;
  rendicionesConsideradas: RendicionCalculo[];
  garantiaCumple: boolean;
  garantiaBrecha: number;
}
