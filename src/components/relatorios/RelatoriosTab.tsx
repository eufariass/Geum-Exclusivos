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
import { motion } from 'framer-motion';
import {
  Users,
  Eye,
  CalendarCheck,
  ArrowUp,
  ArrowDown,
  Minus,
  FileText,
  FileX,
  TrendingUp,
  Percent,
  Clock,
  History
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface RelatoriosTabProps {
  showToast: (message: string, type: 'success' | 'error') => void;
}

interface RecentReport {
  imovelId: string;
  mes: string;
  timestamp: number;
}

export const RelatoriosTab = ({ showToast }: RelatoriosTabProps) => {
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [metricas, setMetricas] = useState<Metrica[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedImovelId, setSelectedImovelId] = useState('');
  const [selectedMes, setSelectedMes] = useState(getCurrentMonth());
  const [showReport, setShowReport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);

  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
    loadRecentReports();
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

  const loadRecentReports = () => {
    const saved = localStorage.getItem('recentReports');
    if (saved) {
      try {
        setRecentReports(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing recent reports', e);
      }
    }
  };

  const saveRecentReport = (imovelId: string, mes: string) => {
    const newItem: RecentReport = { imovelId, mes, timestamp: Date.now() };
    const filtered = recentReports.filter(r => !(r.imovelId === imovelId && r.mes === mes));
    const newReports = [newItem, ...filtered].slice(0, 3);
    setRecentReports(newReports);
    localStorage.setItem('recentReports', JSON.stringify(newReports));
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

    const current = currentMetrics || {
      leads: 0, leads_portais: 0, leads_meta: 0, leads_google: 0,
      visualizacoes: 0, visualizacoes_portais: 0, visualizacoes_meta: 0, visualizacoes_google: 0,
      visitas_realizadas: 0
    };
    const previous = previousMetrics || { leads: 0, visualizacoes: 0, visitas_realizadas: 0 };

    const conversionRate = current.visualizacoes > 0 ? (current.leads / current.visualizacoes) * 100 : 0;
    const previousConversionRate = previous.visualizacoes > 0 ? (previous.leads / previous.visualizacoes) * 100 : 0;

    const visitsRatio = current.leads > 0 ? (current.visitas_realizadas / current.leads) * 100 : 0;
    const previousVisitsRatio = previous.leads > 0 ? (previous.visitas_realizadas / previous.leads) * 100 : 0;

    return {
      imovel: selectedImovel,
      mes: selectedMes,
      leads: {
        value: current.leads,
        trend: getTrend(current.leads, previous.leads),
        breakdown: {
          portais: current.leads_portais || 0,
          meta: current.leads_meta || 0,
          google: current.leads_google || 0
        }
      },
      visualizacoes: {
        value: current.visualizacoes,
        trend: getTrend(current.visualizacoes, previous.visualizacoes),
        breakdown: {
          portais: current.visualizacoes_portais || 0,
          meta: current.visualizacoes_meta || 0,
          google: current.visualizacoes_google || 0
        }
      },
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
          backgroundColor: ['#e5e7eb', '#18181b'], // Gray-200, Zinc-900
          borderRadius: 4,
          borderWidth: 0,
          barPercentage: 0.6,
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
          backgroundColor: ['#e5e7eb', '#52525b'], // Gray-200, Zinc-600
          borderRadius: 4,
          borderWidth: 0,
          barPercentage: 0.6,
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
    saveRecentReport(selectedImovelId, selectedMes);
  };

  const handleLoadRecent = (report: RecentReport) => {
    setSelectedImovelId(report.imovelId);
    setSelectedMes(report.mes);
    setShowReport(true);
    // Optional: could auto-scroll to report
  };

  const handleExportPDF = async () => {
    if (!reportRef.current || !selectedImovel) return;

    setIsExporting(true);
    showToast('Gerando PDF...', 'success');

    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 4,
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
      <div className="grid gap-6 md:grid-cols-3">
        {/* Generator Card */}
        <div className="md:col-span-2 bg-card rounded-xl p-6 shadow-sm border border-border no-print">
          <h2 className="text-xl font-bold mb-4">Gerar Relatório</h2>
          <div className="grid gap-4 sm:grid-cols-2">
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

            <div className="sm:col-span-2 flex items-end gap-2">
              <Button onClick={handleGenerate} className="flex-1 bg-black hover:bg-zinc-800 text-white">
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

        {/* Recent Reports Card */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border no-print">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <History className="w-5 h-5" />
            Últimos Relatórios
          </h2>
          {recentReports.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum relatório recente.</p>
          ) : (
            <div className="space-y-3">
              {recentReports.map((report, idx) => {
                const imovel = imoveis.find(i => i.id === report.imovelId);
                return (
                  <button
                    key={idx}
                    onClick={() => handleLoadRecent(report)}
                    className="w-full text-left p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors text-sm group"
                  >
                    <div className="font-medium truncate">{imovel?.codigo || 'Imóvel removido'}</div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                      <span>{getMonthName(report.mes)}</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">Abrir →</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showReport && reportData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          ref={reportRef}
          className="bg-white rounded-none shadow-xl overflow-hidden max-w-5xl mx-auto"
          id="report-content"
        >
          {/* Header Monochrome */}
          <div className="bg-black p-10 text-white">
            <div className="flex items-center justify-between mb-8">
              <img src={logoBlack} alt="Geum" className="h-14 w-auto brightness-0 invert" />
              <div className="text-right">
                <h1 className="text-3xl font-light tracking-wide uppercase">Relatório de Performance</h1>
                <p className="text-sm text-gray-400 mt-2 font-light uppercase tracking-widest">{getMonthName(selectedMes)}</p>
              </div>
            </div>

            {/* Layout com foto e informações lado a lado */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {/* Foto de capa do imóvel */}
              {reportData.imovel.image_urls && reportData.imovel.image_urls.length > 0 && (
                <div className="md:col-span-1">
                  <div className="bg-zinc-900 rounded-sm overflow-hidden h-full">
                    <img
                      src={reportData.imovel.image_urls[reportData.imovel.cover_image_index || 0]}
                      alt={reportData.imovel.codigo}
                      className="w-full h-48 md:h-full object-cover opacity-90"
                      crossOrigin="anonymous"
                    />
                  </div>
                </div>
              )}

              {/* Informações do imóvel */}
              <div className={`grid grid-cols-2 gap-4 ${reportData.imovel.image_urls && reportData.imovel.image_urls.length > 0 ? 'md:col-span-2' : 'md:col-span-3'}`}>
                <div className="bg-zinc-900/50 p-4 border-l-2 border-white/20">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Código</p>
                  <p className="font-medium text-sm text-white">{reportData.imovel.codigo}</p>
                </div>
                <div className="bg-zinc-900/50 p-4 border-l-2 border-white/20">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Tipo</p>
                  <p className="font-medium text-sm text-white">{reportData.imovel.tipo}</p>
                </div>
                <div className="col-span-2 bg-zinc-900/50 p-4 border-l-2 border-white/20">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Endereço</p>
                  <p className="font-medium text-sm text-white">{reportData.imovel.endereco}</p>
                </div>
                <div className="col-span-2 bg-zinc-900/50 p-4 border-l-2 border-white/20">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Cliente Propriétario</p>
                  <p className="font-medium text-sm text-white">{reportData.imovel.cliente}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Conteúdo principal */}
          <div className="p-10 bg-white">
            {/* Cards de métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              {/* Funil de Visualizações */}
              <div className="bg-white border-b-2 border-black pb-6">
                <div className="flex items-center gap-3 mb-6">
                  <Eye className="w-5 h-5 text-black" />
                  <h3 className="font-bold text-black uppercase tracking-wider text-sm">Funil de Visualizações</h3>
                </div>

                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Portais Imobiliários</span>
                      <span className="font-medium">{reportData.visualizacoes.breakdown.portais.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5">
                      <div
                        className="bg-black h-1.5"
                        style={{ width: `${reportData.visualizacoes.value > 0 ? (reportData.visualizacoes.breakdown.portais / reportData.visualizacoes.value) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Meta Ads</span>
                      <span className="font-medium">{reportData.visualizacoes.breakdown.meta.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5">
                      <div
                        className="bg-zinc-600 h-1.5"
                        style={{ width: `${reportData.visualizacoes.value > 0 ? (reportData.visualizacoes.breakdown.meta / reportData.visualizacoes.value) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Google</span>
                      <span className="font-medium">{reportData.visualizacoes.breakdown.google.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5">
                      <div
                        className="bg-zinc-400 h-1.5"
                        style={{ width: `${reportData.visualizacoes.value > 0 ? (reportData.visualizacoes.breakdown.google / reportData.visualizacoes.value) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="pt-4 mt-2 border-t border-gray-100 flex justify-between items-end">
                    <span className="text-xs uppercase tracking-widest text-gray-500">Total Visualizações</span>
                    <span className="text-3xl font-light text-black">{reportData.visualizacoes.value.toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </div>

              {/* Funil de Leads */}
              <div className="bg-white border-b-2 border-black pb-6">
                <div className="flex items-center gap-3 mb-6">
                  <Users className="w-5 h-5 text-black" />
                  <h3 className="font-bold text-black uppercase tracking-wider text-sm">Funil de Leads</h3>
                </div>

                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Portais Imobiliários</span>
                      <span className="font-medium">{reportData.leads.breakdown.portais}</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5">
                      <div
                        className="bg-black h-1.5"
                        style={{ width: `${reportData.leads.value > 0 ? (reportData.leads.breakdown.portais / reportData.leads.value) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Meta Ads</span>
                      <span className="font-medium">{reportData.leads.breakdown.meta}</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5">
                      <div
                        className="bg-zinc-600 h-1.5"
                        style={{ width: `${reportData.leads.value > 0 ? (reportData.leads.breakdown.meta / reportData.leads.value) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Google</span>
                      <span className="font-medium">{reportData.leads.breakdown.google}</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5">
                      <div
                        className="bg-zinc-400 h-1.5"
                        style={{ width: `${reportData.leads.value > 0 ? (reportData.leads.breakdown.google / reportData.leads.value) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="pt-4 mt-2 border-t border-gray-100 flex justify-between items-end">
                    <span className="text-xs uppercase tracking-widest text-gray-500">Total Leads</span>
                    <span className="text-3xl font-light text-black">{reportData.leads.value.toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </div>

              {/* Visitas (Full Width Row below funnels) */}
              <div className="md:col-span-2">
                <div className="bg-zinc-50 border border-zinc-200 p-8 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="p-4 bg-white border border-zinc-200 rounded-full">
                      <CalendarCheck className="w-8 h-8 text-black" />
                    </div>
                    <div>
                      <h3 className="font-bold text-black text-xl uppercase tracking-wider">Visitas Realizadas</h3>
                      <p className="text-sm text-gray-500">Total de visitas presenciais ao imóvel</p>
                    </div>
                  </div>
                  <div className="text-5xl font-light text-black">
                    {reportData.visitas.value}
                  </div>
                </div>
              </div>
            </div>

            {/* Gráficos de comparação */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {leadsChartData && (
                <div className="p-6 border border-gray-100 bg-white">
                  <div className="mb-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Evolução de Leads</h3>
                  </div>
                  <div className="h-[200px]">
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
                            grid: { color: 'rgba(0, 0, 0, 0.05)' },
                            ticks: { font: { family: 'monospace' } }
                          },
                          x: {
                            grid: { display: false },
                            ticks: { font: { family: 'monospace' } }
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              )}

              {visitasChartData && (
                <div className="p-6 border border-gray-100 bg-white">
                  <div className="mb-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Evolução de Visitas</h3>
                  </div>
                  <div className="h-[200px]">
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
                            grid: { color: 'rgba(0, 0, 0, 0.05)' },
                            ticks: { font: { family: 'monospace' } }
                          },
                          x: {
                            grid: { display: false },
                            ticks: { font: { family: 'monospace' } }
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-black text-white px-10 py-6">
            <div className="flex justify-between items-center text-xs opacity-60 font-light tracking-wider">
              <p>IMOBILIÁRIA GEUM EXCLUSIVOS</p>
              <p>{formatDate(new Date())}</p>
            </div>
          </div>
        </motion.div>
      )}

      {showReport && !reportData && (
        <div className="bg-card rounded-xl p-12 text-center shadow-sm border border-border">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <FileX className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Imóvel não encontrado ou sem dados para o período.</p>
        </div>
      )}
    </div>
  );
};
