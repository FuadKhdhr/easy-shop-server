const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  image: {
    type: String,
  },
});

// Changing or create a new id instead _id
categorySchema.virtual('id').get(function () {
  return this._id.toHexString();
});
categorySchema.set('toJSON', {
  virtuals: true,
});

exports.Category = mongoose.model('Category', categorySchema);
