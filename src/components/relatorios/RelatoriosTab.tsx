import { useState, useMemo, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { storageService } from '@/lib/storage';
import { getCurrentMonth, getMonthName, getPreviousMonth, getLast6Months, formatDate } from '@/lib/dateUtils';
import logoBlack from '@/assets/logo-geum-black.png';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface RelatoriosTabProps {
  showToast: (message: string, type: 'success' | 'error') => void;
}

export const RelatoriosTab = ({ showToast }: RelatoriosTabProps) => {
  const imoveis = storageService.getImoveis();
  const metricas = storageService.getMetricas();

  const [selectedImovelId, setSelectedImovelId] = useState('');
  const [selectedMes, setSelectedMes] = useState(getCurrentMonth());
  const [showReport, setShowReport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);

  const selectedImovel = useMemo(() => {
    return imoveis.find((i) => i.id === selectedImovelId);
  }, [imoveis, selectedImovelId]);

  const reportData = useMemo(() => {
    if (!selectedImovel) return null;

    const currentMetrics = metricas.find((m) => m.imovelId === selectedImovelId && m.mes === selectedMes);
    const previousMonth = getPreviousMonth(selectedMes);
    const previousMetrics = metricas.find((m) => m.imovelId === selectedImovelId && m.mes === previousMonth);

    const getTrend = (current: number, previous: number) => {
      if (previous === 0 && current > 0) return { value: 0, direction: 'new' as const };
      if (previous === 0) return { value: 0, direction: 'neutral' as const };
      const percent = Math.round(((current - previous) / previous) * 100);
      if (percent > 0) return { value: percent, direction: 'up' as const };
      if (percent < 0) return { value: Math.abs(percent), direction: 'down' as const };
      return { value: 0, direction: 'neutral' as const };
    };

    const current = currentMetrics || { leads: 0, visualizacoes: 0, visitasRealizadas: 0 };
    const previous = previousMetrics || { leads: 0, visualizacoes: 0, visitasRealizadas: 0 };

    return {
      imovel: selectedImovel,
      mes: selectedMes,
      leads: { value: current.leads, trend: getTrend(current.leads, previous.leads) },
      visualizacoes: { value: current.visualizacoes, trend: getTrend(current.visualizacoes, previous.visualizacoes) },
      visitas: { value: current.visitasRealizadas, trend: getTrend(current.visitasRealizadas, previous.visitasRealizadas) },
    };
  }, [selectedImovel, selectedImovelId, selectedMes, metricas]);

  const chartData = useMemo(() => {
    if (!selectedImovelId) return null;

    const last6Months = getLast6Months();
    const labels = last6Months.map((month) => {
      const [, m] = month.split('-');
      return new Date(2000, parseInt(m) - 1).toLocaleDateString('pt-BR', { month: 'short' });
    });

    const leadsData = last6Months.map((month) => {
      const m = metricas.find((met) => met.imovelId === selectedImovelId && met.mes === month);
      return m ? m.leads : 0;
    });

    const visitsData = last6Months.map((month) => {
      const m = metricas.find((met) => met.imovelId === selectedImovelId && met.mes === month);
      return m ? m.visitasRealizadas : 0;
    });

    return {
      labels,
      datasets: [
        {
          label: 'Leads',
          data: leadsData,
          backgroundColor: 'hsla(150, 100%, 50%, 0.8)',
        },
        {
          label: 'Visitas',
          data: visitsData,
          backgroundColor: 'hsla(220, 100%, 50%, 0.8)',
        },
      ],
    };
  }, [selectedImovelId, metricas]);

  const handleGenerate = () => {
    if (!selectedImovelId) {
      showToast('Selecione um imóvel', 'error');
      return;
    }
    setShowReport(true);
  };

  const handleExportPDF = async () => {
    if (!reportRef.current || !selectedImovel) return;

    setIsExporting(true);
    showToast('Gerando PDF...', 'success');

    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      // Handle multiple pages if content is too tall
      const scaledHeight = imgHeight * ratio;
      if (scaledHeight > pdfHeight - 20) {
        let heightLeft = scaledHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
          position = heightLeft - scaledHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', imgX, position, imgWidth * ratio, imgHeight * ratio);
          heightLeft -= pdfHeight;
        }
      } else {
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      }

      pdf.save(`relatorio_geum_${selectedImovel.codigo}_${selectedMes}.pdf`);
      showToast('PDF exportado com sucesso!', 'success');
    } catch (error) {
      showToast('Erro ao exportar PDF', 'error');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border no-print">
        <h2 className="text-xl font-bold mb-4">Gerar Relatório</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label htmlFor="rel-imovel">Imóvel *</Label>
            <Select value={selectedImovelId} onValueChange={setSelectedImovelId}>
              <SelectTrigger id="rel-imovel">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {imoveis.map((imovel) => (
                  <SelectItem key={imovel.id} value={imovel.id}>
                    {imovel.codigo} - {imovel.endereco}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="rel-mes">Mês *</Label>
            <Input
              id="rel-mes"
              type="month"
              value={selectedMes}
              onChange={(e) => setSelectedMes(e.target.value)}
            />
          </div>

          <div className="flex items-end gap-2">
            <Button onClick={handleGenerate} className="flex-1">
              Gerar Relatório
            </Button>
            {showReport && (
              <Button onClick={handleExportPDF} variant="outline" disabled={isExporting}>
                📄 PDF
              </Button>
            )}
          </div>
        </div>
      </div>

      {showReport && reportData && (
        <div ref={reportRef} className="bg-white p-8 rounded-xl shadow-sm border border-border" id="report-content">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-300 pb-6 mb-6">
            <img src={logoBlack} alt="Geum" className="h-12 w-auto" />
            <div className="text-right">
              <h1 className="text-2xl font-bold text-black">Relatório Mensal</h1>
              <p className="text-sm text-gray-600 capitalize">{getMonthName(selectedMes)}</p>
            </div>
          </div>

          {/* Property Info */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Código</p>
                <p className="font-semibold text-black">{reportData.imovel.codigo}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Tipo</p>
                <p className="font-semibold text-black">{reportData.imovel.tipo}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-600 mb-1">Endereço</p>
                <p className="font-semibold text-black">{reportData.imovel.endereco}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-600 mb-1">Cliente</p>
                <p className="font-semibold text-black">{reportData.imovel.cliente}</p>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">📧</span>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded ${
                    reportData.leads.trend.direction === 'up'
                      ? 'bg-green-100 text-green-700'
                      : reportData.leads.trend.direction === 'down'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {reportData.leads.trend.direction === 'up' && '↑'}
                  {reportData.leads.trend.direction === 'down' && '↓'}
                  {reportData.leads.trend.direction === 'neutral' && '→'}
                  {reportData.leads.trend.direction === 'new' && '↑'}
                  {reportData.leads.trend.direction === 'new' ? ' Novo' : ` ${reportData.leads.trend.value}%`}
                </span>
              </div>
              <p className="text-xs text-gray-600">Leads</p>
              <p className="text-2xl font-bold text-black">{reportData.leads.value}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">👁️</span>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded ${
                    reportData.visualizacoes.trend.direction === 'up'
                      ? 'bg-green-100 text-green-700'
                      : reportData.visualizacoes.trend.direction === 'down'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {reportData.visualizacoes.trend.direction === 'up' && '↑'}
                  {reportData.visualizacoes.trend.direction === 'down' && '↓'}
                  {reportData.visualizacoes.trend.direction === 'neutral' && '→'}
                  {reportData.visualizacoes.trend.direction === 'new' && '↑'}
                  {reportData.visualizacoes.trend.direction === 'new' ? ' Novo' : ` ${reportData.visualizacoes.trend.value}%`}
                </span>
              </div>
              <p className="text-xs text-gray-600">Visualizações</p>
              <p className="text-2xl font-bold text-black">{reportData.visualizacoes.value.toLocaleString('pt-BR')}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">🚗</span>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded ${
                    reportData.visitas.trend.direction === 'up'
                      ? 'bg-green-100 text-green-700'
                      : reportData.visitas.trend.direction === 'down'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {reportData.visitas.trend.direction === 'up' && '↑'}
                  {reportData.visitas.trend.direction === 'down' && '↓'}
                  {reportData.visitas.trend.direction === 'neutral' && '→'}
                  {reportData.visitas.trend.direction === 'new' && '↑'}
                  {reportData.visitas.trend.direction === 'new' ? ' Novo' : ` ${reportData.visitas.trend.value}%`}
                </span>
              </div>
              <p className="text-xs text-gray-600">Visitas Realizadas</p>
              <p className="text-2xl font-bold text-black">{reportData.visitas.value}</p>
            </div>
          </div>

          {/* Chart */}
          {chartData && (
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-sm font-semibold text-black mb-4">Evolução - Últimos 6 Meses</h3>
              <div className="h-[250px]">
                <Bar
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top' },
                    },
                    scales: {
                      y: { beginAtZero: true },
                    },
                  }}
                />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-300 pt-4 text-center text-xs text-gray-600">
            <p>Relatório gerado em {formatDate(new Date())} | Imobiliária Geum</p>
          </div>
        </div>
      )}

      {showReport && !reportData && (
        <div className="bg-card rounded-xl p-12 text-center shadow-sm border border-border">
          <p className="text-4xl mb-2">📄</p>
          <p className="text-muted-foreground">Imóvel não encontrado</p>
        </div>
      )}
    </div>
  );
};
