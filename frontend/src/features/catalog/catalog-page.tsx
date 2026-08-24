import { PageHeader } from '@/components/page-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductsTab } from './products-tab'
import { EquipmentTab } from './equipment-tab'
import { ServiceOrdersTab } from './service-orders-tab'

export function CatalogPage() {
  return (
    <div>
      <PageHeader title="Catálogo" description="Máquinas, sementes, grãos, peças, equipamentos e ordens de serviço" />
      <div className="p-6">
        <Tabs defaultValue="products">
          <TabsList>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="equipment">Equipamentos</TabsTrigger>
            <TabsTrigger value="service-orders">Ordens de Serviço</TabsTrigger>
          </TabsList>
          <TabsContent value="products">
            <ProductsTab />
          </TabsContent>
          <TabsContent value="equipment">
            <EquipmentTab />
          </TabsContent>
          <TabsContent value="service-orders">
            <ServiceOrdersTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
