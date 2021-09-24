const fs = require('fs');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal'); 
const express = require('express');
const cors = require('cors');

const SESSION_FILE_PATH = './session.json';
let sessionCfg;

// Já autenticado, abre o whatsapp web
const withSession = () => {
    sessionCfg = require(SESSION_FILE_PATH);
    client = new Client({ puppeteer: { headless: false }, session: sessionCfg });
    client.on('ready', () => console.log('Cliente está pronto!'));
    client.on('auth_failure', () => {
        console.log('** O erro de autenticação regenera o QRCODE (Excluir o arquivo session.json) **');
        fs.unlinkSync('./session.json');
    })
    client.initialize();
}

// Gera o QR Code para autenticar e abrir o whatsapp web
const withOutSession = () => {
    client = new Client({ puppeteer: { headless: false }, session: sessionCfg });
    client.on('qr', qr => { qrcode.generate(qr, { small: true }); });
    client.on('ready', () => console.log('Cliente está pronto!'));
    client.on('auth_failure', () => {
        console.log('** O erro de autenticação regenera o QRCODE (Excluir o arquivo session.json) **');
        fs.unlinkSync('./session.json');
    })
    client.on('authenticated', (session) => {
        sessionCfg = session;
        fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), (err) => {
            if (err) console.log(err);
        });
    });
    client.initialize();
}

// O fs.existsSync verifica de forma síncrona se arquivo já existe no caminho retornando um bool
(fs.existsSync(SESSION_FILE_PATH)) ? withSession() : withOutSession();

// Enviar mensagem
const sendMessagem = ( number, message) => {
    client.sendMessage(number, message);
}

// API
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true }));

// Controllers
const sendText = (req, res) => {
    // const { message, number } = req.body
    let number = "numero@c.us";
    let message = "Olá, você está há mais de 5 horas online! Não se esqueça de deslogar do ponto ao terminar de trabalhar";
    sendMessagem(number, message)
    res.send({ status: 'Enviado mensagem!' })
}

// Rotas
app.post('/send', sendText);

// Ativar o Servidor
app.listen(9000, () => console.log('Server ready!'));
