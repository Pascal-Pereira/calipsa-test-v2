const _ = require('lodash');
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
  'openid',
];

function createConnection(redirectUrl) {
  return new google.auth.OAuth2(
    config.clientId,
    config.google.clientSecret,
    redirectUrl,
  );
}

function getConnectionUrl(auth, scope = null) {
  return auth.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scope || defaultScope,
  });
}

function getPeopleApi() {
  return google.people('v1');
}

function getGoogleUrl(scope) {
  const auth = createConnection();
  google.options({ auth });
  const url = getConnectionUrl(auth, scope);
  return url;
}

function getGmailUrl(scope = '', redirectUrl = '') {
  const auth = createConnection(redirectUrl);
  google.options({ auth });
  const url = getConnectionUrl(auth, scope || 'profile email openid https://www.googleapis.com/auth/gmail.modify');
  return url;
}

async function getGoogleAccountFromCode(code, redirectUrl) {
  const auth = createConnection(redirectUrl);
  const data = await auth.getToken(code);

  const tokens = data.tokens;
  auth.setCredentials(tokens);
  const peopleApi = google.people({ version: 'v1', auth });
  const me = await peopleApi.people.get({
    resourceName: 'people/me',
    personFields: 'emailAddresses',
  });
  const userGoogleEmail = _.get(me, 'data.emailAddresses[0].value');
  return {
    email: userGoogleEmail,
    googleTokens: tokens,
    me: me.data,
  };
}

async function getGoogleAccountFromToken(token) {
  const auth = createConnection();
  auth.setCredentials(token && token.credential ? token.credential : token);
  google.options({ auth });
  const peopleApi = getPeopleApi(auth);

  const me = await peopleApi.people.get({
    resourceName: 'people/me',
    personFields: 'emailAddresses,names,photos',
  });

  if (!me || !me.data) {
    throw new Error('error_wrong_google_token');
  }

  const nameData = me.data.names && me.data.names && me.data.names[0];
  const email = me.data.emailAddresses && me.data.emailAddresses[0] && me.data.emailAddresses[0].value;
  return {
    googleId:
      nameData && nameData.metadata && nameData.metadata.source && nameData.metadata.source.id,
    email,
    username: email,
    firstName: nameData && nameData.givenName,
    lastName: nameData && nameData.familyName,
    avatarUrl: _.get(me, 'data.photos[0].url')
  };
}

module.exports = {
  getGoogleUrl,
  getGmailUrl,
  getGoogleAccountFromToken,
  getGoogleAccountFromCode,
};
