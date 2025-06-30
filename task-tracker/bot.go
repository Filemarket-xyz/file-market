package main

import (
	"log"
	"strings"
	"taskTracker/handlers"

	api "github.com/go-telegram-bot-api/telegram-bot-api"
)

type updateHandler func(...string) error

type Bot struct {
	api      *api.BotAPI
	commands map[string]updateHandler
}

func NewBot(botToken string, handlers []handlers.CmdHandler) *Bot {
	botApi, err := api.NewBotAPI(botToken)
	if err != nil {
		log.Fatal(err)
	}
	log.Printf("Authorized on account %s", botApi.Self.UserName)

	bot := &Bot{
		api:      botApi,
		commands: make(map[string]updateHandler),
	}

	for _, h := range handlers {
		bot.commands[h.GetCmd()] = h.Handle
	}

	return bot
}

func (b *Bot) Start() {
	u := api.NewUpdate(0)
	u.Timeout = 60

	updates, err := b.api.GetUpdatesChan(u)
	if err != nil {
		log.Fatalf("get update chan err: %v", err)
	}

	for update := range updates {
		if update.Message == nil {
			continue
		}
		b.HandleUpdate(update)
	}
}

func (b *Bot) HandleUpdate(update api.Update) {
	text := update.Message.Text

	if text[0] == '/' {
		msgParts := strings.Split(text, " ")

		if handle, exists := b.commands[msgParts[0]]; exists {
			if err := handle(msgParts[1:]...); err != nil {
				log.Printf("ERROR: %v", err)
				b.sendMsg(update.Message.Chat.ID, "Error occurred")
			} else {
				b.sendMsg(update.Message.Chat.ID, "Success!")
			}
			return
		}
	}

	b.sendMsg(update.Message.Chat.ID, "Wrong command.")
}

func (b *Bot) sendMsg(chatID int64, msg string) {
	m := api.NewMessage(chatID, msg)
	if _, err := b.api.Send(m); err != nil {
		log.Printf("ERROR: failed to send msg: %v; error: %v\n", m, err)
	}
}
