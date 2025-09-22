
export const formatCLP = (value: number): string => {
  return new Intl.NumberFormat('es-CL').format(Math.round(value));
};

export const parseCLP = (value: string): number => {
  if (typeof value !== 'string') return 0;
  return Number(value.replace(/[^0-9]/g, '')) || 0;
};

export const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const parseDateFromDisplay = (dateStr: string): Date | null => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    const [day, month, year] = parts;
    // new Date() expects yyyy-mm-dd
    const parsedDate = new Date(`${year}-${month}-${day}T00:00:00`);
    if (isNaN(parsedDate.getTime())) return null;
    return parsedDate;
};

export const formatDateForDisplay = (dateStr: string): string => {
    if (!dateStr || !dateStr.includes('-')) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
};
