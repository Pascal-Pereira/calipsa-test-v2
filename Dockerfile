FROM node:14
# LABEL tag=freelanceo/front

ENV APP_ROOT /usr/www
ENV NPM_CONFIG_LOGLEVEL warn
ENV NODE_ENV production
ENV PORT 8000
ENV BASE_URL https://api.freelanceo.io
ENV API_URL https://api.freelanceo.io
ENV STRIPE_PUBLISHABLE_KEY pk_test_BPF3kgs6Iw59xSCY2nMBtRiY
ENV NUXT_ENV_GOOGLE_CLIENT_ID 907959208103-pe82u9jsl0qll3hi2epesjdl3js4fqhf.apps.googleusercontent.com
ENV NUXT_ENV_FACEBOOK_CLIENT_ID "$NUXT_ENV_FACEBOOK_CLIENT_ID"
ENV GOOGLE_TAG_MANAGER_ID GTM-T83FVJ9
ENV SITE freelanceo
ENV FEATURES_DEALING_MODE quotation
ENV HOST 0.0.0.0

RUN mkdir ${APP_ROOT}
WORKDIR ${APP_ROOT}
# Install app dependencies
COPY package.json ${APP_ROOT}
COPY yarn.lock ${APP_ROOT}
# RUN yarn install --prod
RUN yarn --frozen-lockfile
RUN yarn add sass-loader@9.0.3
ADD . .
RUN yarn build
EXPOSE 8000
CMD [ "yarn", "start" ]