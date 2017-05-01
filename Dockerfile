FROM trademachines/node-alpine:6.10

COPY package.json yarn.lock /ecd/
COPY src/cli /ecd/src/cli

RUN cd /ecd \
    && yarn remove ffi \
    && yarn install --production \
    && npm remove -g yarn \
    && rm -rf ~/.cache/yarn ~/.npm /usr/local/share /usr/lib/node_modules

WORKDIR /usr/share/ecd
VOLUME ["/usr/share/ecd"]

ENTRYPOINT ["node", "/ecd/src/cli/index.js"]
