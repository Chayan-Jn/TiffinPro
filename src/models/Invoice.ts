import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IInvoice extends Document {
  providerId: Types.ObjectId;
  customerId: Types.ObjectId;
  billingType: "monthly" | "per_tiffin";
  periodString: string;
  totalAmount: number;
  status: "pending" | "uploaded" | "paid";
  paymentProofUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    providerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "ProviderCustomer",
      required: true,
      index: true,
    },
    billingType: {
      type: String,
      enum: ["monthly", "per_tiffin"],
      required: true,
    },
    periodString: {
      type: String,
      required: true,
      trim: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "uploaded", "paid"],
      default: "pending",
      index: true,
    },
    paymentProofUrl: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const Invoice: Model<IInvoice> =
  mongoose.models.Invoice ?? mongoose.model<IInvoice>("Invoice", InvoiceSchema);

export default Invoice;
