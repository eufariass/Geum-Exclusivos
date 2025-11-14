export const getMonthName = (yearMonth: string): string => {
  const [year, month] = yearMonth.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  let formatted = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  // Substituir "De" por "de" para manter minúscula
  formatted = formatted.replace(' De ', ' de ');
  // Garantir que a primeira letra do mês esteja maiúscula
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

export const getCurrentMonth = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const getPreviousMonth = (yearMonth: string): string => {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(year, month - 1);
  date.setMonth(date.getMonth() - 1);
  const newYear = date.getFullYear();
  const newMonth = String(date.getMonth() + 1).padStart(2, '0');
  return `${newYear}-${newMonth}`;
};

export const getLast6Months = (): string[] => {
  const months: string[] = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    months.push(`${year}-${month}`);
  }
  
  return months;
};

export const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};
