const express = require('express');
const router = express.Router();
const { User } = require('../models/user');
const { Coupon } = require('../models/coupon');
const jwt = require('jsonwebtoken');

router.post('/apply-user-notification', async (req, res) => {
  try {
    const couponExist = await Coupon.findOne();
    const usercopunNumber = Math.random() * 10;
    const user = await User.findOne({
      _id: req.body.userId,
    });

    const unseenNotifications = user.unseenNotifications;
    unseenNotifications.push({
      title: couponExist.message,
      data: {
        message: `${couponExist.discount}`,
        discount: `${couponExist.isActive}`,
        useCoupon: `${usercopunNumber}`,
      },
      // onClickPath: '/doctor/patient',
    });

    const sendNotification = await User.findByIdAndUpdate(user._id, {
      unseenNotifications,
    });
    res.status(200).send({
      success: true,
      message: 'Message send successfully',
      data: sendNotification,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Error sending message',
      success: false,
      error,
    });
  }
});

router.post('/updateCoupon', async (req, res) => {
  const coupon = await Coupon.findById({ _id: req.body.couponId });
  if (!coupon) return res.status(400).send('Invalid Coupon!');
  const updatedcoupon = await Coupon.findByIdAndUpdate(
    req.body.couponId,
    {
      title: req.body.title,
      totalCoupon: req.body.totalCoupon,
      discount: req.body.discount,
      message: req.body.message,
      isActive: req.body.isActive,
    },
    { new: true }
  );
  if (!updatedcoupon)
    return res.status(400).send('The Coupon cannot be updated!');
  res.status(200).send({
    message: 'Coupon update successfully',
    success: true,
    updatedcoupon,
  });
});

router.post('/getcoupon', async (req, res) => {
  try {
    const coupon = await Coupon.findOne();
    res.status(200).send({
      success: true,
      message: 'Coupon info fetched successfully',
      data: coupon,
    });
  } catch (error) {
    res
      .status(500)
      .send({ message: 'Error getting coupon info', success: false, error });
  }
});

module.exports = router;
