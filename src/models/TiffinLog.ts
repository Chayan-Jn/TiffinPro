import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface ITiffinLog extends Document {
  providerId: Types.ObjectId;
  customerId: Types.ObjectId; // References ProviderCustomer
  date: string; // YYYY-MM-DD
  mealName: string; // e.g. "Breakfast", "Lunch", "Dinner"
  status: "delivered" | "cancelled" | "paused"; // paused = customer paused, cancelled = provider couldn't deliver
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
    status: {
      type: String,
      enum: ["delivered", "cancelled", "paused"],
      default: "delivered",
    },
  },
  { timestamps: true }
);

// One log per customer per date per mealName
TiffinLogSchema.index({ customerId: 1, date: 1, mealName: 1 }, { unique: true });

const TiffinLog: Model<ITiffinLog> =
  mongoose.models.TiffinLog ?? mongoose.model<ITiffinLog>("TiffinLog", TiffinLogSchema);

export default TiffinLog;
