FROM node

COPY . .

RUN yarn install

ENTRYPOINT ["yarn", "run"]
CMD ["start"]
