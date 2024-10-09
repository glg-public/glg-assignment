import React from "react";
import * as ReactPDF from "@react-pdf/renderer";

import { Order } from "../../definitions/entities/Order";
import { ReceiptDocument } from "./ReceiptDocument";

export class ReceiptService {
  public static async render(order: Order): Promise<Buffer> {
    if (!order.details) throw new Error("Order details are missing");
    return ReactPDF.renderToBuffer(<ReceiptDocument order={order} />);
  }
}
