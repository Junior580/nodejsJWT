require("dotenv").config();
const express = require("express");
const mongosee = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const User = require("../models/user");

app.get("/", (req, res) => {
  res.status(200).json({ msg: "Bem vindo a nossa API" });
});

app.get("/users/:id", async (req, res) => {
  const id = req.params.id;
  const user = await User.findById(id, "-password");
  if (!user) {
    return res.status(404).json({ msg: "Usuario nào encontrado." });
  }
});

app.post("/auth/register", async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name) {
    return res.status(422).json({ msg: "O nome é obrigatório" });
  }
  if (!email) {
    return res.status(422).json({ msg: "O e-mail é obrigatório" });
  }
  if (!password) {
    return res.status(422).json({ msg: "A senha é obrigatório" });
  }
  if (password !== confirmPassword) {
    return res.status(422).json({ msg: "As senhas não conferem" });
  }
  const userExists = await User.findOne({ email: email });

  if (userExists) {
    return res.status(422).json({ msg: "Por favor utilize outro email" });
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = new User({ name, email, password: passwordHash });

  try {
    await user.save();
    res.status(201).json({ msg: "Usuario criado com sucesso." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      msg: "Aconteceu um erro no servidor, tente novamente mais tarde!",
    });
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(422).json({ msg: "O e-mail é obrigatório" });
  }
  if (!password) {
    return res.status(422).json({ msg: "A senha é obrigatório" });
  }

  const user = await User.findOne({ email: email });
  if (!user) {
    return res.status(200).json({ msg: "Usuario nao encontrado" });
  }

  const checkPassword = await bcrypt.compare(password, user.password);
  if (!checkPassword) {
    return res.status(422).json({ msg: "Senha invalida" });
  }
  try {
    const secret = process.env.SECRET;
    const token = jwt.sign(
      {
        id: user._id,
      },
      secret
    );

    res.status(200).json({ msg: "Autenticação realizada com sucesso.", token });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      msg: "Aconteceu um erro no servidor, tente novamente mais tarde!",
    });
  }
});

const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;

const port = 3000;
mongosee
  .connect(
    `mongodb+srv://${dbUser}:${dbPass}@cluster0.axlur.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen(port);
    console.log("🚀 Server is runing");
  })
  .catch((err) => {
    console.log(err);
  });
