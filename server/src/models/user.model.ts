import mongoose from 'mongoose'

const UserCollectionSchema : mongoose.Schema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "'email' is required"],
        unique: [true, "'email' is already registered"]
    },
    hash: {
        type: String,
        required: true
    },
    salt: {
        type: String,
        required: true
    }
}, { timestamps: true })

/**
 * hide some credentials to query by accident
 */
UserCollectionSchema.methods.toJSON = function() {
    var obj = this.toObject();
    delete obj["hash"];
    delete obj["salt"];
    delete obj["__v"];
    return obj;
}

UserCollectionSchema.path("email").validate(async (email) => {
    const count = await mongoose.models.user.countDocuments({ email });
    return !count;
}, "'email' already registered.");

export const User: mongoose.Model<any> = mongoose.model("user", UserCollectionSchema);