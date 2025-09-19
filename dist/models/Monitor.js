import mongoose from "mongoose";
const { Schema, models, model } = mongoose;
const MonitorSchema = new Schema({
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
const Monitor = models.Monitor || mongoose.model("Monitor", MonitorSchema);
export default Monitor;
