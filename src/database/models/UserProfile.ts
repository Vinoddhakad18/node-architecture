import mongoose, { Document, Schema } from 'mongoose';

// Interface for UserProfile document
export interface IUserProfile extends Document {
  userId: string;
  bio: string;
  avatar: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
    language: string;
  };
  metadata: Map<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// UserProfile schema
const UserProfileSchema = new Schema<IUserProfile>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    bio: {
      type: String,
      maxlength: 500,
      default: ''
    },
    avatar: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: '' },
      zipCode: { type: String, default: '' }
    },
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark'],
        default: 'light'
      },
      notifications: {
        type: Boolean,
        default: true
      },
      language: {
        type: String,
        default: 'en'
      }
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: new Map()
    }
  },
  {
    timestamps: true,
    collection: 'user_profiles'
  }
);

// Indexes
UserProfileSchema.index({ userId: 1 });

// Model
const UserProfile = mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);

export default UserProfile;
