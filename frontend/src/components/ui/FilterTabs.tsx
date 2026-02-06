import * as Tabs from '@radix-ui/react-tabs';

type Filter =
  | 'all'
  | 'pending-review'  // ✅ Reemplaza 'completed'
  | 'in-review'
  | 'approved'
  | 'failed';         // ✅ Nuevo para reprobadas

interface FilterTabsProps {
  currentFilter: Filter;
  onFilterChange: (filter: Filter) => void;
}

export function FilterTabs({
  currentFilter,
  onFilterChange,
}: FilterTabsProps) {
  return (
    <Tabs.Root
      value={currentFilter}
      onValueChange={(value) =>
        onFilterChange(value as Filter)
      }
      className="mb-6"
    >
      <Tabs.List className="border-b border-gray-200 flex gap-6">
        <Tab value="all">Todas</Tab>
        <Tab value="pending-review">Pendientes</Tab>  {/* ✅ Cambiado */}
        <Tab value="in-review">En revisión</Tab>
        <Tab value="approved">Aprobadas</Tab>
        <Tab value="failed">Reprobadas</Tab>          {/* ✅ Nuevo */}
      </Tabs.List>
    </Tabs.Root>
  );
}

function Tab({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  return (
    <Tabs.Trigger
      value={value}
      className="
        py-3 px-1 text-sm font-medium border-b-2 transition-colors
        border-transparent text-gray-500
        hover:text-gray-700 hover:border-gray-300
        data-[state=active]:border-gray-900
        data-[state=active]:text-gray-900
      "
    >
      {children}
    </Tabs.Trigger>
  );
}
