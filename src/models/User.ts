import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  role: "provider" | "customer";
  displayName: string;
  menuImageUrl?: string; // For providers: URL to the static mess menu photo
  paymentUpiId?: string; // Provider's UPI ID for billing
  paymentQrUrl?: string; // Provider's QR Code URL (B2)
  subscriptionExpiry?: Date; // For providers: When their SaaS subscription expires
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9_]+$/,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["provider", "customer"],
      required: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    menuImageUrl: {
      type: String,
      default: "",
    },
    paymentUpiId: {
      type: String,
      default: "",
      trim: true,
    },
    paymentQrUrl: {
      type: String,
      default: "",
    },
    subscriptionExpiry: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Clear cache to ensure schema updates apply in Next.js hot-reload
if (mongoose.models.User) {
  delete mongoose.models.User;
}
const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);

export default User;
