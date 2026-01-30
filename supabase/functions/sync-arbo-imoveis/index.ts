import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { XMLParser } from 'https://esm.sh/fast-xml-parser@4.3.2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ARBO_XML_URL = 'https://integracao.arboimoveis.com/api/custom-xml/imobiliaria/43e787db2bb29bb8a0fc93ef65082f57a456ae7f6d862b8841cf074866ea280bVJUlBMKYyAd5MnESvRG1uRfb2_G9rX1QvWGBvJljBz8=/vivareal-xml';

interface SyncStats {
    total_xml: number;
    created: number;
    updated: number;
    deactivated: number;
    synced_at: string;
}

interface ImovelArbo {
    listing_id: string;
    list_date: string | null;
    last_update_date: string | null;
    title: string | null;
    description: string | null;
    transaction_type: string | null;
    property_type: string | null;
    publication_type: string | null;
    featured: boolean;
    price: number | null;
    currency: string;
    state: string | null;
    state_abbr: string | null;
    city: string | null;
    neighborhood: string | null;
    address: string | null;
    street_number: string | null;
    complement: string | null;
    postal_code: string | null;
    latitude: number | null;
    longitude: number | null;
    living_area: number | null;
    lot_area: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    suites: number | null;
    garage: number | null;
    unit_floor: number | null;
    year_built: number | null;
    features: string[];
    images: string[];
    primary_image: string | null;
    detail_url: string | null;
    active: boolean;
    synced_at: string;
}

// Parse date strings from XML
function parseXmlDate(dateStr: string | undefined): string | null {
    if (!dateStr) return null;
    try {
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date.toISOString();
    } catch {
        return null;
    }
}

// Parse number safely
function parseNumber(value: unknown): number | null {
    if (value === undefined || value === null || value === '') return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
}

// Get text content handling CDATA
function getText(value: unknown): string | null {
    if (value === undefined || value === null) return null;
    if (typeof value === 'object' && value !== null && '#text' in value) {
        return String((value as { '#text': unknown })['#text']);
    }
    return String(value);
}

// Ensure array format
function ensureArray<T>(value: T | T[] | undefined): T[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
}

// Map XML listing to database format
function mapListingToImovel(listing: Record<string, unknown>): ImovelArbo {
    const location = (listing.Location || {}) as Record<string, unknown>;
    const details = (listing.Details || {}) as Record<string, unknown>;
    const media = (listing.Media || {}) as Record<string, unknown>;

    // Get state abbreviation from attribute or text
    const stateValue = location.State as Record<string, unknown> | string;
    let stateAbbr: string | null = null;
    let stateName: string | null = null;
    if (typeof stateValue === 'object' && stateValue !== null) {
        stateAbbr = getText(stateValue['@_abbreviation']) || getText(stateValue['#text']);
        stateName = getText(stateValue['#text']);
    } else {
        stateAbbr = getText(stateValue);
        stateName = getText(stateValue);
    }

    // Get price with currency
    const listPrice = details.ListPrice as Record<string, unknown> | string | number;
    let price: number | null = null;
    let currency = 'BRL';
    if (typeof listPrice === 'object' && listPrice !== null) {
        price = parseNumber(listPrice['#text']);
        currency = getText(listPrice['@_currency']) || 'BRL';
    } else {
        price = parseNumber(listPrice);
    }

    // Get images 
    const mediaItems = ensureArray((media.Item || []) as (Record<string, unknown> | string)[]);
    const images: string[] = [];
    let primaryImage: string | null = null;

    for (const item of mediaItems) {
        let url: string | null = null;
        let isPrimary = false;

        if (typeof item === 'object' && item !== null) {
            url = getText(item['#text']) || getText(item);
            isPrimary = getText(item['@_primary']) === 'true';
        } else {
            url = getText(item);
        }

        if (url) {
            images.push(url);
            if (isPrimary && !primaryImage) {
                primaryImage = url;
            }
        }
    }

    // Use first image as primary if none marked
    if (!primaryImage && images.length > 0) {
        primaryImage = images[0];
    }

    // Get features and remove duplicates
    const featuresRaw = ensureArray((details.Features as Record<string, unknown>)?.Feature || []);
    const features = [...new Set(featuresRaw.map(f => getText(f)).filter((f): f is string => f !== null))];

    return {
        listing_id: getText(listing.ListingID) || '',
        list_date: parseXmlDate(getText(listing.ListDate) || undefined),
        last_update_date: parseXmlDate(getText(listing.LastUpdateDate) || undefined),
        title: getText(listing.Title),
        description: getText(details.Description),
        transaction_type: getText(listing.TransactionType),
        property_type: getText(details.PropertyType),
        publication_type: getText(listing.PublicationType),
        featured: getText(listing.Featured) === 'true',
        price,
        currency,
        state: stateName,
        state_abbr: stateAbbr,
        city: getText(location.City),
        neighborhood: getText(location.Neighborhood),
        address: getText(location.Address),
        street_number: getText(location.StreetNumber),
        complement: getText(location.Complement),
        postal_code: getText(location.PostalCode),
        latitude: parseNumber(location.Latitude),
        longitude: parseNumber(location.Longitude),
        living_area: parseNumber(
            typeof details.LivingArea === 'object'
                ? (details.LivingArea as Record<string, unknown>)['#text']
                : details.LivingArea
        ),
        lot_area: parseNumber(
            typeof details.LotArea === 'object'
                ? (details.LotArea as Record<string, unknown>)['#text']
                : details.LotArea
        ),
        bedrooms: parseNumber(details.Bedrooms),
        bathrooms: parseNumber(details.Bathrooms),
        suites: parseNumber(details.Suites),
        garage: parseNumber(details.Garage),
        unit_floor: parseNumber(details.UnitFloor),
        year_built: parseNumber(details.YearBuilt),
        features,
        images,
        primary_image: primaryImage,
        detail_url: getText(listing.DetailViewUrl),
        active: true,
        synced_at: new Date().toISOString(),
    };
}

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create sync log entry
    const { data: syncLog, error: logError } = await supabase
        .from('arbo_sync_log')
        .insert({ status: 'running' })
        .select('id')
        .single();

    if (logError) {
        console.error('Error creating sync log:', logError);
    }

    const syncLogId = syncLog?.id;

    try {
        console.log('Fetching XML from Arbo...');

        // Fetch XML with User-Agent header
        const xmlResponse = await fetch(ARBO_XML_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; GeumSyncBot/1.0)',
            },
        });

        if (!xmlResponse.ok) {
            throw new Error(`Failed to fetch XML: ${xmlResponse.status} ${xmlResponse.statusText}`);
        }

        const xmlText = await xmlResponse.text();
        console.log(`Received XML (${xmlText.length} chars)`);

        // Parse XML
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            textNodeName: '#text',
            parseAttributeValue: false,
            trimValues: true,
        });

        const parsed = parser.parse(xmlText);
        const listings = ensureArray(parsed?.ListingDataFeed?.Listings?.Listing || []);
        console.log(`Found ${listings.length} listings in XML`);

        const stats: SyncStats = {
            total_xml: listings.length,
            created: 0,
            updated: 0,
            deactivated: 0,
            synced_at: new Date().toISOString(),
        };

        // Get current listing_ids from database
        const { data: currentImoveis } = await supabase
            .from('imoveis_arbo')
            .select('listing_id')
            .eq('active', true);

        const currentListingIds = new Set(currentImoveis?.map(i => i.listing_id) || []);
        const xmlListingIds = new Set<string>();

        // Process each listing
        for (const listing of listings) {
            const imovel = mapListingToImovel(listing as Record<string, unknown>);

            if (!imovel.listing_id) {
                console.warn('Skipping listing without ID');
                continue;
            }

            xmlListingIds.add(imovel.listing_id);

            // Check if exists
            const exists = currentListingIds.has(imovel.listing_id);

            // Upsert
            const { error: upsertError } = await supabase
                .from('imoveis_arbo')
                .upsert(imovel, { onConflict: 'listing_id' });

            if (upsertError) {
                console.error(`Error upserting ${imovel.listing_id}:`, upsertError);
                continue;
            }

            if (exists) {
                stats.updated++;
            } else {
                stats.created++;
            }
        }

        // Deactivate removed listings
        const toDeactivate = [...currentListingIds].filter(id => !xmlListingIds.has(id));
        if (toDeactivate.length > 0) {
            const { error: deactivateError } = await supabase
                .from('imoveis_arbo')
                .update({ active: false, synced_at: new Date().toISOString() })
                .in('listing_id', toDeactivate);

            if (deactivateError) {
                console.error('Error deactivating:', deactivateError);
            } else {
                stats.deactivated = toDeactivate.length;
            }
        }

        console.log('Sync complete:', stats);

        // Update sync log
        if (syncLogId) {
            await supabase
                .from('arbo_sync_log')
                .update({
                    status: 'success',
                    finished_at: new Date().toISOString(),
                    total_xml: stats.total_xml,
                    created_count: stats.created,
                    updated_count: stats.updated,
                    deactivated_count: stats.deactivated,
                })
                .eq('id', syncLogId);
        }

        return new Response(
            JSON.stringify({ success: true, stats }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Sync error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Update sync log with error
        if (syncLogId) {
            await supabase
                .from('arbo_sync_log')
                .update({
                    status: 'error',
                    finished_at: new Date().toISOString(),
                    error_message: errorMessage,
                })
                .eq('id', syncLogId);
        }

        return new Response(
            JSON.stringify({ success: false, error: errorMessage }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
