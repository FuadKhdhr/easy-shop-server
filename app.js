const express = require('express');
const app = express();
const morgan = require('morgan');
const mongoose = require('mongoose');
const httpServer = require('http').createServer(app);
const io = require('socket.io')(httpServer);

const cors = require('cors');
require('dotenv/config');
const authJwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler');
app.use(cors());
app.options('*', cors());

//middleware
app.use(express.json());
app.use(morgan('tiny'));
app.use(authJwt());
app.use('/public/uploads', express.static(__dirname + '/public/uploads'));
module.exports.getIO = function () {
  return io;
};
app.use(errorHandler);

///Routes
const categoriesRoutes = require('./routes/categories');
const productsRoutes = require('./routes/products');
const usersRoutes = require('./routes/users');
// const adminRoutes = require('./routes/admin');
// const bannersRoutes = require('./routes/banners');
const ordersRoutes = require('./routes/orders');
const couponRoutes = require('./routes/coupons');

const api = process.env.API_URL;
app.set('socketio', io);
app.use(`${api}/categories`, categoriesRoutes);
app.use(`${api}/products`, productsRoutes);
app.use(`${api}/users`, usersRoutes);
// app.use(`${api}/admin`, adminRoutes);
// app.use(`${api}/banners`, bannersRoutes);
app.use(`${api}/orders`, ordersRoutes);
app.use(`${api}/coupons`, couponRoutes);

if (process.env.NODE_ENV === 'production') {
  app.use('/', express.static('client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client/build/index.html'));
  });
}

//Database
mongoose
  .connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'happy-event',
  })
  .then(() => {
    console.log('Database Connection is ready...');
  })
  .catch((err) => {
    console.log(err);
  });
io.on('connection', (socket) => {
  console.log(`⚡: ${socket.id} user just connected!`);
  io.emit('reconnection', { status: 'reconnected' });
  socket.on('ping', (data) => {
    console.log('🔥: ping', data);
    // socket.emit('pong', {data, by:'mehdi'});
  });
 
  socket.on('disconnect', () => {
    socket.disconnect();
    console.log('🔥: A user disconnected');
  });
});
const port = process.env.PORT || 5000;
//soket.io
//   const httpServer = "http".Server(app);
// const io = new Server(httpServer, { cors: { origin: '*' } });

httpServer.listen(port || 5000, () => {
  // var port = Server.address().port;
  console.log(`Server at http://localhost:${port}`);
});

//Server
// app.listen(3000, () => {
//   console.log('server is running http://localhost:3000');
// });
//Production
// var server = app.listen(process.env.PORT || 5000, function () {
//   var port = server.address().port;
//   console.log('Express is working on port ' + port);
// });
