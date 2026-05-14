import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IMenuItem {
  mealName: string; // e.g. "Breakfast", "Lunch", "Dinner", "Snacks"
  description: string; // e.g. "Aloo Paratha, Dahi", "Dal Makhani, Roti, Rice"
}

export interface IDailyMenu extends Document {
  providerId: Types.ObjectId;
  date: string; // YYYY-MM-DD format
  items: IMenuItem[];
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema = new Schema<IMenuItem>(
  {
    mealName: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const DailyMenuSchema = new Schema<IDailyMenu>(
  {
    providerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    items: {
      type: [MenuItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// One menu per provider per date
DailyMenuSchema.index({ providerId: 1, date: 1 }, { unique: true });

const DailyMenu: Model<IDailyMenu> =
  mongoose.models.DailyMenu ?? mongoose.model<IDailyMenu>("DailyMenu", DailyMenuSchema);

export default DailyMenu;
