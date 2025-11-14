import { useState, useMemo, useRef, useEffect } from 'react';
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
import { supabaseStorageService } from '@/lib/supabaseStorage';
import { getCurrentMonth, getMonthName, getPreviousMonth, getLast6Months, formatDate } from '@/lib/dateUtils';
import type { Imovel, Metrica } from '@/types';
import logoBlack from '@/assets/logo-geum-black.png';
import leadsIcon from '@/assets/leads-icon.jpg';
import visualizacoesIcon from '@/assets/visualizacoes-icon.jpg';
import visitasIcon from '@/assets/visitas-icon.jpg';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface RelatoriosTabProps {
  showToast: (message: string, type: 'success' | 'error') => void;
}

export const RelatoriosTab = ({ showToast }: RelatoriosTabProps) => {
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [metricas, setMetricas] = useState<Metrica[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedImovelId, setSelectedImovelId] = useState('');
  const [selectedMes, setSelectedMes] = useState(getCurrentMonth());
  const [showReport, setShowReport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [imoveisData, metricasData] = await Promise.all([
        supabaseStorageService.getImoveis(),
        supabaseStorageService.getMetricas()
      ]);
      setImoveis(imoveisData);
      setMetricas(metricasData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showToast('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedImovel = useMemo(() => {
    return imoveis.find((i) => i.id === selectedImovelId);
  }, [imoveis, selectedImovelId]);

  const reportData = useMemo(() => {
    if (!selectedImovel) return null;

    const currentMetrics = metricas.find((m) => m.imovel_id === selectedImovelId && m.mes === selectedMes);
    const previousMonth = getPreviousMonth(selectedMes);
    const previousMetrics = metricas.find((m) => m.imovel_id === selectedImovelId && m.mes === previousMonth);

    const getTrend = (current: number, previous: number) => {
      if (previous === 0 && current > 0) return { value: 0, direction: 'new' as const };
      if (previous === 0) return { value: 0, direction: 'neutral' as const };
      const percent = Math.round(((current - previous) / previous) * 100);
      if (percent > 0) return { value: percent, direction: 'up' as const };
      if (percent < 0) return { value: Math.abs(percent), direction: 'down' as const };
      return { value: 0, direction: 'neutral' as const };
    };

    const current = currentMetrics || { leads: 0, visualizacoes: 0, visitas_realizadas: 0 };
    const previous = previousMetrics || { leads: 0, visualizacoes: 0, visitas_realizadas: 0 };

    return {
      imovel: selectedImovel,
      mes: selectedMes,
      leads: { value: current.leads, trend: getTrend(current.leads, previous.leads) },
      visualizacoes: { value: current.visualizacoes, trend: getTrend(current.visualizacoes, previous.visualizacoes) },
      visitas: { value: current.visitas_realizadas, trend: getTrend(current.visitas_realizadas, previous.visitas_realizadas) },
    };
  }, [selectedImovel, selectedImovelId, selectedMes, metricas]);

  const leadsChartData = useMemo(() => {
    if (!selectedImovelId) return null;

    const currentMetrics = metricas.find((m) => m.imovel_id === selectedImovelId && m.mes === selectedMes);
    const previousMonth = getPreviousMonth(selectedMes);
    const previousMetrics = metricas.find((m) => m.imovel_id === selectedImovelId && m.mes === previousMonth);

    const currentLeads = currentMetrics?.leads || 0;
    const previousLeads = previousMetrics?.leads || 0;

    return {
      labels: [getMonthName(previousMonth), getMonthName(selectedMes)],
      datasets: [
        {
          label: 'Leads',
          data: [previousLeads, currentLeads],
          backgroundColor: ['hsla(210, 15%, 60%, 0.6)', 'hsla(223, 94%, 59%, 1)'],
          borderRadius: 8,
          borderWidth: 0,
        },
      ],
    };
  }, [selectedImovelId, metricas, selectedMes]);

  const visitasChartData = useMemo(() => {
    if (!selectedImovelId) return null;

    const currentMetrics = metricas.find((m) => m.imovel_id === selectedImovelId && m.mes === selectedMes);
    const previousMonth = getPreviousMonth(selectedMes);
    const previousMetrics = metricas.find((m) => m.imovel_id === selectedImovelId && m.mes === previousMonth);

    const currentVisitas = currentMetrics?.visitas_realizadas || 0;
    const previousVisitas = previousMetrics?.visitas_realizadas || 0;

    return {
      labels: [getMonthName(previousMonth), getMonthName(selectedMes)],
      datasets: [
        {
          label: 'Visitas Realizadas',
          data: [previousVisitas, currentVisitas],
          backgroundColor: ['hsla(210, 15%, 60%, 0.6)', 'hsla(27, 100%, 55%, 1)'],
          borderRadius: 8,
          borderWidth: 0,
        },
      ],
    };
  }, [selectedImovelId, metricas, selectedMes]);

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
      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando relatórios...</div>
      </div>
    );
  }

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
        <div ref={reportRef} className="bg-white rounded-2xl shadow-xl overflow-hidden" id="report-content">
          {/* Header com gradiente azul */}
          <div className="bg-gradient-to-r from-[#325df9] to-[#1e3a8a] p-8 text-white">
            <div className="flex items-center justify-between mb-6">
              <img src={logoBlack} alt="Geum" className="h-12 w-auto brightness-0 invert" />
              <div className="text-right">
                <h1 className="text-3xl font-bold">Relatório Mensal</h1>
                <p className="text-sm opacity-90 capitalize mt-1">{getMonthName(selectedMes)}</p>
              </div>
            </div>

            {/* Layout com foto e informações lado a lado */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {/* Foto de capa do imóvel */}
              {reportData.imovel.image_urls && reportData.imovel.image_urls.length > 0 && (
                <div className="md:col-span-1">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden border border-white/20 h-full">
                    <img
                      src={reportData.imovel.image_urls[reportData.imovel.cover_image_index || 0]}
                      alt={reportData.imovel.codigo}
                      className="w-full h-48 md:h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  </div>
                </div>
              )}

              {/* Informações do imóvel */}
              <div className={`grid grid-cols-2 gap-3 ${reportData.imovel.image_urls && reportData.imovel.image_urls.length > 0 ? 'md:col-span-2' : 'md:col-span-3'}`}>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                  <p className="text-xs opacity-80 mb-1">Código</p>
                  <p className="font-semibold text-sm">{reportData.imovel.codigo}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                  <p className="text-xs opacity-80 mb-1">Tipo</p>
                  <p className="font-semibold text-sm">{reportData.imovel.tipo}</p>
                </div>
                <div className="col-span-2 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                  <p className="text-xs opacity-80 mb-1">Endereço</p>
                  <p className="font-semibold text-sm">{reportData.imovel.endereco}</p>
                </div>
                <div className="col-span-2 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                  <p className="text-xs opacity-80 mb-1">Cliente</p>
                  <p className="font-semibold text-sm">{reportData.imovel.cliente}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Conteúdo principal */}
          <div className="p-8">
            {/* Cards de métricas com design moderno */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="relative overflow-hidden rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#325df9]/5 rounded-full -mr-12 -mt-12"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#325df9]/10 flex items-center justify-center p-2">
                      <img src={leadsIcon} alt="Leads" className="w-full h-full object-contain" />
                    </div>
                    <span
                      className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                        reportData.leads.trend.direction === 'up'
                          ? 'bg-[#325df9]/10 text-[#325df9]'
                          : reportData.leads.trend.direction === 'down'
                          ? 'bg-red-50 text-red-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {reportData.leads.trend.direction === 'up' && '↑'}
                      {reportData.leads.trend.direction === 'down' && '↓'}
                      {reportData.leads.trend.direction === 'neutral' && '→'}
                      {reportData.leads.trend.direction === 'new' && '↑'}
                      {reportData.leads.trend.direction === 'new' ? ' Novo' : ` ${reportData.leads.trend.value}%`}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Leads</p>
                  <p className="text-3xl font-bold text-black">{reportData.leads.value}</p>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -mr-12 -mt-12"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center p-2">
                      <img src={visualizacoesIcon} alt="Visualizações" className="w-full h-full object-contain" />
                    </div>
                    <span
                      className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                        reportData.visualizacoes.trend.direction === 'up'
                          ? 'bg-purple-50 text-purple-600'
                          : reportData.visualizacoes.trend.direction === 'down'
                          ? 'bg-red-50 text-red-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {reportData.visualizacoes.trend.direction === 'up' && '↑'}
                      {reportData.visualizacoes.trend.direction === 'down' && '↓'}
                      {reportData.visualizacoes.trend.direction === 'neutral' && '→'}
                      {reportData.visualizacoes.trend.direction === 'new' && '↑'}
                      {reportData.visualizacoes.trend.direction === 'new' ? ' Novo' : ` ${reportData.visualizacoes.trend.value}%`}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Visualizações</p>
                  <p className="text-3xl font-bold text-black">{reportData.visualizacoes.value.toLocaleString('pt-BR')}</p>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full -mr-12 -mt-12"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center p-2">
                      <img src={visitasIcon} alt="Visitas" className="w-full h-full object-contain" />
                    </div>
                    <span
                      className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                        reportData.visitas.trend.direction === 'up'
                          ? 'bg-orange-50 text-orange-600'
                          : reportData.visitas.trend.direction === 'down'
                          ? 'bg-red-50 text-red-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {reportData.visitas.trend.direction === 'up' && '↑'}
                      {reportData.visitas.trend.direction === 'down' && '↓'}
                      {reportData.visitas.trend.direction === 'neutral' && '→'}
                      {reportData.visitas.trend.direction === 'new' && '↑'}
                      {reportData.visitas.trend.direction === 'new' ? ' Novo' : ` ${reportData.visitas.trend.value}%`}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Visitas Realizadas</p>
                  <p className="text-3xl font-bold text-black">{reportData.visitas.value}</p>
                </div>
              </div>
            </div>

            {/* Gráficos de comparação com design moderno */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {leadsChartData && (
                <div className="rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-6">
                    <h3 className="text-base font-bold text-black">Acompanhamento Mensal de Leads</h3>
                  </div>
                  <div className="h-[280px]">
                    <Bar
                      data={leadsChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                        },
                        scales: {
                          y: { 
                            beginAtZero: true,
                            grid: {
                              color: 'rgba(0, 0, 0, 0.05)',
                            },
                          },
                          x: {
                            grid: {
                              display: false,
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              )}

              {visitasChartData && (
                <div className="rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-6">
                    <h3 className="text-base font-bold text-black">Acompanhamento Mensal de Visitas</h3>
                  </div>
                  <div className="h-[280px]">
                    <Bar
                      data={visitasChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                        },
                        scales: {
                          y: { 
                            beginAtZero: true,
                            grid: {
                              color: 'rgba(0, 0, 0, 0.05)',
                            },
                          },
                          x: {
                            grid: {
                              display: false,
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mensagem de agradecimento */}
          <div className="px-8 pb-6">
            <div className="bg-gradient-to-r from-[#325df9]/5 to-[#1e3a8a]/5 rounded-xl p-6 border border-[#325df9]/20">
              <p className="text-center text-sm text-gray-700 leading-relaxed">
                <span className="font-semibold text-[#325df9]">Agradecemos</span> por manter seu imóvel com <span className="font-semibold">exclusividade</span> na <span className="font-semibold text-[#325df9]">Imobiliária Geum</span>.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 bg-gray-50 px-8 py-4">
            <p className="text-center text-xs text-gray-500">
              Relatório gerado em {formatDate(new Date())} | <span className="font-semibold">Imobiliária Geum</span>
            </p>
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
