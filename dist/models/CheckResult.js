import mongoose from "mongoose";
const { Schema, models, model } = mongoose;
const CheckResultSchema = new Schema({
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
const CheckResult = models.CheckResult || mongoose.model("CheckResult", CheckResultSchema);
export default CheckResult;
