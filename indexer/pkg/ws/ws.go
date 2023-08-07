package ws

import (
	"encoding/json"
	"fmt"
	"github.com/ethereum/go-ethereum/common"
	"github.com/go-openapi/strfmt"
	"github.com/gorilla/websocket"
	"github.com/mark3d-xyz/mark3d/indexer/models"
	log2 "github.com/mark3d-xyz/mark3d/indexer/pkg/log"
	"log"
	"math/big"
	"strings"
	"sync"
	"time"
)

var logger = log2.GetLogger()

type conn struct {
	id        string
	conn      *websocket.Conn
	num       int64
	pool      *wsPool
	closeOnce *sync.Once
	writeLock *sync.Mutex
	subLock   *sync.Mutex
	topic     string
}

func (c *conn) listen() {
	for {
		kind, data, err := c.conn.ReadMessage()
		if err != nil {
			log.Println("listen failed", c.id, err)
			break
		}
		if kind == websocket.TextMessage {
			c.handleTextMessage(data)
		}
	}
	c.closeOnce.Do(func() {
		log.Println("removing conn from listen", c.id)
		c.pool.remove(c.num, c.id)
	})
}

func (c *conn) handleTextMessage(data []byte) {
	var s models.EFTSubscriptionRequest
	if err := json.Unmarshal(data, &s); err != nil {
		return
	}
	if err := s.Validate(strfmt.Default); err != nil {
		log.Println("failed to validate ws req")
		return
	}
	address := common.HexToAddress(s.CollectionAddress)
	tokenId, ok := big.NewInt(0).SetString(s.TokenID, 10)
	if !ok {
		log.Println("failed to validate ws req")
		return
	}
	c.subLock.Lock()
	c.topic = fmt.Sprintf("%s:%s", strings.ToLower(address.String()), tokenId.String())
	c.subLock.Unlock()

	c.sendJson(s)
}

func (c *conn) subbedOnTopic(topic string) bool {
	c.subLock.Lock()
	res := c.topic == topic
	c.subLock.Unlock()

	return res
}

func (c *conn) pingPong() {
	for {
		time.Sleep(time.Minute)
		c.writeLock.Lock()
		if err := c.conn.WriteMessage(websocket.PingMessage, []byte{}); err != nil {
			log.Println("ping failed", c.id, err)
			c.writeLock.Unlock()
			c.closeOnce.Do(func() {
				log.Println("removing conn from ping pong", c.id)
				c.pool.remove(c.num, c.id)
			})
			return
		}
		c.writeLock.Unlock()
	}
}

func (c *conn) sendJson(msg interface{}) {
	data, err := json.Marshal(msg)
	if err == nil {
		c.sendBytes(data)
	}
}

func (c *conn) sendBytes(data []byte) {
	c.writeLock.Lock()
	if err := c.conn.WriteMessage(websocket.TextMessage, data); err != nil {
		logger.Error("send message failed", err, nil)
		go c.closeOnce.Do(func() {
			logger.Info("removing conn from send", log2.Fields{"id": c.id})
			c.pool.remove(c.num, c.id)
		})
	}
	c.writeLock.Unlock()
}

func (c *conn) close() {
	c.closeOnce.Do(func() {
		logger.Info("closing conn", log2.Fields{"id": c.id})
		if err := c.conn.Close(); err != nil {
			logger.Error("close conn failed", err, log2.Fields{"id": c.id})
		}
	})
}
