FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      git \
      curl \
      ca-certificates \
      bash \
      less \
      vim \
      ripgrep \
      fd-find \
      jq \
      sudo \
      postgresql-client \
    && rm -rf /var/lib/apt/lists/*

RUN echo "node ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/node \
    && chmod 0440 /etc/sudoers.d/node

RUN npm install -g @anthropic-ai/claude-code

USER node
WORKDIR /workspace
ENV HOME=/home/node

CMD ["bash"]
