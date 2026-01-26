/**
 * Script para corrigir leads antigos sem stage_id
 * Atribui o primeiro estágio do pipeline a todos os leads que não têm stage_id
 *
 * Executar com: npx tsx scripts/fix-leads-stage.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://polzdhlstwdvzmyxflrk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbHpkaGxzdHdkdnpteXhmbHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NjQzNDcsImV4cCI6MjA3ODU0MDM0N30.-N1EtLTgpMPsYg5vsq6x806Q6vn_bgc2nliL-a_PleA";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixLeadsWithoutStage() {
  console.log('Buscando primeiro estagio do pipeline...');

  // Buscar primeiro estágio
  const { data: firstStage, error: stageError } = await supabase
    .from('lead_pipeline_stages')
    .select('id, name')
    .order('order_index', { ascending: true })
    .limit(1)
    .single();

  if (stageError || !firstStage) {
    console.error('Erro ao buscar primeiro estagio:', stageError);
    return;
  }

  console.log('Primeiro estagio encontrado: "' + firstStage.name + '" (' + firstStage.id + ')');

  // Buscar leads sem stage_id
  const { data: leadsWithoutStage, error: leadsError } = await supabase
    .from('leads')
    .select('id, nome')
    .is('stage_id', null);

  if (leadsError) {
    console.error('Erro ao buscar leads:', leadsError);
    return;
  }

  if (!leadsWithoutStage || leadsWithoutStage.length === 0) {
    console.log('Nenhum lead sem stage_id encontrado. Tudo certo!');
    return;
  }

  console.log('Encontrados ' + leadsWithoutStage.length + ' leads sem stage_id:');
  leadsWithoutStage.forEach((lead, i) => {
    console.log('   ' + (i + 1) + '. ' + lead.nome + ' (' + lead.id + ')');
  });

  // Atualizar todos os leads sem stage_id
  console.log('\nAtualizando leads...');

  const { data: updatedLeads, error: updateError } = await supabase
    .from('leads')
    .update({ stage_id: firstStage.id })
    .is('stage_id', null)
    .select('id, nome');

  if (updateError) {
    console.error('Erro ao atualizar leads:', updateError);
    return;
  }

  console.log('\n' + (updatedLeads?.length || 0) + ' leads atualizados com sucesso!');
  console.log('Todos agora estao no estagio "' + firstStage.name + '"');
}

fixLeadsWithoutStage();
