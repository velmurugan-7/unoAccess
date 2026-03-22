import mongoose, { Document, Schema } from 'mongoose';

export type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved';
export type IncidentImpact = 'none' | 'minor' | 'major' | 'critical';

export interface IIncidentUpdate {
  status: IncidentStatus;
  message: string;
  createdAt: Date;
}

export interface IIncident extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  impact: IncidentImpact;
  status: IncidentStatus;
  affectedComponents: string[];
  updates: IIncidentUpdate[];
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const IncidentUpdateSchema = new Schema<IIncidentUpdate>(
  {
    status: { type: String, enum: ['investigating', 'identified', 'monitoring', 'resolved'], required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const IncidentSchema = new Schema<IIncident>(
  {
    title: { type: String, required: true, trim: true },
    impact: { type: String, enum: ['none', 'minor', 'major', 'critical'], default: 'minor' },
    status: { type: String, enum: ['investigating', 'identified', 'monitoring', 'resolved'], default: 'investigating' },
    affectedComponents: [{ type: String }],
    updates: [IncidentUpdateSchema],
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

export const Incident = mongoose.model<IIncident>('Incident', IncidentSchema);
