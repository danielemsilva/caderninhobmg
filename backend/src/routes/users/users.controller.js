const jwt = require('jsonwebtoken');
const _ = require('lodash');

const User = require('./user.model');

exports.getUser = async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    res.status(404).send('Usuário não encontrado');
  } else {
    res.status(200).json(user);
  }
};

exports.createUser = async (req, res, next) => {
  const user = new User(req.body);

  try {
    await user.save();
    return res.status(200).send(_.omit(user.toJSON(), 'password'));
  } catch (err) {
    if (err.name === 'MongoError' && err.code === 11000) {
      return res.status(400).send('Usuário já existente.');
    }
    return next(err);
  }
};

exports.authenticate = async (req, res) => {
  const user = await User.findOne({
    email: req.body.email,
  });

  if (!user) {
    return res.status(404).send('Usuário não encontrado.');
  }

  if (user.password !== req.body.password) {
    res.status(401).json('Senha incorreta.');
  }

  const payload = { id: user.id };
  const token = jwt.sign(payload, process.env.APP_SECRET, {
    expiresIn: '7d',
  });

  return res.send({
    ..._.omit(user.toJSON(), ['password']),
    token,
  });
};
