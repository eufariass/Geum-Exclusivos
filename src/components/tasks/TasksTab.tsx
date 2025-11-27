import { useState } from 'react';
import { TaskList } from './TaskList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { CheckSquare, Clock, AlertCircle } from 'lucide-react';
import { tasksService } from '@/services/tasks.service';
import { useEffect } from 'react';
import type { TaskSummary } from '@/types';

export const TasksTab = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [summary, setSummary] = useState<TaskSummary>({
    pending_count: 0,
    in_progress_count: 0,
    completed_count: 0,
    overdue_count: 0,
    due_today_count: 0,
  });

  useEffect(() => {
    loadSummary();
  }, [refreshKey]);

  const loadSummary = async () => {
    const data = await tasksService.getTaskSummary();
    setSummary(data);
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Tarefas</h1>
          <p className="text-muted-foreground mt-1">
            Organize e acompanhe todas as suas tarefas e compromissos
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100">
                <Clock className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">{summary.pending_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <CheckSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Em Progresso</p>
                <p className="text-2xl font-bold">{summary.in_progress_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckSquare className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold">{summary.completed_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Para Hoje</p>
                <p className="text-2xl font-bold">{summary.due_today_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vencidas</p>
                <p className="text-2xl font-bold">{summary.overdue_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Board */}
      <TaskList key={refreshKey} />
    </div>
  );
};
