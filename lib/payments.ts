export async function createPaymentLink({
  amount,
  customer_name,
  customer_email
}: {
  amount: number;
  customer_name: string;
  customer_email: string;
}) {
  const res = await fetch("https://api.korapay.com/merchant/api/v1/charges/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.KORAPAY_SECRET}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount,
      currency: "NGN",
      customer: {
        name: customer_name,
        email: customer_email
      }
    })
  });

  const data = await res.json();

  if (!data.status) {
    throw new Error(data.message || "Payment creation failed");
  }

  return {
    success: true,
    payment_link: data.data.checkout_url,
    reference: data.data.reference
  };
}

export async function verifyPayment(reference: string) {
  const res = await fetch(`https://api.korapay.com/merchant/api/v1/charges/${reference}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.KORAPAY_SECRET}`
    }
  });

  const data = await res.json();

  return {
    success: data.status,
    status: data.data?.status,
    amount: data.data?.amount
  };
}
