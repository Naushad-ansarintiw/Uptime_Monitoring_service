// models/CheckResult.ts
import mongoose, { Schema, Document, models } from "mongoose";

export interface ICheckResult extends Document {
  monitorId: mongoose.Types.ObjectId;
  timestamp: Date;
  statusCode?: number;
  up: boolean;
  responseTimeMs?: number;
  error?: string | null;
  headers?: Record<string, string | string[] | undefined>;
}

const CheckResultSchema = new Schema<ICheckResult>({
  monitorId: { type: Schema.Types.ObjectId, ref: "Monitor", required: true, index: true },
  timestamp: { type: Date, default: () => new Date(), index: true },
  statusCode: Number,
  up: { type: Boolean, required: true },
  responseTimeMs: Number,
  error: String,
  headers: Schema.Types.Mixed,
});

// Indexes:
CheckResultSchema.index({ monitorId: 1, timestamp: -1 });
// TTL: keep raw checks for 90 days (adjust as needed)
CheckResultSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

const CheckResult = models.CheckResult || mongoose.model<ICheckResult>("CheckResult", CheckResultSchema);
export default CheckResult;
