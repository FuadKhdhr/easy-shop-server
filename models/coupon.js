const mongoose = require('mongoose');

const couponSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      default: '',
    },
    totalCoupon: {
      type: Number,
      required: true,
      default: 0,
    },
    discount: {
      type: Number,
      required: true,
      default: 0,
    },

    message: {
      type: String,
      default: '',
    },

    isActive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

exports.Coupon = mongoose.model('Coupon', couponSchema);
//exports.couponSchema = couponSchema;
