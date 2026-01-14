import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Users, Calendar, BarChart3, Save } from 'lucide-react';
import type { Imovel } from '@/types';
import { MonthPicker } from '@/components/ui/month-picker';

interface MetricasFormContentProps {
    formData: any;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    imoveis: Imovel[];
    MONTHS: { value: string; label: string }[];
    YEARS: number[];
    selectedMonth: string;
    setSelectedMonth: (value: string) => void;
    selectedYear: string;
    setSelectedYear: (value: string) => void;
    editingId: string | null;
}

export const MetricasFormContent = ({
    formData,
    setFormData,
    handleSubmit,
    imoveis,
    MONTHS,
    YEARS,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    editingId,
}: MetricasFormContentProps) => {
    const currentMonthValue = `${selectedYear}-${selectedMonth}`;

    const handleMonthChange = (newMonth: string) => {
        const [year, month] = newMonth.split('-');
        setSelectedYear(year);
        setSelectedMonth(month);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Context Section */}
            <Card className="border-l-4 border-l-black">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-zinc-700" />
                        Informações do Registro
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="imovel">Imóvel *</Label>
                        <Select value={formData.imovelId} onValueChange={(value) => setFormData((prev: any) => ({ ...prev, imovelId: value }))} disabled={!!editingId}>
                            <SelectTrigger id="imovel" className="h-11">
                                <SelectValue placeholder="Selecione o imóvel..." />
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

                    <div className="space-y-2">
                        <Label>Mês de Referência *</Label>
                        <div className="flex gap-2">
                            <MonthPicker
                                currentMonth={currentMonthValue}
                                onMonthChange={handleMonthChange}
                                disabled={!!editingId}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Funnels Section */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Views Funnel */}
                <Card className="overflow-hidden border border-zinc-200 shadow-sm">
                    <CardHeader className="bg-zinc-50 pb-4 border-b border-zinc-100">
                        <CardTitle className="text-lg flex items-center gap-2 text-zinc-800">
                            <Eye className="w-5 h-5 text-zinc-600" />
                            Funil de Visualizações
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Label htmlFor="visualizacoes_portais" className="w-32 text-sm font-normal text-zinc-500">Portais Imobiliários</Label>
                                <Input
                                    id="visualizacoes_portais"
                                    type="number"
                                    min="0"
                                    value={formData.visualizacoes_portais}
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, visualizacoes_portais: e.target.value }))}
                                    placeholder="0"
                                    className="font-mono"
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <Label htmlFor="visualizacoes_meta" className="w-32 text-sm font-normal text-zinc-500">Meta Ads</Label>
                                <Input
                                    id="visualizacoes_meta"
                                    type="number"
                                    min="0"
                                    value={formData.visualizacoes_meta}
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, visualizacoes_meta: e.target.value }))}
                                    placeholder="0"
                                    className="font-mono"
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <Label htmlFor="visualizacoes_google" className="w-32 text-sm font-normal text-zinc-500">Google</Label>
                                <Input
                                    id="visualizacoes_google"
                                    type="number"
                                    min="0"
                                    value={formData.visualizacoes_google}
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, visualizacoes_google: e.target.value }))}
                                    placeholder="0"
                                    className="font-mono"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t flex items-center justify-between bg-zinc-50/50 -mx-6 px-6 pb-2">
                            <span className="font-semibold text-xs uppercase tracking-widest text-zinc-500">Total Visualizações</span>
                            <span className="text-2xl font-light text-black">
                                {parseInt(formData.visualizacoes || '0').toLocaleString('pt-BR')}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Leads Funnel */}
                <Card className="overflow-hidden border border-zinc-200 shadow-sm">
                    <CardHeader className="bg-zinc-50 pb-4 border-b border-zinc-100">
                        <CardTitle className="text-lg flex items-center gap-2 text-zinc-800">
                            <Users className="w-5 h-5 text-zinc-600" />
                            Funil de Leads
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Label htmlFor="leads_portais" className="w-32 text-sm font-normal text-zinc-500">Portais Imobiliários</Label>
                                <Input
                                    id="leads_portais"
                                    type="number"
                                    min="0"
                                    value={formData.leads_portais}
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, leads_portais: e.target.value }))}
                                    placeholder="0"
                                    className="font-mono"
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <Label htmlFor="leads_meta" className="w-32 text-sm font-normal text-zinc-500">Meta Ads</Label>
                                <Input
                                    id="leads_meta"
                                    type="number"
                                    min="0"
                                    value={formData.leads_meta}
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, leads_meta: e.target.value }))}
                                    placeholder="0"
                                    className="font-mono"
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <Label htmlFor="leads_google" className="w-32 text-sm font-normal text-zinc-500">Google</Label>
                                <Input
                                    id="leads_google"
                                    type="number"
                                    min="0"
                                    value={formData.leads_google}
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, leads_google: e.target.value }))}
                                    placeholder="0"
                                    className="font-mono"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t flex items-center justify-between bg-zinc-50/50 -mx-6 px-6 pb-2">
                            <span className="font-semibold text-xs uppercase tracking-widest text-zinc-500">Total Leads</span>
                            <span className="text-2xl font-light text-black">
                                {parseInt(formData.leads || '0').toLocaleString('pt-BR')}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Visits Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-zinc-800" />
                        Visitas e Fechamento
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 max-w-sm">
                        <Label htmlFor="visitas" className="w-32 text-sm font-normal text-zinc-500">Visitas Realizadas</Label>
                        <Input
                            id="visitas"
                            type="number"
                            min="0"
                            value={formData.visitasRealizadas}
                            onChange={(e) => setFormData((prev: any) => ({ ...prev, visitasRealizadas: e.target.value }))}
                            placeholder="0"
                            className="font-mono h-12 text-lg"
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end pt-4">
                <Button type="submit" size="lg" className="w-full md:w-48 h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all bg-black hover:bg-zinc-800 text-white">
                    {editingId ? (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Atualizar
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Salvar Métricas
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
};
