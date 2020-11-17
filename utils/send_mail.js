const nodemailer      = require('nodemailer');

exports.sendTokenForMailer = async (token, mailer) => {
  let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth    : {
      user  : 'c117dh01@gmail.com',
      pass  : 'abcxyz2019'
    }
  });

  let mailOption = {
    from    : 'c117dh01@gmail.com',
    to      : mailer,
    subject : 'send token',
    text    : token
  }

  transporter.sendMail(mailOption, (error, info) => {
    if (error) {
      console.log(error);
      return;
    }
    console.log(`Gmail sent: ${info.response}`);
  });
}