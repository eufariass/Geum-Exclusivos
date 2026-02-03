/**
 * Script FINAL para limpar pipeline usando IDs reais descobertos
 * Executar com: npx tsx scripts/force-pipeline-cleanup.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://polzdhlstwdvzmyxflrk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbHpkaGxzdHdkdnpteXhmbHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NjQzNDcsImV4cCI6MjA3ODU0MDM0N30.-N1EtLTgpMPsYg5vsq6x806Q6vn_bgc2nliL-a_PleA";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// IDs reais descobertos
const STAGE_NOVO_LEAD_ID = 'ff93b391-ec17-4980-913c-a050366e036f';
const STAGE_EM_ATENDIMENTO_ID = '6f9a7fdd-41af-42b5-bd43-0026749c32b3'; // Era "Em andamento"
const STAGE_CONCLUIDO_ID = '0a34687f-15fb-4b1f-8442-31a83c9656c2'; // Já existe "Concluido"

const KEEP_IDS = [STAGE_NOVO_LEAD_ID, STAGE_EM_ATENDIMENTO_ID, STAGE_CONCLUIDO_ID];

async function forceCleanupFinal() {
    console.log('🔄 Iniciando limpeza FINAL com IDs reais...\n');

    // 1. Atualizar/Renomear as etapas que vamos manter
    console.log('1. Atualizando etapas principais...');

    // Novo Lead
    await supabase.from('lead_pipeline_stages').update({
        name: 'Novo Lead', order_index: 1, is_final: false, is_won: false, color: '#FFFFFF'
    }).eq('id', STAGE_NOVO_LEAD_ID);

    // Em atendimento (Renomeando "Em andamento")
    await supabase.from('lead_pipeline_stages').update({
        name: 'Em atendimento', order_index: 2, is_final: false, is_won: false, color: '#FCD34D'
    }).eq('id', STAGE_EM_ATENDIMENTO_ID);

    // Concluido
    await supabase.from('lead_pipeline_stages').update({
        name: 'Concluido', order_index: 3, is_final: true, is_won: true, color: '#22C55E'
    }).eq('id', STAGE_CONCLUIDO_ID);


    // 2. Migrar leads para as etapas corretas
    console.log('\n2. Migrando leads...');

    // Migrar "Qualificação" e outros intermediários para "Em atendimento"
    const intermediateIds = [
        'd9ad944f-f539-4a7b-af52-b009932f1b05', // Qualificação
        'ac18c760-9671-47e3-86cf-d84e8219144b', // Visita Agendada
        '83a9aac9-53b7-4d38-bdb9-3bf29b726f57', // Proposta Enviada
        '22410287-7ebf-4ab4-9114-25903132385f', // Negociação
        '58bfaf9d-bfe8-4b53-960a-b906fd8b8309'  // Contato Inicial
    ];
    const { error: errorMid } = await supabase
        .from('leads')
        .update({ stage_id: STAGE_EM_ATENDIMENTO_ID })
        .in('stage_id', intermediateIds);
    if (errorMid) console.error('Erro migrando intermediários:', errorMid.message);

    // Migrar "Ganho", "Perdido" para "Concluido"
    const finalIds = [
        '072c9c96-3264-440c-8306-531680b50cde', // Ganho
        '8d3091ca-6b1c-4397-a5ab-d9aabd1a585a'  // Perdido
    ];
    const { error: errorFinal } = await supabase
        .from('leads')
        .update({ stage_id: STAGE_CONCLUIDO_ID })
        .in('stage_id', finalIds);
    if (errorFinal) console.error('Erro migrando finais:', errorFinal.message);


    // 3. Deletar etapas antigas
    console.log('\n3. Deletando etapas antigas...');

    // Buscar todas etapas exceto as que vamos manter
    const { data: stagesToDelete } = await supabase
        .from('lead_pipeline_stages')
        .select('id, name')
        .not('id', 'in', `(${KEEP_IDS.map(id => `"${id}"`).join(',')})`);

    if (!stagesToDelete || stagesToDelete.length === 0) {
        console.log('   ✅ Nada para deletar.');
    } else {
        console.log(`   🗑️ Deletando ${stagesToDelete.length} etapas: ` + stagesToDelete.map(s => s.name).join(', '));

        for (const s of stagesToDelete) {
            const { error } = await supabase.from('lead_pipeline_stages').delete().eq('id', s.id);
            if (error) console.error(`      ❌ Erro ao deletar "${s.name}":`, error.message);
            else console.log(`      ✅ "${s.name}" deletada.`);
        }
    }

    console.log('\n🏁 Limpeza concluida! IDs corretos configurados.');
}

forceCleanupFinal();
