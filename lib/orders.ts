export async function createOrder({
  product,
  quantity,
  price
}: {
  product: string;
  quantity: number;
  price: number;
}) {
  // Placeholder logic (replace with SMM/SMS API)
  return {
    success: true,
    order_id: "ORD_" + Date.now(),
    product,
    quantity,
    price,
    status: "processing"
  };
}
