const nodemailer      = require('nodemailer');
const { google }      = require('googleapis');
const { OAuth2 }      = google.auth;

const OAUTH_PLAYGROUND = 'https://developers.google.com/oauthplayground';

const SENDER_EMAIL_ADDRESS            = 'c117dh01@gmail.com';
const MAILING_SERVICE_CLIENT_ID       = '1019578265216-rvvk6tnhbe3lrj0t2js42fki9ttjitvr.apps.googleusercontent.com';
const MAILING_SERVICE_CLIENT_SECRET   = 'u-cJiMQySlAvkOSaXM-tb9PU';
const MAILING_SERVICE_REFRESH_TOKEN   = '1//04lGq_IULCZAuCgYIARAAGAQSNwF-L9Irz85galKBlK9AK8X9eZGCG5_URRB0Xll7cUEMZnqIOyRXldH6i2S-UJnHV_bWluDIwhY';

const oauth2Client = new OAuth2(
  MAILING_SERVICE_CLIENT_ID,
  MAILING_SERVICE_CLIENT_SECRET,
  OAUTH_PLAYGROUND
);

exports.sendTokenForMailer = (token, mailer) => {
  oauth2Client.setCredentials({
    refresh_token : MAILING_SERVICE_REFRESH_TOKEN
  });

  const accessToken = oauth2Client.getAccessToken();

  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: SENDER_EMAIL_ADDRESS,
      clientId: MAILING_SERVICE_CLIENT_ID,
      clientSecret: MAILING_SERVICE_CLIENT_SECRET,
      refreshToken: MAILING_SERVICE_REFRESH_TOKEN,
      accessToken,
    },
  });

  let mailOption = {
    from    : SENDER_EMAIL_ADDRESS,
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