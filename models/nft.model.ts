import mongoose, { Schema, Document, Types } from 'mongoose';

interface INftDocument extends Document {
  id: string;
  uri: string;
  shares: number;
  currentHolder:string;
  owners: Types.ObjectId[];  // referencing User documents
}

const NftSchema = new Schema<INftDocument>({
  id: { type: String, required: true },
  uri: { type: String, required: true },
  shares: { type: Number, required: true, default: 1 },
  currentHolder:{ type: String, required: true },
  owners: [{ type: Schema.Types.ObjectId, ref: 'User' }],  // Array of User ObjectIds
});

const NftModel = mongoose.model<INftDocument>('Nft', NftSchema);

export default NftModel;
