import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ITiffinLog extends Document {
  providerId: Types.ObjectId;
  customerId: Types.ObjectId; // References ProviderCustomer
  date: string; // YYYY-MM-DD
  mealName: string; // e.g. "Breakfast", "Lunch", "Dinner"
  quantity: number; // 0 = skipped, 1 = standard, 2+ = extra
  status: "pending" | "delivered" | "cancelled" | "paused";
  createdAt: Date;
  updatedAt: Date;
}

const TiffinLogSchema = new Schema<ITiffinLog>(
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
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
      index: true,
    },
    mealName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "delivered", "cancelled", "paused"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// One log per customer per date per mealName
TiffinLogSchema.index({ customerId: 1, date: 1, mealName: 1 }, { unique: true });

// Clear cache to ensure schema updates apply in Next.js hot-reload
if (mongoose.models.TiffinLog) {
  delete mongoose.models.TiffinLog;
}
const TiffinLog: Model<ITiffinLog> = mongoose.model<ITiffinLog>("TiffinLog", TiffinLogSchema);

export default TiffinLog;
