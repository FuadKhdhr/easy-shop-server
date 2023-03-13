const { Banner } = require('../models/banner');
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
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});

const uploadOptions = multer({ storage: storage });

router.get(`/`, async (req, res) => {
  const bannerList = await Banner.find();

  if (!bannerList) {
    res.status(500).json({ success: false });
  }
  res.send(bannerList);
});

router.post(`/`, uploadOptions.single('image'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).send('No image in the request');

  const fileName = file.filename;
  const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
  let banner = new Banner({
    name: req.body.name,
    image: `${basePath}${fileName}`, // "http://localhost:3000/public/upload/image-2323232"
  });

  banner = await banner.save();

  if (!banner) return res.status(500).send('The banner cannot be created');

  res.send(banner);
});

router.put('/:id', uploadOptions.single('image'), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).send('Invalid Banner Id');
  }

  const banner = await Banner.findById(req.params.id);
  if (!banner) return res.status(400).send('Invalid banner!');

  const file = req.file;
  let imagepath;

  if (file) {
    const fileName = file.filename;
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
    imagepath = `${basePath}${fileName}`;
  } else {
    imagepath = banner.image;
  }

  const updatedBanner = await Banner.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      image: imagepath,
    },
    { new: true }
  );

  if (!updatedBanner)
    return res.status(500).send('the banner cannot be updated!');

  res.status(200).send(updatedBanner);
});

router.delete('/:id', (req, res) => {
  Banner.findByIdAndRemove(req.params.id)
    .then((banner) => {
      if (banner) {
        return res.status(200).json({
          success: true,
          message: 'the banner is deleted!',
        });
      } else {
        return res
          .status(404)
          .json({ success: false, message: 'banner not found!' });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

module.exports = router;
