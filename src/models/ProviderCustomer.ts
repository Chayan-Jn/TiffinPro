import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IProviderCustomer extends Document {
  providerId: Types.ObjectId;
  userId: Types.ObjectId | null;  // null = unlinked (manual record)
  displayName: string;            // provider's label for this person
  phone: string;                  // optional contact number
  status: "unlinked" | "linked";
  tiffinStatus: "active" | "on_hold";
  notes: string;
  // True when a newly-connected customer's name closely matches this
  // manual record — shown as a ⚠️ duplicate warning on the provider side
  possibleDuplicateOf: Types.ObjectId | null;
  mealPlan?: {
    planType: "monthly" | "per_tiffin" | "custom";
    rate: number;
    startDate: Date;
    endDate?: Date;
    meals: string[]; // e.g. ["Breakfast", "Lunch", "Dinner", "Snacks"]
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProviderCustomerSchema = new Schema<IProviderCustomer>(
  {
    providerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
      maxlength: 15,
    },
    status: {
      type: String,
      enum: ["unlinked", "linked"],
      default: "unlinked",
    },
    tiffinStatus: {
      type: String,
      enum: ["active", "on_hold"],
      default: "active",
    },
    previousUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    notes: {
      type: String,
      default: "",
      maxlength: 500,
    },
    // Points to a linked ProviderCustomer record that may be a duplicate
    possibleDuplicateOf: {
      type: Schema.Types.ObjectId,
      ref: "ProviderCustomer",
      default: null,
    },
    mealPlan: {
      planType: {
        type: String,
        enum: ["monthly", "per_tiffin", "custom"],
        default: "monthly",
      },
      rate: { type: Number, default: 0 },
      startDate: { type: Date, default: Date.now },
      endDate: { type: Date },
      meals: {
        type: [String],
        default: ["Breakfast", "Lunch", "Dinner"],
      },
    },
  },
  { timestamps: true }
);

// A customer (userId) can only be linked once per provider
ProviderCustomerSchema.index(
  { providerId: 1, userId: 1 },
  { unique: true, sparse: true }
);

const ProviderCustomer: Model<IProviderCustomer> =
  mongoose.models.ProviderCustomer ??
  mongoose.model<IProviderCustomer>("ProviderCustomer", ProviderCustomerSchema);

export default ProviderCustomer;
