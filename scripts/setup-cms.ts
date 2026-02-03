/**
 * Script para popular o CMS com dados iniciais
 * IMPORTANTE: Execute o SQL de migração no Supabase Dashboard ANTES de rodar este script.
 * Executar com: npx tsx scripts/setup-cms.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://polzdhlstwdvzmyxflrk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvbHpkaGxzdHdkdnpteXhmbHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NjQzNDcsImV4cCI6MjA3ODU0MDM0N30.-N1EtLTgpMPsYg5vsq6x806Q6vn_bgc2nliL-a_PleA";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function setupCMS() {
    console.log('🚀 Iniciando população de dados do CMS...\n');

    // 1. Verificar se tabelas existem
    const { error: checkError } = await supabase.from('site_sections').select('id').limit(1);

    if (checkError) {
        console.error('❌ Erro ao acessar tabelas:', checkError.message);
        console.log('⚠️ VOCÊ PRECISA EXECUTAR O SQL DE MIGRATION NO SUPABASE DASHBOARD PRIMEIRO!');
        console.log('   Arquivo: supabase/migrations/20260203000002_create_cms_tables.sql');
        return;
    }

    console.log('✅ Tabelas detectadas.');

    // 2. Inserir Seções Iniciais
    const initialSections = [
        {
            type: 'hero',
            title: 'Imobiliária Geum.',
            subtitle: 'Encontre seu próximo imóvel.',
            order_index: 0,
            content: {
                background_image: '/assets/londrina-hero.jpg',
                search_placeholder: 'Pesquise aqui...',
                show_filters: true
            }
        },
        {
            type: 'property_list',
            title: 'Destaques',
            subtitle: 'Imóveis selecionados para você',
            order_index: 1,
            content: {
                filter_type: 'featured',
                filter_value: true,
                limit: 8
            }
        },
        {
            type: 'property_list',
            title: 'Gleba Palhano',
            subtitle: 'A região mais valorizada de Londrina',
            order_index: 2,
            content: {
                filter_type: 'neighborhood',
                filter_value: ['gleba', 'palhano'],
                limit: 8
            }
        },
        {
            type: 'banner_carousel',
            title: 'Banners Principais',
            order_index: 3,
            content: {}
        },
        {
            type: 'property_list',
            title: 'Casas em Condomínio',
            subtitle: 'Segurança e conforto para sua família',
            order_index: 4,
            content: {
                filter_type: 'property_type',
                filter_value: ['condo', 'condomínio'],
                limit: 8
            }
        },
        {
            type: 'property_list',
            title: 'Terrenos',
            subtitle: 'Construa o sonho da sua vida',
            order_index: 5,
            content: {
                filter_type: 'property_type',
                filter_value: ['land', 'lot', 'terreno'],
                limit: 8
            }
        },
        {
            type: 'property_list',
            title: 'Lançamentos',
            subtitle: 'Novidades e empreendimentos na planta',
            order_index: 6,
            content: {
                filter_type: 'publication_type',
                filter_value: 'Launch',
                limit: 8
            }
        },
        {
            type: 'media_grid',
            title: 'Geum na Mídia',
            subtitle: 'Confira o que os principais portais de notícias falam sobre a Imobiliária Geum.',
            order_index: 7,
            content: {
                items: [
                    {
                        title: "Geum Imob: a campeã de vendas do Estância Albatroz Residence",
                        source: "Folha de Londrina",
                        logo: "/assets/logo-folha.png",
                        link: "https://www.folhadelondrina.com.br/colunistas/ana-maziero/geum-imob-a-campea-de-vendas-do-estancia-albatroz-residence-3276149e.html",
                        logoClass: "h-8 md:h-10 opacity-100 mix-blend-multiply filter contrast-[2] brightness-[0.2]"
                    },
                    {
                        title: "Cenas de uma noite especial: Geumland 2026",
                        source: "Tarobá News",
                        logo: "/assets/logo-taroba.png",
                        link: "https://taroba.com.br/blog-do-nassif/cenas-de-uma-noite-especial-geumland-2026",
                        logoClass: "h-8 md:h-12 brightness-0"
                    }
                ]
            }
        }
    ];

    console.log('📝 Processando seções...');
    for (const section of initialSections) {
        const { data: existing } = await supabase
            .from('site_sections')
            .select('id')
            .eq('title', section.title)
            .eq('type', section.type)
            .single();

        if (!existing) {
            const { error } = await supabase.from('site_sections').insert(section);
            if (error) console.error(`   ❌ Erro ao inserir "${section.title}":`, error.message);
            else console.log(`   ✅ Seção "${section.title}" criada.`);
        } else {
            console.log(`   ℹ️ Seção "${section.title}" já existe.`);
        }
    }

    // 3. Inserir Banners
    const initialBanners = [
        {
            title: 'Imóveis Exclusivos Geum',
            image_url: '/assets/banner-exclusividade.jpg',
            link_url: '/',
            external_link: false,
            order_index: 1
        },
        {
            title: 'Geum Cast - Podcast Imobiliário',
            image_url: '/assets/banner-geumcast.jpg',
            link_url: 'https://www.youtube.com/@geumcast',
            external_link: true,
            order_index: 2
        }
    ];

    console.log('\n📝 Processando banners...');
    for (const banner of initialBanners) {
        const { data: existing } = await supabase
            .from('site_banners')
            .select('id')
            .eq('title', banner.title)
            .single();

        if (!existing) {
            const { error } = await supabase.from('site_banners').insert(banner);
            if (error) console.error(`   ❌ Erro ao inserir banner "${banner.title}":`, error.message);
            else console.log(`   ✅ Banner "${banner.title}" criado.`);
        } else {
            console.log(`   ℹ️ Banner "${banner.title}" já existe.`);
        }
    }

    console.log('\n🏁 Script finalizado!');
}

setupCMS();
