const _ = require('lodash');
// const core = require('axel-core');

// const { ExtendedError, AuthService } = core;


const GoogleAuthService = require('../services/GoogleAuthService');

// const {flatten} = require('flat');
// const {unfflatten} = require('flat');

module.exports = {

  gmailAuth(req, res) {
    console.log('gmailAuth gmailAuth');
    res.json({
      body: GoogleAuthService.getGmailUrl('', req.query.redirectUrl)
    });
  },

  googleCallback(req, res, next) {
    const googleToken = req.query.code;
    console.log('resssssssssssss', req.query);
    // t is the invitation token
    // features are the enabled features
    let avatarUrl;
    let email;
    let token;
    let newUserModel;
    let user;
    let newUserCreated = false;
    GoogleAuthService.getGoogleAccountFromToken(googleToken)
      .then((account) => {
        if (!account) {
          throw new Error('error_wrong_google_token');
        }

        const {
          lastName, firstName, googleId,
        } = account;
        email = account.email;
        avatarUrl = account.avatarUrl;
        newUserModel = {
          email: email.toLowerCase(),
          googleId,
          firstName,
          lastName,
          username: `${firstName} ${lastName}`,
          avatarUrl,
          roles: ['USER'],
          active: true,
        };
        return axel.models.user.em.findOne({
          where: {
            email,
          },
          attributes: ['id']
        });
      })
      .then((u) => {
        if (!u) {
          newUserCreated = true;
          return axel.models.user.em.create(newUserModel);
        }
        return true;
      })
      .then(() => axel.models.user.em.findOne({
        where: {
          email,
        },
        include: [
          { association: 'Organisations' },
        ],
        raw: false,
        nest: true
      }))
      .then(async (dbUser) => {
        if (!dbUser) {
          throw new ExtendedError({ code: 500, message: 'user_not_created' });
        }
        user = dbUser.get();
        if (user.roles && typeof user.roles === 'string') {
          try {
            user.roles = JSON.parse(user.roles);
          } catch (e) {
            axel.logger.warn(e);
          }
        }

        if (t) {
          try {
            await UserService.acceptInvite(t, user);
          } catch (err) {
            console.warn('[googleCallback]', err.message);
            next(err);
          }
        }

        // If user created successfuly we return user and token as response
        token = AuthService.generateFor(_.pick(user, ['firstName', 'lastName', 'roles', 'organisationId', 'id']));

        user.lastConnexionOn = new Date();

        return axel.models.user.em.update({ lastConnexionOn: new Date(), avatarUrl }, {
          where: {
            [primaryKey]: user[primaryKey],
          },
        });
      })
      // eslint-disable-next-line no-undef
      .then(() => {
        res.status(200).json({
          user: UserService.sanitize(user),
          token,
          appRoles: axel.config.framework.roles
        });
      })
      .catch((err) => {
        console.error('googleCallback, err', err.message)
      });
  },
}