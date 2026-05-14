import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IProviderCustomer extends Document {
  providerId: Types.ObjectId;
  userId: Types.ObjectId | null; // null = unlinked (no account yet)
  displayName: string;           // provider's label for this customer
  status: "unlinked" | "linked";
  notes: string;
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
    status: {
      type: String,
      enum: ["unlinked", "linked"],
      default: "unlinked",
    },
    notes: {
      type: String,
      default: "",
      maxlength: 500,
    },
  },
  { timestamps: true }
);

// A customer can only appear once per provider (even if multi-provider globally)
ProviderCustomerSchema.index({ providerId: 1, userId: 1 }, { unique: true, sparse: true });

const ProviderCustomer: Model<IProviderCustomer> =
  mongoose.models.ProviderCustomer ??
  mongoose.model<IProviderCustomer>("ProviderCustomer", ProviderCustomerSchema);

export default ProviderCustomer;
