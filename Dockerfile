FROM node

COPY . .

ENTRYPOINT ["yarn", "run"]
CMD ["start"]
