const { Category } = require('../models/category');
const express = require('express');
const router = express.Router();
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
    cb(null, `${Date.now()}.${extension}`);
  },
});

const uploadOptions = multer({ storage: storage });

router.get(`/`, async (req, res) => {
  const categoryList = await Category.find();

  if (!categoryList) {
    res.status(500).json({ success: false });
  }
  res.status(200).send(categoryList);
});

router.get('/:id', async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res
      .status(500)
      .json({ message: 'The category with the given ID was not found.' });
  }
  res.status(200).send(category);
});

router.post(`/`, uploadOptions.single('image'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).send('No image in the request');

  const fileName = file.filename;
  const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

  let category = new Category({
    name: req.body.name,
    image: `${basePath}${fileName}`,
  });
  category = await category.save();

  if (!category) return res.status(400).send('the category cannot be created!');

  res.send(category);
});

// router.put(`/:id`, uploadOptions.single('image'), async (req, res) => {
//   if (!mongoose.isValidObjectId(req.params.id)) {
//     return res.status(400).send('Invalid specialization Id');
//   }

//   const specialization = await Category.findById(req.params.id);
//   if (!specialization) return res.status(400).send('Invalid specialization!');

//   const file = req.file;
//   let imagepath;

//   if (file) {
//     const fileName = file.filename;
//     const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
//     imagepath = `${basePath}${fileName}`;
//   } else {
//     imagepath = specialization.image;
//   }
//   const Updatespecialization = await Category.findByIdAndUpdate(
//     req.params.id,
//     {
//       name: req.body.name,
//       image: imagepath,
//     },
//     { new: true }
//   );

//   if (!Updatespecialization)
//     return res.status(400).send('the specialization cannot be created!');

//   res.send(Updatespecialization);
// });

// router.delete('/:id', (req, res) => {
//   Category.findByIdAndRemove(req.params.id)
//     .then((specialization) => {
//       if (specialization) {
//         return res
//           .status(200)
//           .json({ success: true, message: 'the specialization is deleted!' });
//       } else {
//         return res
//           .status(404)
//           .json({ success: false, message: 'specialization not found!' });
//       }
//     })
//     .catch((err) => {
//       return res.status(500).json({ success: false, error: err });
//     });
// });

module.exports = router;
