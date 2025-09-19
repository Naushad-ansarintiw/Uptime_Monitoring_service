import mongoose from "mongoose";
const { Schema, models, model } = mongoose;
import type { Document } from "mongoose";

export interface ICheckResult extends Document {
  monitorId: mongoose.Types.ObjectId;
  timestamp: Date;
  statusCode?: number;
  up: boolean;
  responseTimeMs?: number;
  error?: string | null;
  headers?: Record<string, string | string[] | undefined>;
  ttfbMs?: number;
  totalTimeMs?: number;
}

const CheckResultSchema = new Schema<ICheckResult>({
  monitorId: { type: Schema.Types.ObjectId, ref: "Monitor", required: true, index: true },
  timestamp: { type: Date, default: () => new Date() }, // 👈 removed inline index
  statusCode: Number,
  up: { type: Boolean, required: true },
  responseTimeMs: Number,
  error: String,
  headers: Schema.Types.Mixed,
  ttfbMs: Number,
  totalTimeMs: Number,
});

// Compound index for monitor lookups
CheckResultSchema.index({ monitorId: 1, timestamp: -1 });

// TTL index (90 days)
CheckResultSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

const CheckResult =
  models.CheckResult || mongoose.model<ICheckResult>("CheckResult", CheckResultSchema);


export default CheckResult;