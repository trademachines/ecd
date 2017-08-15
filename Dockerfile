FROM node:6.10-alpine

COPY package.json yarn.lock /ecd/
COPY build/src/cli /ecd/src/cli
COPY build/node_modules /ecd/node_modules

RUN cd /ecd \
    && yarn remove ffi \
    && npm remove -g yarn \
    && rm -rf ~/.cache/yarn ~/.npm /usr/local/share /usr/lib/node_modules

WORKDIR /usr/share/ecd
VOLUME ["/usr/share/ecd"]

ENTRYPOINT ["node", "/ecd/src/cli/index.js"]
