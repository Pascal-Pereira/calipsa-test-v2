const bcrypt = require('bcrypt');
const pkg = require('googleapis');
const config = require ('../local.config')
const { google } = pkg;

/** ******* */
/** MAIN  GOOGLE API* */
/** ******* */
const defaultScope = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/plus.me',
  'https://www.googleapis.com/auth/userinfo.email',
  'email',
];

function createConnection() {
  return new google.auth.OAuth2(
    config.clientId,
    config.google.clientSecret,
    config.google.redirectUri
  );
}

function getConnectionUrl(auth) {
  return auth.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: defaultScope,
  });
}

function getPeopleApi() {
  return google.people('v1');
}

function getGoogleUrl() {
  const auth = createConnection();
  google.options({ auth });
  const url = getConnectionUrl(auth);
  return url;
}

async function getGoogleAccountFromToken(token) {
  const auth = createConnection();
  try {
    auth.setCredentials({
      access_token: token,
    });
  } catch(err) {
    console.error('[ERROR][setCredentials]', err.message);
    throw err;
  }
  google.options({ auth });
  const peopleApi = getPeopleApi(auth);
  let me;
  try {
    me = await peopleApi.people.get({
      resourceName: 'people/me',
      personFields: 'emailAddresses,names,photos',
    })
  } catch(err) {
    console.error('[ERROR][peopleApi]', err.message);
    throw err;
  }

  if (!me || !me.data) {
    throw new Error('error_wrong_google_token');
  }

  const nameData = me.data && me.data.names && me.data.names[0];
  const email = me.data.emailAddresses && me.data.emailAddresses[0] && me.data.emailAddresses[0].value;

  return {
    googleId:
      nameData && nameData.metadata && nameData.metadata.source && nameData.metadata.source.id,
    email,
    firstName: nameData && nameData.givenName,
    lastName: nameData && nameData.familyName,
  };
}

module.exports = {
  getGoogleUrl,
  getGoogleAccountFromToken,
};
