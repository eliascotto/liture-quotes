FROM debian:bookworm

# Install dependencies
RUN apt update && apt install -y \
  libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  ca-certificates \
  git \
  cmake \
  pkg-config \
  libgtk-3-dev \
  xdg-utils

# Install Rust
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y
ENV PATH="/root/.cargo/bin:$PATH"

# Install Node.js LTS
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - && \
    apt install -y nodejs

# Create app directory
WORKDIR /app

# Copy project files
COPY . .

# Clean potential stale state and install node dependencies
RUN rm -rf node_modules package-lock.json

# Install deps and the Tauri CLI (including the correct native binary)
RUN npm install

RUN npm install @tauri-apps/cli-linux-x64-gnu

# Build the Tauri app using npm script
CMD ["npm", "run", "tauri", "build"]
