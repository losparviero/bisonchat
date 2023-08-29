#!/usr/bin/env node

/*!
 * Bison Telegram Bot
 * Copyright (c) 2023 to present. All rights reserved.
 *
 * @author Zubin
 * @username (GitHub) losparviero
 * @license AGPL-3.0
 */

// Add env vars as a preliminary

import dotenv from "dotenv";
dotenv.config();
import { Bot, session, GrammyError, HttpError } from "grammy";
import { hydrateReply, parseMode } from "@grammyjs/parse-mode";
import { hydrate } from "@grammyjs/hydrate";
import { run, sequentialize } from "@grammyjs/runner";
import { runPredict } from "./bison.js";

// Bot

if (!process.env.BOT_TOKEN) {
  throw new Error("Telegram BOT_TOKEN variable not set in the env.");
}
const bot = new Bot(process.env.BOT_TOKEN);

// Concurrency

function getSessionKey(ctx) {
  return ctx.chat?.id.toString();
}

// Plugins

bot.use(sequentialize(getSessionKey));
bot.use(session({ getSessionKey }));
bot.use(responseTime);
bot.use(hydrate());
bot.use(admin);
bot.use(log);
bot.use(hydrateReply);

// Parse

bot.api.config.use(parseMode("Markdown"));

// Admin

const admins = process.env.BOT_ADMIN?.split(",").map(Number) || [];
async function admin(ctx, next) {
  ctx.config = {
    botAdmins: admins,
    isAdmin: admins.includes(ctx.chat?.id),
  };
  await next();
}

// Response

async function responseTime(ctx, next) {
  const before = Date.now();
  await next();
  const after = Date.now();
  console.log(`Response time: ${after - before} ms`);
}

// Log

async function log(ctx, next) {
  if (
    ctx.chat.type === "private" &&
    ctx.message &&
    !ctx.message.text.startsWith("/")
  ) {
    const from = ctx.from;
    const name =
      from.last_name === undefined
        ? from.first_name
        : `${from.first_name} ${from.last_name}`;
    const message = (ctx.message && ctx.message.text) || ctx.inlineQuery.query;
    console.log(
      `From: ${name} (@${from.username}) ID: ${from.id}\nMessage: ${message}`
    );
  }

  await next();
}

// Commands

bot.command("start", async (ctx) => {
  await ctx
    .reply(
      "*Welcome* ✨\n_This is a personal bot to interact with Google PaLM AI._"
    )
    .then(console.log("New user added", ctx.from));
});

bot.command("help", async (ctx) => {
  await ctx
    .reply(
      "*@anzubo Project.*\n\n_This is a chat bot using Google's PaLM AI.\nIf you have authorization, ask any query to get started!_"
    )
    .then(console.log("Help command sent to", ctx.chat.id));
});

// Messages

bot.on("message:text", async (ctx) => {
  await ctx.replyWithChatAction("typing");

  if (!ctx.config.isAdmin) {
    await ctx.reply(
      "*You are not authorized to use this bot.*\n_Please get access from admins._"
    );
  } else {
    try {
      const chatResponse = await runPredict(ctx.message.text);

      const botReply = await ctx.reply(chatResponse.generatedContent, {
        parse_mode: "",
        reply_to_message_id: ctx.message.message_id,
      });
      if (chatResponse.modifiedContent.length > 0) {
        await ctx.reply(chatResponse.modifiedContent, {
          parse_mode: "HTML",
          reply_to_message_id: botReply.message_id,
          disable_web_page_preview: true,
        });
      }
    } catch (error) {
      console.log(`Error:\n${error}`);
      await ctx.reply(
        `*There was a problem predicting response.*\n_${error.message}_`,
        { reply_to_message_id: ctx.message.message_id }
      );
    }
  }
});

// Error

bot.catch((err) => {
  const ctx = err.ctx;
  console.error("Error while handling update", ctx.update.update_id);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
    if (e.description === "Forbidden: bot was blocked by the user") {
      console.log("Bot was blocked by the user");
    } else {
      ctx.reply("An error occurred");
    }
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram:", e);
  } else {
    console.error("Unknown error:", e);
  }
});

// Run

console.log(`[INIT ${new Date(Date.now()).toLocaleString()}] Bot running.`);
run(bot);
