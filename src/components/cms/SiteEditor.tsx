import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BannersManager } from './BannersManager';
import { SectionsManager } from './SectionsManager';
import { Globe, Layout, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

export const SiteEditor = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Editor do Site</h1>
                    <p className="text-muted-foreground">
                        Gerencie o conteúdo exebido na página inicial do site
                    </p>
                </div>
                <Button variant="outline" className="gap-2" onClick={() => window.open('/vitrine', '_blank')}>
                    <ExternalLink className="h-4 w-4" />
                    Ver Site
                </Button>
            </div>

            <Tabs defaultValue="banners" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="banners" className="gap-2">
                        <Image className="h-4 w-4" />
                        Banners
                    </TabsTrigger>
                    <TabsTrigger value="sections" className="gap-2">
                        <Layout className="h-4 w-4" />
                        Seções
                    </TabsTrigger>
                </TabsList>

                <div className="mt-6 border rounded-xl p-6 bg-card shadow-sm">
                    <TabsContent value="banners" className="mt-0">
                        <BannersManager />
                    </TabsContent>

                    <TabsContent value="sections" className="mt-0">
                        <SectionsManager />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
};
