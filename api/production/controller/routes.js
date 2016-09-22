
//var stripe=require('stripe')('sk_test_d5DLmYD5BDyExfoL85g2DSCQ');
var express = require('express');
var router = express.Router();
var stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

var products = [
  {
    productName: 'Soylent',
    productDescription: 'Meal replacement that tastes like pancake batter.',
    productPrice: 10.99
  }
];

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/products/:name', function(req, res, next) {
  var productName = req.params.name;
  for (var i = 0; i < products.length; i++) {
    if(productName === products[i].productName) {
      return res.render('product', {productInfo: products[i]});
    } else {
      return res.send('Product does not exist.');
    }
  }
});

router.post('/charge', function(req, res,next) {
  var stripeToken = req.body.stripeToken;
  var amount = req.body.price * 100;

  // ensure amount === actual product amount to avoid fraud

  stripe.charges.create({
    card: stripeToken,
    currency: 'usd',
    amount: amount
  },
  function(err, charge) {
    if (err) {
      console.log(err);
      res.send('error');
    } else {
      res.send('success');
    }
  });
});

module.exports = router;
