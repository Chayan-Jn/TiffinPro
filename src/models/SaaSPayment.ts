import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ISaaSPayment extends Document {
  providerId: Types.ObjectId;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  plan: "monthly" | "yearly";
  amount: number;
  status: "created" | "paid" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

const SaaSPaymentSchema = new Schema<ISaaSPayment>(
  {
    providerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
    plan: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["created", "paid", "failed"],
      default: "created",
    },
  },
  { timestamps: true }
);

if (mongoose.models.SaaSPayment) {
  delete mongoose.models.SaaSPayment;
}

const SaaSPayment: Model<ISaaSPayment> = mongoose.model<ISaaSPayment>("SaaSPayment", SaaSPaymentSchema);

export default SaaSPayment;
