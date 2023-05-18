const routes = require("express").Router();
const multer = require("multer");
const multerConfig = require("./config/multer");
const Post = require("./models/Post");
const path = require("path");
const fs = require("fs");
const { google } = require("googleapis");
const qrcode = require("qrcode");

const googleApi = process.env.GOOGLE_API_FOLDER_ID;

// Essa parte serve para deletar um arquivo do drive mas nao esta funcionando preciso da Chave ou o id do item
// no google drive, achei trabalhoso de mais e dessisti
async function DeleteFile(id) {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: "./googledrive.json",
      scopes: ["https://www.googleapis.com/auth/drive"],
    });

    const driveServices = google.drive({
      version: "v3",
      auth,
    });

    const response = await driveServices.files.delete(
      { fileId: id },
      (err, res) => {
        if (err) {
          console.error("Erro ao excluir o objeto:", err);
        } else {
          console.log("Objeto excluído com sucesso!");
        }
      }
    );

    return response.data.id;
  } catch (err) {
    console.log("Erro ao criar arquivo", err);
  }
}

async function UploadFile(key) {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: "./googledrive.json",
      scopes: ["https://www.googleapis.com/auth/drive"],
    });

    const driveServices = google.drive({
      version: "v3",
      auth,
    });

    const fileMetaData = {
      name: `${key}`,
      parents: [googleApi],
    };

    const media = {
      mimeType: "image/png",
      body: fs.createReadStream(`./tmp/uploads/${key}`),
    };

    const response = await driveServices.files.create({
      resource: fileMetaData,
      media: media,
      fields: "id",
    });

    return response.data.id;
  } catch (err) {
    console.log("Erro ao criar arquivo", err);
  }
}

routes.post("/posts", multer(multerConfig).single("file"), async (req, res) => {
  const { originalname: name, size, filename: key } = req.file;

  const chave = await UploadFile(key);

  const url = `https://drive.google.com/file/d/${chave}/view`;

  const LimparPasta = (caminhoDaPasta) => {
    fs.readdirSync(caminhoDaPasta).forEach((arquivo) => {
      const caminhoArquivo = path.join(caminhoDaPasta, arquivo);
      fs.unlinkSync(caminhoArquivo);
    });
  };

  const generateQRCode = (url) => {
    return new Promise((resolve, reject) => {
      qrcode.toDataURL(url, (err, dataUrl) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(dataUrl);
      });
    });
  };

  try {
    const qrCodeUrl = await generateQRCode(url);

    const post = await Post.create({
      name,
      size,
      key,
      url: `https://drive.google.com/file/d/${chave}/view`,
      qrcode: `${qrCodeUrl}`,
    });

    LimparPasta(path.resolve(__dirname, "..", "tmp", "uploads"));

    return res.json(post);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao criar o post" });
  }
});

routes.get("/posts", async (req, res) => {
  try {
    let posts = await Post.find();
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ error: "Problem to find the list of posts" });
  }
});

routes.delete("/posts/:id", async function (req, res) {
  const { id } = req.params;

  try {
    await Post.findByIdAndDelete(id);
    res.json({ message: "Ok" }).status(204);
  } catch (error) {
    res.status(500).json({ error: "Problem to delete a post" });
  }
});

module.exports = routes;
