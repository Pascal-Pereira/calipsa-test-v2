/* eslint-disable no-undef, max-lines, no-case-declarations */
/* eslint no-shadow: ["error", { "allow": ["error", "response"] }] */

// const axel = require('axel-core/src');
const { google } = require('googleapis');
const { Op } = require('sequelize');
const striptags = require('striptags');
const base64 = require('js-base64').Base64;
const sanitizeHtml = require('sanitize-html');
const MailParser = require('mailparser-mit').MailParser;
const _ = require('lodash');
const mkdirp = require('mkdirp');
const fs = require('fs');

const debug = require('debug')('app:gmailservice');

const { escape, errorCallback } = require('../services/common/Utils');;

const gmailService = google.gmail('v1');

module.exports = {

  getEmailsCron() {
    return axel.models.mailbox.em.findAll({
      where: { type: 'gmail', credentials: { [Op.ne]: null } },
      include: ['Organisation', {
        association: 'Rules',
        include: [
          'Conditions', 'Actions'
        ],
        raw: false,
        nested: true,
      }],
      raw: false,
      nested: true,
    }).then(async (emailsConfig) => {
      if (!emailsConfig || !emailsConfig.length) {
        debug('[GmailService] NO emails found in the cron service');
        return;
      }
      for (let j = 0; j < emailsConfig.length; j++) {
        const emailConfig = emailsConfig[j];
        const {
          email, credentials, Organisation
        } = emailConfig;
        if (!credentials) {
          return;
        }
        axel.logger.log('[CRON] Executing GmailService.getEmailsCron()', email.email);
        const auth = this.authenticate(credentials);
        // eslint-disable-next-line no-await-in-loop
        const label = await this.getServiceLabelId(auth, email);
        let fetchedEmails;
        // eslint-disable-next-line no-await-in-loop
        await this.getEmails(auth, email, {
          getDetails: true,
          // q: 'label:inbox', // use this when testing
          q: `NOT label:${this.gmailLabelName} AND label:inbox`,
          maxResults: 10
        })
          .then((result) => {
            const { messages } = result;
            if (!messages) {
              return [];
            }
            debug('[getEmailsCron] got %s messages', messages.length);
            const promises = messages.map(m => this.parseEmail(m).then(parsedContent => ({
              ...m,
              payload: undefined,
              parsedContent,
            })));
            return Promise.all(promises);
          })
          // .then((mails) => {
          //   // Passer à la fonction applyEmailRules l'object Rule et une liste de mali à checker
          //   let emailRules = emailConfig.Rules;
          //   console.log('C\'est ici qu\'on va appliquer nos règles :', mails.length);
          //   if (emailRules && emailRules.length > 0 && mails.length > 0) {
          //     this.applyEmailRules(Organisation.id, mails, emailRules)
          //   }
          //   return mails
          // })
          // .then((mails) => {
          //   fetchedEmails = mails;
          //   // console.log('[MAILS]', mails)
          //   return this.filterEmailsBySettings(mails, Organisation, emailConfig);
          // })
          .then(async (mails) => {
            fetchedEmails = mails;
            // console.log('fetchedEmails', fetchedEmails);
            // debug('keptEmails', keptEmails.length);

            if (!fetchedEmails || fetchedEmails.length < 1) {
              return;
            }
            // On enregistre les mails en BDD
            // await fetchedEmails.forEach((mail => {
            //     axel.models.originalEmail.em.create({
            //     organisationId: emailConfig.organisationId,
            //     mailboxId: emailConfig.mailboxId,
            //     source: 'gmail',
            //     externalId: mail.id,
            //     fromEmail: mail.fromEmail || mail.parsedContent.fromEmail,
            //     content: mail.parsedContent.text || mail.parsedContent.snippet,
            //     parsedContent: { ...mail.parsedContent, html: null },
            //   })
            //   .then(() => console.log(`[GmailService] email ${mail.id} successfully imported`))
            //   .catch(err => debug(`[GmailService] email ${mail.id} already imported`, err.message));
            // }))

            for (let i = 0; i < fetchedEmails.length; i++) {
              const mail = mails[i];
              // eslint-disable-next-line no-await-in-loop
              await axel.models.originalEmail.em.create({
                organisationId: emailConfig.organisationId,
                mailboxId: emailConfig.id,
                source: 'gmail',
                externalId: mail.id,
                fromEmail: mail.fromEmail || mail.parsedContent.fromEmail,
                // toEmail: mail.toEmail || mail.parsedContent.toEmail,
                subject: mail.subject,
                snippet: mail.snippet || mail.subject,
                content: mail.parsedContent.text || mail.parsedContent.snippet,
                parsedContent: { ...mail.parsedContent, html: null, text: null },
                receivedOn: new Date(mail.parsedContent.date),
              })
                .catch(err => console.warn(`[GmailService] email ${mail.id} already imported`, err.message));
            }

            // On notifie à GMAIL que les mails ont bien été récupérés
            for (let i = 0; i < fetchedEmails.length; i++) {
              // eslint-disable-next-line
              await this.markAsTreated(auth, email, fetchedEmails[i].id);
            }

            // for (let i = 0; i < fetchedEmails.length; i++) {
            //   // eslint-disable-next-line
            //   await this.importConversation(fetchedEmails[i], Organisation, emailConfig);
            // }

            // for (let i = 0; i < fetchedEmails.length; i++) {
            //   // eslint-disable-next-line
            //   await this.markAsTreated(auth, email, fetchedEmails[i].id);
            // }
          })
          .then(async () => {
            if (!fetchedEmails || fetchedEmails.length < 1) {
              return;
            }

            const fetchedEmailsIds = fetchedEmails.map(mail => mail.id);
            const fetchedEmailsinDB = await axel.models.originalEmail.em.findAll({
              where: {
                externalId: { [Op.in]: fetchedEmailsIds },
                mailboxId: emailConfig.id
              }
            });

            const emailRules = emailConfig.Rules;
            if (emailRules && emailRules.length > 0 && fetchedEmailsinDB.length > 0) {
              await this.applyEmailRules(Organisation.id, fetchedEmailsinDB, emailConfig);
            }
          })
          .catch(console.error);
      }
    });
  },


  /*
  slackAlert(email) {
    const slack = {};
    if (!axel.config.gmailAccounts || axel.config.gmailAccounts.length < 1) {
      return Promise.resolve();
    }
    const authClient = this.authenticate(axel.config.gmailAccounts.find(x => x.email === email).credentials);
    const dateNow = new Date();
    const collection = axel.models.gmail_alert.em;

    gmailService.users.labels.list(
      {
        auth: authClient,
        userId: email,
      },
      (error, response) => {
        if (error) {
          console.warn(error);
        }

        const labels = response.data.labels;

        collection.find()
          .then((data) => {
            if (data && data.length) {
              data.forEach((alert) => {
                if (alert.nextAlert === undefined || alert.nextAlert === null
                  || alert.nextAlert <= dateNow
                ) {
                  const label = labels.find(item => item.name === alert.slackAccount);

                  if (label === undefined) {
                    gmailService.users.labels.create(
                      {
                        auth: authClient,
                        userId: email,
                        resource: {
                          labelListVisibility: 'labelShow',
                          messageListVisibility: 'show',
                          name: alert.slackAccount,
                        }
                      },
                      (error, response) => {
                        if (error) {
                          console.error(error);
                        } else {
                          labels.push(response.data);
                        }
                      }
                    );
                  }

                  const nextAlert = new Date();
                  let searchQuery = null;
                  let slackMessage = '';

                  switch (alert.frequencyUnit) {
                    case 'min':
                      nextAlert.setMinutes(nextAlert.getMinutes() + alert.frequency);
                      break;
                    case 'hour':
                      nextAlert.setHours(nextAlert.getHours() + alert.frequency);
                      break;
                    case 'day':
                      nextAlert.setDate(nextAlert.getDate() + alert.frequency);
                      break;
                    default:
                      break;
                  }

                  alert.nextAlert = nextAlert;
                  alert.lastAlert = dateNow;
                  collection.update({ _id: alert._id }, alert)
                    .catch((err) => {
                      console.warn(err);
                    });

                  alert.searchCriterias.forEach((keyword) => {
                    searchQuery = searchQuery === null ? keyword : `${searchQuery} ${keyword}`;
                  });

                  if (searchQuery !== null) {
                    searchQuery += 'label:inbox';

                    gmailService.users.messages.list(
                      {
                        auth: authClient,
                        userId: email,
                        q: searchQuery,
                        maxResults: 20
                      },
                      (error, response) => {
                        if (error) {
                          console.warn(error);
                        }

                        const emails = response.data.messages;
                        let subject = '';
                        let from = '';

                        if (emails !== undefined && emails.length > 0) {
                          const promises = [];

                          emails.forEach((x) => {
                            promises.push(new Promise((resolve) => {
                              gmailService.users.messages.get(
                                {
                                  auth: authClient,
                                  userId: email,
                                  id: x.id
                                },
                                (error, response) => {
                                  if (error) {
                                    console.warn(error);
                                  }

                                  subject = response.data.payload.headers
                                    .find(c => c.name === 'Subject').value;
                                  from = response.data.payload.headers.filter(i => i.name === 'From')[0]
                                    .value.split('<')
                                    .pop()
                                    .split('>')[0];

                                  resolve(slackMessage
                                    += `• _${from}_ - <${'https://mail.google.com/mail/u/0/#inbox/'}${response
                                      .data.id} | ${subject}> \n`);

                                  gmailService.users.messages.modify(
                                    {
                                      auth: authClient,
                                      userId: email,
                                      id: x.id,
                                      resource: {
                                        addLabelIds: [labels.find(item => item.name === alert.slackAccount).id]
                                      }
                                    },
                                    (error, response) => {
                                      if (error) {
                                        console.error(error);
                                        console.debug(response);
                                      }
                                    }
                                  );
                                }
                              );
                            }));
                          });

                          Promise.all(promises).then(() => {
                            const slack = new Slack(axel.config.slack.token);
                            slack.api('chat.postMessage', {
                              text: slackMessage,
                              channel: alert.slackAccount,
                              username: `Vous avez des emails non lus - ${email}`,
                              icon_emoji: ':email:'
                            }, (error, response) => {
                              if (error) {
                                console.warn(error);
                              }
                              if (response.ok) {
                                console.debug(`Slack alert sent to ${alert.slackAccount}`);
                              } else {
                                console.debug(`Slack alert could not be sent to
                                  ${alert.slackAccount} - ${response.error}`);
                              }
                            });
                          });
                        }
                      }
                    );
                  }
                }
              });
            }
          });
      }
    );
  },
  */
  authenticate(account) {
    if (!account) {
      throw new Error('error_missing_access_token');
    }
    if (typeof (account) === 'string') {
      account = JSON.parse(account);
    }
    const auth = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      // 'https://developers.google.com/oauthplayground'
    );

    const token = {
      access_token: account.googleTokens.access_token,
      scope: 'https://www.googleapis.com/auth/gmail.modify',
      token_type: 'Bearer',
      refresh_token: account.googleTokens.refresh_token
    };

    auth.setCredentials(token);

    return auth;
  },

  filterEmailsByKeywords(emails, keywords = []) {
    if (!emails) {
      throw new Error('error_missing_emails');
    }
    return emails.filter((m) => {
      const contentStr = JSON.stringify(m.parsedContent);
      // shouldn't it be some instead of any ?
      return keywords.any(k => contentStr.includes(k));
    });
  },

  // NOT USED ANYMORE

  // async filterEmailsBySettings(emails, organisation, mailbox) {
  //   let clients; let contacts; let
  //     clientEmails;
  //   let keptEmails = [];
  //   const droppedEmails = [];
  //   let received;
  //   debug('filterEmailsBySettings', mailbox.fetchTarget, mailbox.conditions, mailbox.keywords);
  //   switch (mailbox.fetchTarget) {
  //       case 'client':
  //       case 'candidate':
  //         received = emails.length;
  //         // @todo mettre en cache ces données.
  //         const p1 = axel.models[mailbox.fetchTarget].em.findAll({
  //           where: {
  //             organisationId: organisation.id,
  //             email: { [Op.ne]: null },
  //           },
  //           attributes: ['email', 'id']
  //         });
  //         const p2 = await axel.models.contact.em.findAll({
  //           where: {
  //             organisationId: organisation.id,
  //             email: { [Op.ne]: null },
  //           },
  //           attributes: ['email', 'id']
  //         });
  //         [clients, contacts] = await Promise.all([p1, p2]);
  //         clientEmails = clients.map(c => c.email).concat(contacts.map(c => c.email));
  //         emails = emails.forEach((mail) => {
  //           if (clientEmails.find(email => email.toLowerCase() === mail.parsedContent.fromEmail)) {
  //             keptEmails.push(mail);
  //           } else {
  //             droppedEmails.push(mail);
  //           }
  //         });
  //         debug('[filterEmailsBySettings] filter by clients received %s retained %s dropped %s',
  //           received,
  //           keptEmails.length,
  //           droppedEmails.length);

  //         // fixme bulk insert
  //         droppedEmails.forEach((mail) => {
  //           axel.models.originalEmail.em.create(
  //             {
  //               organisationId: organisation.id,
  //               mailboxId: mailbox.id,
  //               externalId: mail.id,
  //               source: 'gmail',
  //               fromEmail: mail.fromEmail || mail.parsedContent.fromEmail,
  //               content: mail.parsedContent.text || mail.parsedContent.snippet,
  //               parsedContent: { ...mail.parsedContent, html: null },
  //               receivedOn: new Date(mail.parsedContent.date),
  //             }
  //           ).catch(err => console.warn('[filterEmailsBySettings]', errorCallback(err), mail.id));
  //         });
  //         break;

  //       case 'disabled':
  //         keptEmails = [];
  //         break;
  //       default:
  //       case 'all':
  //         keptEmails = emails;
  //         debug('bulk inserts');
  //         axel.models.originalEmail.em.bulkCreate(
  //           keptEmails.map(mail => (
  //             {
  //               organisationId: organisation.id,
  //               mailboxId: mailbox.id,
  //               externalId: mail.id,
  //               source: 'gmail',
  //               fromEmail: mail.fromEmail || mail.parsedContent.fromEmail,
  //               content: mail.parsedContent.text || mail.parsedContent.snippet,
  //               parsedContent: { ...mail.parsedContent, html: null },
  //               receivedOn: new Date(mail.parsedContent.date),
  //             }
  //           )),
  //           { ignoreDuplicates: true }
  //         ).catch(err => console.warn('[filterEmailsBySettings][bulk]', errorCallback(err)));
  //         break;
  //   }

  //   switch (mailbox.fetchConditions) {
  //       case 'all':
  //       default:
  //         return keptEmails;
  //       case 'keywords':
  //         return this.filterEmailsByKeywords(keptEmails, mailbox.fetchKeywords);
  //   }
  // },

  createEmail({
    to, from, subject, message, headerMessageId, cc
  }) {
    const str = [
      'Content-Type: text/html; charset="UTF-8"\n',
      `References: ${headerMessageId}\n`,
      `In-Reply-To: ${headerMessageId}\n`,
      'MIME-Version: 1.0\n',
      'Content-Transfer-Encoding: base64\n',
      'to: ', to, '\n',
      'cc: ', cc, '\n',
      'from: ', from, '\n',
      'subject: ', subject, '\n\n',
      message
    ].join('');
    console.warn('email esent ', str);
    return Buffer.from(str).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  },

  async sendEmail(credentials, userId, {
    threadId, from, to, cc, subject, message
  }) {
    const auth = this.authenticate(credentials);
    // const auth = '';
    let headerMessageId;
    if (threadId) {
      const originalEmail = await axel.models.originalEmail.em.findOne({ where: { externalId: threadId }, raw: true });
      if (originalEmail) {
        try {
          const parsedContent = JSON.parse(originalEmail.parsedContent);
          headerMessageId = parsedContent.headerMessageId;
        } catch (err) {
          console.warn('[GMAILSERVICE]', err.message, err);
        }
      } else {
        return originalEmail;
      }
    }

    return gmailService.users.messages.send(
      {
        auth,
        userId,
        requestBody: {
          threadId,
          raw: this.createEmail({
            from, to, subject, message, cc, headerMessageId
          })
        },
      }
    );
  },

  composeEmail(auth, userId, {
    threadId, from, to, subject, message
  }) {
    return gmailService.users.drafts.create({
      auth,
      userId,
      requestBody: {
        threadId,
        raw: this.createEmail({
          from, to, subject, message, threadId
        })
      },
    }).then(result => result.data);
  },

  markAsTreated(auth, userId, mailId) {
    this.getLabelId(auth, userId, mailId).then((myGmailLabel) => {
      if (myGmailLabel && myGmailLabel.id) {
        return gmailService.users.messages
          .modify(
            {
              userId,
              auth,
              id: mailId,
              resource: {
                // removeLabelIds: ['INBOX'],
                addLabelIds: [myGmailLabel.id || myGmailLabel]
              }
            }
          );
      }
      console.warn('[GMAILSERVICE] missing label definition', myGmailLabel);
    })
      .catch((err) => {
        console.warn('[GMAILSERVICE][markAsTreated]', err.message);
      });
  },

  extractField(json, fieldName) {
    const extract = json && json.payload && json.payload.headers.filter(header => header.name === fieldName);
    if (extract && extract[0]) {
      return extract[0].value;
    }

    console.warn('Emailfetcher => ExtractField failed', fieldName, extract);
  },

  extractBody(p, mimeType) {
    if (p.mimeType !== mimeType) {
      return '';
    }
    let Body = '';
    if (p.parts && p.parts.length > 0) {
      for (const part of p.parts) {
        Body += ` ${this.extractBody(part, mimeType)}`;
      }
      return Body;
    }
    if (p.body && p.body.data) {
      // Body = atob(p.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      Body = base64.decode(p.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    } else {
      axel.logger.log('MAILFETCHER :: NOTHING TO DO ON THAT PART :: ', mimeType, p.mimeType, Object.keys(p), p.body);
    }
    return Body;
  },

  async parseEmail(detail) {
    const mailparser = new MailParser();
    const mailSource = detail.payload;
    // const reparsed = await simpleParser(detail.raw, {});
    mailparser.write(base64.decode(detail.raw));

    const rawParsed = await new Promise((resolve, reject) => {
      mailparser.on('end', (mail) => {
        resolve(mail); // object structure for parsed e-mail
      });
      mailparser.on('error', (err) => {
        reject(err); // object structure for parsed e-mail
      });
      mailparser.end();
    });

    const mail = {};
    mail.gmailId = detail.id;
    mail.historyId = detail.historyId;
    mail.labels = detail.labelsIds;
    mail.date = new Date(detail.internalDate);
    mail.snippet = detail.snippet;
    if (rawParsed) {
      mail.headerMessageId = rawParsed.headers['message-id'];
      // eslint-disable-next-line
      mail.subject = rawParsed.subject ? rawParsed.subject.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, ' ') : '(non renseigné)';
      mail.html = rawParsed.html;
      mail.text = rawParsed.text;
      mail.from = rawParsed.from && rawParsed.from[0] && rawParsed.from[0].name;
      mail.fromEmail = rawParsed.from && rawParsed.from[0] && rawParsed.from[0].address;
      mail.fromEmail = mail.fromEmail.toLowerCase();
      mail.to = rawParsed.to && rawParsed.to[0] && rawParsed.to[0].name;
      mail.toEmail = rawParsed.to && rawParsed.to[0] && rawParsed.to[0].address;
      mail.date = new Date(rawParsed.receivedDate || rawParsed.date);
      mail.attachments = rawParsed.attachments;
      mkdirp(`${process.cwd()}/public/data/emails`);
      if (mail.attachments && Array.isArray(mail.attachments)) {
        mail.attachments = mail.attachments.filter(attachment => attachment.contentDisposition === 'attachment').map((attachment) => {
          debug('attachement', { ...attachment, content: null });
          const filePath = `/data/emails/${attachment.fileName}`;
          try {
            fs.writeFileSync(
              `${process.cwd()}/public${filePath}`,
              attachment.content
            );
          } catch (error) {
            return console.warn('[GmailService][attachements]', { errors: [error], message: 'upload_failed' });
          }
          delete attachment.content;
          attachment.url = filePath;
          return { ...attachment };
        });
      }
      mail.mailSource = { ...rawParsed, attachments: null };
      /*
      console.log('Raw parsed', mailSource);
      mail.html = mail.html.trim();
      mail.text = mail.text.trim();
      */
    } else if (mailSource) {
      if (mailSource.headers) {
        mail.headerMessageId = mailSource.headers.find(h => h.name.toLowerCase() === 'message-id');
        if (mail.headerMessageId) {
          mail.headerMessageId = mail.headerMessageId.value;
        }
      }

      mail.date = this.extractField(detail, 'Date');
      if (mail.date) {
        mail.date = new Date(mail.date);
      }
      mail.subject = this.extractField(detail, 'Subject');
      mail.subject = escape(mail.subject);
      mail.from = this.extractField(detail, 'From');
      mail.to = this.extractField(detail, 'To');

      mail.from = mail.from.trim();
      mail.to = mail.to ? mail.to.trim() : '';
      mail.fromEmail = mail.from.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi)[0];
      mail.fromEmail = mail.fromEmail.toLowerCase();

      // if the sender is myself.
      //  if (mail.email === userId) {
      //   return { content: 'same user' };
      // }

      mail.from = mail.from.replace(/<.*>/, '') || mail.from;
      mail.from = mail.from.replace(/"/, '') || mail.from;
      mail.from = mail.from.replace(/'/, '') || mail.from;

      mail.from = mail.from.trim();
      mail.html = this.extractBody(mailSource, 'text/html');
      mail.html = mail.html.trim();

      mail.text = this.extractBody(mailSource, 'text/plain');
      mail.text = mail.text.trim();

      if (!mail.html) {
        mail.source = mailSource;
      }
    }
    if (mail.html && !mail.text) {
      mail.text = mail.html;
      // mail.text = mail.text.replace(/<style>.*<\/style>/gi, '');
      // mail.text = striptags(mail.text, ['br'], ' ');
      mail.text = striptags(mail.text, ['br', 'p', 'strong'], ' ');
      const cssRegex = /((<style>)|(<style type=.+))((\s+)|(\S+)|(\r+)|(\n+))(.+)((\s+)|(\S+)|(\r+)|(\n+))(<\/style>)/g;
      const cssRegex2 = /(body{.*})|@media only .+{.+}/mg;

      mail.text = mail.text
        .replace(/(\r\n )+/g, '\r\n')
        .replace(/\s+/g, ' ').replace(cssRegex, '')
        .replace(/\s+/g, ' ')
        .replace(cssRegex2, '')
        .trim();
    }
    mail.text = sanitizeHtml(mail.text);
    //  mail.html = sanitizeHtml(mail.html);
    mail.html = '';
    mail.text = _.unescape(mail.text);
    return mail;
  },

};
