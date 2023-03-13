const express = require('express');
const router = express.Router();
const app = express();

const httpServer = require('http').createServer(app);
const io = require('socket.io')(httpServer);
const socket = require('../app');
const { Product } = require('../models/product');
const authMiddleware = require('../helpers/authMiddleware');
const Order = require('../models/order');
const { Category } = require('../models/category');
const { User } = require('../models/user');
const mongoose = require('mongoose');
const multer = require('multer');

const FILE_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg',
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error('invalid image type');

    if (isValid) {
      uploadError = null;
    }
    cb(uploadError, 'public/uploads');
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(' ').join('-');
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});

const uploadOptions = multer({ storage: storage });

router.post(`/`, async (req, res) => {
  let filter = {};
  if (req.query.categories) {
    filter = { categories: req.query.categories.split(',') };
  }

  const product = await Product.find(filter);
  // const io = req.app.get('socketio');
  // io.emit('pong', {product});
  if (!product) {
    res.status(500).json({ success: false });
  }
  res.status(200).send(product);
});

// router.get('/:id', async (req, res) => {
//   const doctor = await Doctor.findById(req.params.id); //.populate('specialization');

//   if (!doctor) {
//     res
//       .status(500)
//       .json({ message: 'The doctor with the given ID was not found.' });
//   }
//   res.status(200).send(doctor);
// });

// router.get('/', async (req, res) => {
//   try {
//       let filter = {};
//   if (req.query.categories) {
//     filter = { categories: req.query.categories.split(',') };
//   }

//     const product = await Product.find(filter);
//     res.status(200).send({
//       success: true,
//       message: 'product info fetched successfully',
//       data: product,
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .send({ message: 'Error getting product info', success: false, error });
//   }
// });

// router.post('/getdoctor', async (req, res) => {
//   try {

//     const doctor = await Doctor.find({ userId: req.body.userId, }).populate('userId');;
//     res.status(200).send({
//       message: 'doctor fetched successfully',
//       success: true,
//       data: doctor,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send({
//       message: 'Error fetching doctor',
//       success: false,
//       error,
//     });
//   }
// });

router.post(`/add`, uploadOptions.single('image'), async (req, res) => {
  const category = await Category.findById(req.body.category);
  if (!category) return res.status(400).send('Invalid Category');

  const file = req.file;
  if (!file) return res.status(400).send('No image in the request');
  const fileName = file.filename;
  const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
  let product = new Product({
    name: req.body.name,
    brand: req.body.brand,
    description: req.body.description,
    richDescription: req.body.richDescription,
    image: `${basePath}${fileName}`, // "http://localhost:3000/public/upload/image-2323232"
    price: req.body.price,
    category: req.body.category,
    countInStock: req.body.countInStock,
    rating: req.body.rating,
    numReviews: req.body.numReviews,
    isFeatured: req.body.isFeatured,
  });

  product = await product.save();

  if (!product) return res.status(500).send('The product cannot be created');
  const io = req.app.get('socketio');
  io.emit('addProduct', { product });
  res.status(200).send(product);
});

// router.put(
//   '/update-by-id',
//   uploadOptions.single('image'),
//   async (req, res) => {
//     try {
//       console.log(req.body.prodId);
//       if (!mongoose.isValidObjectId({ id: req.body.prodId })) {
//         return res.status(400).send('Invalid Product Id');
//       }
//       const category = await Category.findById(req.body.category);
//       if (!category) return res.status(400).send('Invalid categories');
//       const product = await Product.findById(req.body.prodId);
//       if (!product) return res.status(400).send('Invalid product!');
//       const file = req.file;
//       let imagepath;

//       if (file) {
//         const fileName = file.filename;
//         const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
//         imagepath = `${basePath}${fileName}`;
//       } else {
//         imagepath = product.image;
//       }
//       const updatedProduct = await Product.findByIdAndUpdate(
//         req.body.prodId,
//         {
//           name: req.body.name,
//           brand: req.body.brand,
//           description: req.body.description,
//           richDescription: req.body.richDescription,
//           image: imagepath, // "http://localhost:3000/public/upload/image-2323232"
//           price: req.body.price,
//           category: req.body.category,
//           countInStock: req.body.countInStock,
//           rating: req.body.rating,
//           numReviews: req.body.numReviews,
//           isFeatured: req.body.isFeatured,
//         },
//         { new: true }
//       );

//       res.status(200).send({
//         message: 'Product update successfully',
//         success: true,
//         data: updatedProduct,
//       });
//     } catch (error) {
//       console.log(error);
//       res.status(500).send({
//         message: 'The product cannot be updated!',
//         success: false,
//         error,
//       });
//     }
//   }
// );

router.put('/update/:id', uploadOptions.single('image'), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).send('Invalid Product Id');
  }
  const category = await Category.findById(req.body.category);
  if (!category) return res.status(400).send('Invalid categories');

  const product = await Product.findById(req.params.id);
  if (!product) return res.status(400).send('Invalid product!');
  const file = req.file;
  let imagepath;

  if (file) {
    const fileName = file.filename;
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
    imagepath = `${basePath}${fileName}`;
  } else {
    imagepath = product.image;
  }
  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      brand: req.body.brand,
      description: req.body.description,
      richDescription: req.body.richDescription,
      image: imagepath, // "http://localhost:3000/public/upload/image-2323232"
      price: req.body.price,
      category: req.body.category,
      countInStock: req.body.countInStock,
      rating: req.body.rating,
      numReviews: req.body.numReviews,
      isFeatured: req.body.isFeatured,
    },
    { new: true }
  );

  if (!updatedProduct)
    return res.status(500).send('the product cannot be updated!');

  res.status(200).send(updatedProduct);
});

router.post(`/:id/updateproduct`, async (req, res) => {
  const productId2 = req.params.id;
  const qtyNew = req.body.qtty;
  const product = await Product.findById(productId2);
  if (product) {
    product.countInStock = product.countInStock - qtyNew;
    const updatedProduct = await product.save();
    res.status(200).send({
      message: 'produce modified',
      updatedProduct,
    });
    const io = req.app.get('socketio');
    io.emit('pong', { updatedProduct });
  } else {
    res.status(404).send({ message: 'Product Not Found' });
  }
});

router.get(`/count`, async (req, res) => {
  const productCount = await Product.countDocuments();

  if (!productCount) {
    res.status(500).json({ success: false });
  }
  res.status(200).send({
    success: true,
    productCount: productCount,
  });
});

router.post('/:id/reviews', async (req, res) => {
  const productId = req.params.id;
  const product = await Product.findById(productId);
  if (product) {
    if (product.reviews.find((x) => x.idUser === req.body.userId)) {
      return res
        .status(400)
        .send({ message: 'You have already submitted a review' });
    }

    const review = {
      name: req.body.name,
      idUser: req.body.userId,
      rating: req.body.rating,
      comment: req.body.comment,
    };
    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((a, c) => c.rating + a, 0) /
      product.reviews.length;
    const updatedProduct = await product.save();
    const io = req.app.get('socketio');
    io.emit('addProductReview', {
      productId: updatedProduct.id,
      review: review,
    });
    console.log(updatedProduct.id);
    res.status(200).send({
      message: 'Review Created',
      review,
    });
  } else {
    res.status(404).send({ message: 'Product Not Found' });
  }
});
router.post('/review-by-id', async (req, res) => {
  try {
    const product = await Product.findById({ _id: req.body.productId });
    res.status(200).send({
      message: 'product fetched successfully',
      success: true,
      data: product,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Error fetching product',
      success: false,
      error,
    });
  }
});

router.post('/:id/', (req, res) => {
  Product.findByIdAndRemove(req.params.id)
    .then((product) => {
      if (product) {
        return res.status(200).json({
          success: true,
          message: 'product is deleted!',
        });
      } else {
        return res
          .status(404)
          .json({ success: false, message: 'product not found!' });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

// router.post('/get-doctor-info-by-user-id', async (req, res) => {
//   try {
//     const doctor = await Doctor.findOne({ userId: req.body.userId });
//     res.status(200).send({
//       success: true,
//       message: 'Doctor info fetched successfully',
//       data: doctor,
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .send({ message: 'Error getting doctor info', success: false, error });
//   }
// });

// router.get('/get-appointments-by-doctor-id', async (req, res) => {
//   try {
//     // const doctor = await Doctor.findOne({ userId: req.body.userId });
//     const appointments = await Appointment.find({
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
