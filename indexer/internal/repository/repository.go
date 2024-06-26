package repository

import (
	"github.com/ethereum/go-ethereum/common"
	"github.com/go-redis/redis/v8"
	"github.com/jackc/pgx/v4/pgxpool"
	"github.com/mark3d-xyz/mark3d/indexer/pkg/log"
)

var logger = log.GetLogger()

type Repository interface {
	Postgres
	BlockCounter
}

type Config struct {
	PublicCollectionAddress      common.Address
	FileBunniesCollectionAddress common.Address
}

type repository struct {
	cfg *Config
	*postgres
	*blockCounter
}

func NewRepository(pg *pgxpool.Pool, rdb *redis.Client, cfg *Config) Repository {
	return &repository{
		cfg: cfg,
		postgres: &postgres{
			pg: pg,
			cfg: &postgresConfig{
				publicCollectionAddress:      cfg.PublicCollectionAddress,
				fileBunniesCollectionAddress: cfg.FileBunniesCollectionAddress,
			},
		},
		blockCounter: &blockCounter{
			rdb: rdb,
		},
	}
}
