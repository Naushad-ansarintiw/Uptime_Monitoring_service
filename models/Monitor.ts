import mongoose from "mongoose";
const { Schema, models, model } = mongoose;
import type { Document } from "mongoose";

export interface IMonitor extends Document {
  _id: mongoose.Types.ObjectId;
  url: string;
  name?: string;
  frequencySec: number;
  timeoutMs: number;
  expectedStatusCodes?: number[];
  checkType?: "http_ping" | "full_page";
  active: boolean;
  lastCheckedAt?: Date;
  lastStatusCode?: number;
  lastUp?: boolean;
  createdAt: Date;
}

const MonitorSchema = new Schema<IMonitor>({
  _id: { type: Schema.Types.ObjectId, auto: true },
  url: { type: String, required: true },
  name: { type: String },
  frequencySec: { type: Number, required: true, min: 10 }, // keep a min
  timeoutMs: { type: Number, default: 10000 },
  expectedStatusCodes: { type: [Number], default: undefined },
  checkType: { type: String, enum: ["http_ping", "full_page"], default: "http_ping" },
  active: { type: Boolean, default: true },
  lastCheckedAt: { type: Date },
  lastStatusCode: { type: Number },
  lastUp: { type: Boolean },
  createdAt: { type: Date, default: () => new Date() },
});

const Monitor = models.Monitor || mongoose.model<IMonitor>("Monitor", MonitorSchema);
export default Monitor;
