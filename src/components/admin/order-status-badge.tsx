import type { OrderStatus } from "@/lib/admin/orders";

const labels: Record<OrderStatus, string> = {
  pending: "Aguardando",
  confirmed: "Confirmado",
  shipped: "Enviado",
  delivered: "Entregue",
  canceled: "Cancelado",
};

const styles: Record<OrderStatus, string> = {
  pending: "bg-sol text-marinho",
  confirmed: "bg-turquesa text-marinho",
  shipped: "bg-cobalto text-white",
  delivered: "bg-marinho text-creme",
  canceled: "bg-coral/15 text-marinho line-through decoration-coral",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-bold whitespace-nowrap ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
