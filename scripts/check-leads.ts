/**
 * Script para verificar status dos leads
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://polzdhlstwdvzmyxflrk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbHpkaGxzdHdkdnpteXhmbHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NjQzNDcsImV4cCI6MjA3ODU0MDM0N30.-N1EtLTgpMPsYg5vsq6x806Q6vn_bgc2nliL-a_PleA";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkLeads() {
  console.log('Verificando leads no sistema...\n');

  // Buscar todos os leads
  const { data: allLeads, error: allError } = await supabase
    .from('leads')
    .select('id, nome, stage_id, created_at')
    .order('created_at', { ascending: false });

  if (allError) {
    console.error('Erro ao buscar leads:', allError);
    return;
  }

  console.log('Total de leads: ' + (allLeads?.length || 0));

  if (allLeads && allLeads.length > 0) {
    const withStage = allLeads.filter(l => l.stage_id);
    const withoutStage = allLeads.filter(l => !l.stage_id);

    console.log('  - Com stage_id: ' + withStage.length);
    console.log('  - Sem stage_id: ' + withoutStage.length);

    console.log('\nUltimos 5 leads:');
    allLeads.slice(0, 5).forEach((lead, i) => {
      console.log('  ' + (i + 1) + '. ' + lead.nome + ' | stage_id: ' + (lead.stage_id || 'NULL') + ' | ' + lead.created_at);
    });
  }

  // Verificar estágios do pipeline
  const { data: stages, error: stagesError } = await supabase
    .from('lead_pipeline_stages')
    .select('id, name, order_index')
    .order('order_index');

  if (!stagesError && stages) {
    console.log('\nEstagios do pipeline:');
    stages.forEach((stage, i) => {
      console.log('  ' + (i + 1) + '. ' + stage.name + ' (order: ' + stage.order_index + ')');
    });
  }
}

checkLeads();
