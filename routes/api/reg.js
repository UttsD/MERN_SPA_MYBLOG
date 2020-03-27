const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const { check, validationResult } = require('express-validator');
const User = require('../../modules/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

// POST api/post - Register User
router.post(
  '/',
  [
    check('name', 'Name is required')
      .not()
      .isEmpty(),
    check('email', 'Email is not valid').isEmail(),
    check('password', 'Min length is 6 characters').isLength({
      min: 6
    })
  ],
  async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      return res.status(400).json({ error: error.array() });
    }

    const { name, email, password } = req.body;

    try {
      // check if User already exist
      let user = await User.findOne({ email });
      if (user) {
        res.status(400).json({ error: [{ msg: 'User already exist' }] });
      }
      // Gravatar
      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm'
      });
      // Create a new user
      user = new User({
        name,
        email,
        password,
        avatar
      });

      //Enqrypt the password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hashSync(password, salt);
      //save user in DB
      await user.save();
      //Return a webtoken (JWT)
      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Sometging wrong with a Server');
    }
  }
);
module.exports = router;
