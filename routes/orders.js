const express = require('express');
const router = express.Router();
const app = express();

const httpServer = require('http').createServer(app);
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const authMiddleware = require('../helpers/authMiddleware');
const { Order } = require('../models/order');
const { OrderItem } = require('../models/order-item');
const moment = require('moment');

// router.get(`/`, async (req, res) => {
//   const orderList = await Order.find()
//     .populate('user', 'name')
//     .sort({ dateOrdered: -1 });

//   if (!orderList) {
//     res.status(500).json({ success: false });
//   }
//   res.status(200).send(orderList);
// });

router.post('/get-order', async (req, res) => {
  try {
    const orderList = await Order.find()
      .populate('user', 'name')
      .sort({ dateOrdered: -1 });
    res.status(200).send({
      message: 'Orders fetched successfully',
      success: true,
      data: orderList,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Error fetching Orders',
      success: false,
      error,
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const orderDetail = await (
      await Order.findById(req.params.id)
    ).populate({
      path: 'orderItems',
      populate: {
        path: 'product',
        populate: 'category',
      },
    });
    res.status(200).send({
      message: 'Order fetched successfully',
      success: true,
      data: orderDetail,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Error fetching order',
      success: false,
      error,
    });
  }
});

router.post('/', async (req, res) => {
  try{
  const orderItemsIds = Promise.all(
    req.body.order.orderItems.map(async (orderItem) => {
      let newOrderItem = new OrderItem({
        quantity: orderItem.quantity,
        product: orderItem.product,
      });

      newOrderItem = await newOrderItem.save();

      return newOrderItem._id;
    })
  );
  const orderItemsIdsResolved = await orderItemsIds;

  const totalPrices = await Promise.all(
    orderItemsIdsResolved.map(async (orderItemId) => {
      const orderItem = await OrderItem.findById(orderItemId).populate(
        'product',
        'price'
      );
      const totalPrice = orderItem.product.price * orderItem.quantity;
      return totalPrice;
    })
  );
  const discount = req.body.discount;

  const totalPrice = totalPrices.reduce((a, b) => a + b, 0);

  let order = new Order({
    orderItems: orderItemsIdsResolved,
    DeleveryAddress: req.body.order.DeleveryAddress,
    city: req.body.order.city,
    country: req.body.order.country,
    zip: req.body.order.zip,
    phone: req.body.order.phone,
    status: req.body.order.status,
    totalPrice: totalPrice - discount,
    user: req.body.order.user,
  });
  order = await order.save();

  // if (!order) return res.status(400).send('The order cannot be created!');
  res.status(200).send({
    message: 'order status fetched successfully',
    success: true,
    order,
  });
  // res.status(200).send(order);
  const io = req.app.get('socketio');
  io.emit('confirmOrder',  order );
} catch (error) {
  console.log(error);
  res.status(500).send({
    message: 'The order cannot be created!',
    success: false,
    error,
  });
}
});

router.post(`/orderCount`, async (req, res) => {
  const orderCount = await Order.countDocuments();

  if (!orderCount) {
    res.status(500).json({ success: false });
  }
  res.status(200).send({
    orderCount: orderCount,
  });
});

router.post('/totalsales', async (req, res) => {
  const totalSales = await Order.aggregate([
    { $group: { _id: null, totalsales: { $sum: '$totalPrice' } } },
  ]);

  if (!totalSales) {
    return res.status(500).send({ success: false });
  }

  res
    .status(200)
    .send({ success: true, totalsales: totalSales.pop().totalsales });
});

router.post('/:id/change-status-order', async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status,
      },
      { new: true }
    );
    res.status(200).send({
      message: 'order status fetched successfully',
      success: true,
      order,
    });
    const io = req.app.get('socketio');
    io.emit('changeStatus', { order, orderId, status: order.status });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Error fetching order status',
      success: false,
      error,
    });
  }
});

router.post('/:id/', async (req, res) => {
  Order.findByIdAndRemove(req.params.id)
    .then((order) => {
      if (order) {
        return res.status(200).json({
          success: true,
          message: 'Order is deleted!',
        });
      } else {
        return res
          .status(404)
          .json({ success: false, message: 'Order not found!' });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

// router.post('/', async (req, res) => {
//   try {
//     //  const doctor = await Doctor.findOne({ userId: req.body.userId });
//     const appointments = await Appointment.find({
//       doctorId: req.body.doctorId,
//       date: req.body.dateSlot,
//     }).populate('doctorId');
//     res.status(200).send({
//       message: 'Appointments fetched successfully',
//       success: true,
//       data: appointments,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({
//       message: 'Error fetching appointments',
//       success: false,
//       error,
//     });
//   }
// });

// router.get(`/get-cancelledAppointments-by-doctor-id`, async (req, res) => {
//   const appointments = await CancelAppointment.find();

//   if (!appointments) {
//     res.status(500).json({ success: false });
//   }
//   res.status(200).send(appointments);
// });

// router.get(`/get-pastAppointments`, async (req, res) => {
//   const appointments = await Appointment.find().populate({
//     path: 'doctorId',
//     populate: 'name',
//   });

//   if (!appointments) {
//     res.status(500).json({ success: false });
//   }
//   res.status(200).send(appointments);
// });

// router.get('/get-appointments-by-doctor-id', async (req, res) => {
//   try {
//     const doctor = await Doctor.findOne({ userId: req.body.userId });
//     const appointments = await Appointment.find({ doctorId: doctor._id });
//     res.status(200).send({
//       message: 'Appointments fetched successfully',
//       success: true,
//       data: appointments,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({
//       message: 'Error fetching appointments',
//       success: false,
//       error,
//     });
//   }
// });

// router.delete('/delete', (req, res) => {
//   Order.find()
//     .then((order) => {
//       if (order) {
//         return res
//           .status(200)
//           .json({ success: true, message: 'orders is deleted!' });
//       } else {
//         return res
//           .status(404)
//           .json({ success: false, message: 'order not found!' });
//       }
//     })
//     .catch((err) => {
//       return res.status(500).json({ success: false, error: err });
//     });
// });

// router.delete('/:id', (req, res) => {
//   Appointment.findByIdAndRemove(req.params.id)
//     .then((appointments) => {
//       if (appointments) {
//         return res
//           .status(200)
//           .json({ success: true, message: 'Appointments is cancelled!' });
//       } else {
//         return res
//           .status(404)
//           .json({ success: false, message: 'Appointments not found!' });
//       }
//     })
//     .catch((err) => {
//       return res.status(500).json({ success: false, error: err });
//     });
// });

// router.post('/appoint', async (req, res) => {
//   let appointmentData = new Appointment({
//     userId: req.body.userId,
//     doctorId: req.body.doctorId,
//     patientInfo: req.body.patientInfo,
//     time: req.body.slot,
//     date: req.body.selectDate,
//   });

//   appointmentData = await appointmentData.save();
//   if (!appointmentData)
//     return res.status(404).send('the appointment can not be created');

//   res.status(200).send(appointmentData);
// });

// router.post(`/canceledAppointment`, async (req, res) => {
//   let appointmentData = new CancelAppointment({
//     userId: req.body.userId,
//     doctorId: req.body.doctorId,
//     patientInfo: req.body.patientInfo,
//     time: req.body.slot,
//     date: req.body.selectDate,
//     status: req.body.status,
//   });

//   appointmentData = await appointmentData.save();
//   if (!appointmentData)
//     return res.status(404).send('the appointment can not be created');

//   res.status(200).send(appointmentData);
// });

router.delete(`/`, async (req, res) => {
  const appointments = await Order.findByIdAndRemove({ user: req.body.user });
  if (!appointments)
    return res.status(400).send('the order cannot be updated!');

  res.status(200).send(appointments);
});

// // router.get(`/count`, async (req, res) => {
// //   const appointments = await Appointment.countDocuments({
// //     doctorId: req.body.doctorId,
// //   });

// //   if (!appointments) {
// //     res.status(500).json({ success: false });
// //   }
// //   res.status(200).send({
// //     data: appointments,
// //   });
// // });

// router.post('/count', async (req, res) => {
//   try {
//     const appointments = await Appointment.countDocuments({
//       doctorId: req.body.doctorId,
//     });
//     res.status(200).send({
//       message: 'Appointments fetched successfully',
//       success: true,
//       data: appointments,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({
//       message: 'Error fetching appointments',
//       success: false,
//       error,
//     });
//   }
// });

module.exports = router;
