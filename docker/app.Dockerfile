FROM node:22-alpine

RUN apk add --no-cache libc6-compat git

WORKDIR /workspace
RUN chown -R node:node /workspace

USER node
COPY --chown=node:node package.json package-lock.json ./
RUN npm install && mkdir -p /workspace/.next

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]
