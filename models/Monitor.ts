import mongoose, { Schema, Document, models } from "mongoose";

export interface IMonitor extends Document {
  url: string;
  frequencySec: number;
  active: boolean;
  createdAt: Date;
}

const monitorSchema = new Schema<IMonitor>({
  url: { type: String, required: true },
  frequencySec: { type: Number, required: true, min: 30 },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const Monitor = models.Monitor || mongoose.model<IMonitor>("Monitor", monitorSchema);
export default Monitor;
