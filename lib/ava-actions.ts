import { createPaymentLink, verifyPayment } from "./payments";
import { createOrder } from "./orders";
import { getCustomerHistory } from "./customers";

type ActionInput = {
  action: string;
  parameters: any;
};

export async function handleAvaAction(actionObj: ActionInput) {
  const { action, parameters } = actionObj;

  try {
    switch (action) {
      case "create_payment_link":
        return await createPaymentLink(parameters);

      case "verify_payment":
        return await verifyPayment(parameters.reference);

      case "create_order":
        return await createOrder(parameters);

      case "get_customer_history":
        return await getCustomerHistory(parameters.customer_id);

      default:
        return {
          success: false,
          error: `Unknown action: ${action}`
        };
    }
  } catch (err: any) {
    console.error("AVA Action Error:", err);

    return {
      success: false,
      error: err.message || "Action execution failed"
    };
  }
}
