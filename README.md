# Liture

Build output: `src-tauri/target/release/bundle/`

## MacOS / Windows

```bash
npm run tauri build
```

### Delete local db

```bash
rm ~/Library/Application\ Support/com.liture.notes/quotes.db
```

## Linux

```bash
docker-compose build
docker-compose run --rm tauri-linux-builder
```

If it doesn't work

```bash
docker-compose up -d tauri-linux-builder
docker ps # grab id
docker exec -it <container_id> /bin/bash
npm list @tauri-apps/cli-linux-x64-gnu
npm run tauri build
```
