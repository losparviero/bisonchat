# Bison Telegram Bot

Char with Google's PaLM AI (chat-bison-001) in Telegram!

### Install

1. Clone repo.
2. Run ```npm i``` in project folder.
3. Rename .env.example to .env and populate env variables.
4. Run ```npm start``` to start the bot.

#### It's advisable to run the bot using PM2 or any startup manager for persistent execution.

### Mechanism

Uses the MakerSuite API which is promotional, rate-limited and not meant for production use.

### Limitations

No chat context or message history. Each new message is effectively it's own conversation thread so conversation history is not maintained.

IF someone is willing to contribute and add that, please feel free to open a PR.
### License

AGPL-3.0 ©️ Zubin