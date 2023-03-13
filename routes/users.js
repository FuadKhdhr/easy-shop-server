const express = require('express');
const router = express.Router();
const { User } = require('../models/user');
const { Coupon } = require('../models/coupon');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const randomstring = require('randomstring');

const Appointment = require('../models/order');
const moment = require('moment');

router.get(`/`, async (req, res) => {
  const userList = await User.find();

  if (!userList) {
    res.status(500).json({ success: false });
  }
  res.send(userList);
});
router.post('/user-by-id', async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.userId });
    res.status(200).send({
      message: 'user fetched successfully',
      success: true,
      data: user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Error fetching user',
      success: false,
      error,
    });
  }
});

// router.get('/:id', async (req, res) => {
//   const user = await User.findById(req.params.id);

//   if (!user) {
//     res
//       .status(500)
//       .json({ message: 'The user with the given ID was not found.' });
//   }
//   res.status(200).send(user);
// });

// router.post('/:id', async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id);
//     res.status(200).send({
//       success: true,
//       message: 'User info fetched successfully',
//       data: user,
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .send({ message: 'Error getting user info', success: false, error });
//   }
// });

router.post('/register', async (req, res) => {
  const userExists = await User.findOne({ phone: req.body.phone });
  if (userExists) {
    return res
      .status(201)
      .send({ message: 'User already exists', success: false });
  }
  let user = new User({
    name: req.body.name,
    phone: req.body.phone,
    password: bcrypt.hashSync(req.body.password, 10),
    address: req.body.address,
  });
  user = await user.save();

  if (!user) return res.status(400).send('the user cannot be created!');

  res.status(200).send(user);
});

router.post('/login', async (req, res) => {
  // const user = await User.findOne({ email: req.body.email });
  const user = await User.findOne({ phone: req.body.phone });
  const secret = process.env.secret;
  if (!user) {
    return res.status(400).send('The user not found');
  }

  if (user && bcrypt.compareSync(req.body.password, user.password)) {
    const token = jwt.sign(
      {
        userId: user._id,
        isAdmin: user.isAdmin,
      },
      secret,
      { expiresIn: '1w' }
    );

    res.status(200).send({ user: user.phone, token: token });
  } else {
    res.status(400).send('password is wrong!');
  }
});

// router.post(`/booking`, async (req, res) => {
//   const bookingDate = await Appointment.find().populate('doctorId');

//   if (!bookingDate) {
//     res
//       .status(500)
//       .json({ message: 'The doctor with the given ID was not found.' });
//   } else {
//     res.status(200).send(bookingDate);
//   }
// });

router.put('/:id', async (req, res) => {
  const userExist = await User.findById(req.params.id);
  let newPassword;
  if (req.body.password) {
    newPassword = bcrypt.hashSync(req.body.password, 10);
  } else {
    newPassword = userExist.passwordHash;
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      phone: req.body.phone,
      password: newPassword,
      address: req.body.address,
    },
    { new: true }
  );
  if (!user) return res.status(400).send('The user cannot be updated!');
  res.status(200).send(user);
});

router.post('/apply-user-notification', async (req, res) => {
  try {
    const notificationExists = await User.findOne({
      _id: req.body.userId,
    });
    if (notificationExists.unseenNotifications.length > 0) {
      return res
        .status(201)
        .send({ message: 'Notification already exists', success: false });
    }
    const couponExist = await Coupon.findOne();
    const usercopunNumber = randomstring.generate(10);
    const user = await User.findOne({
      _id: req.body.userId,
    });

    const unseenNotifications = user.unseenNotifications;
    unseenNotifications.push({
      coupon: 'true',
      title: couponExist.title,
      message: `${couponExist.message}`,
      discount: `${couponExist.discount}`,
      useCoupon: `${usercopunNumber}`,
      totalCoupon: `${couponExist.totalCoupon}`,

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

router.post('/apply-admin-notification', async (req, res) => {
  try {
    const notification = await User.findOne({
      isAdmin: true,
    });
      const unseenNotifications = notification.unseenNotifications;
    unseenNotifications.push({
            title: "You got a new order",
    });

    const sendNotification = await User.findOneAndUpdate(isAdmin, {
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


router.post('/seen-notification', async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body.userId });
    const unseenNotifications = user.unseenNotifications;
    const seenNotification = [...user.seenNotifications];
    // seenNotification = user.seenNotifications;
    seenNotification.push(...unseenNotifications);
    user.unseenNotifications = [];
    user.seenNotifications = seenNotification;
    const updatedUser = await user.save();
    updatedUser.password = undefined;
    res.status(200).send({
      success: true,
      message: 'Notification marked as seen',
      data: updatedUser,
    });
    // }else {
    //   res.status(500).send({
    //     message: 'Error seen notification',
    //     success: false,
    //   });
    // }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Error seen notification',
      success: false,
      error,
    });
  }
});

router.get(`/userCount`, async (req, res) => {
  const userCount = await User.countDocuments();

  if (!userCount) {
    res.status(500).json({ success: false });
  }
  res.status(200).send({
    userCount: userCount,
  });
});

// router.put('/account/:id', async (req, res) => {
//   const user = await User.findByIdAndUpdate(
//     req.params.id,
//     {
//       isAdmin: req.body.isAdmin,
//       isDoctor: req.body.isDoctor,
//     },
//     { new: true }
//   );

//   if (!user) return res.status(400).send('the user cannot be created!');

//   res.status(200).send(user);
// });

router.post('/:id', (req, res) => {
  User.findByIdAndRemove(req.params.id)
    .then((user) => {
      if (user) {
        return res
          .status(200)
          .json({ success: true, message: 'the user is deleted!' });
      } else {
        return res
          .status(404)
          .json({ success: false, message: 'user not found!' });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

module.exports = router;
