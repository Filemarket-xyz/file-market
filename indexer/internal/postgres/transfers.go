package postgres

import (
	"context"
	"fmt"
	"github.com/ethereum/go-ethereum/common"
	"github.com/jackc/pgx/v4"
	"github.com/mark3d-xyz/mark3d/indexer/internal/domain"
	"math/big"
	"strings"
)

func (p *postgres) GetIncomingTransfersByAddress(ctx context.Context, tx pgx.Tx,
	address common.Address) ([]*domain.Transfer, error) {
	// language=PostgreSQL
	rows, err := tx.Query(ctx, `SELECT id,collection_address,token_id,
       from_address,to_address,fraud_approved FROM transfers WHERE to_address=$1 ORDER BY id DESC`,
		strings.ToLower(address.String()))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var (
		res []*domain.Transfer
		ids []int64
	)
	for rows.Next() {
		var collectionAddress, tokenId, from, to string
		t := &domain.Transfer{}
		if err := rows.Scan(&t.Id, &collectionAddress, &tokenId, &from, &to, &t.FraudApproved); err != nil {
			return nil, err
		}
		t.CollectionAddress, t.FromAddress, t.ToAddress = common.HexToAddress(collectionAddress),
			common.HexToAddress(from), common.HexToAddress(to)
		var ok bool
		t.TokenId, ok = big.NewInt(0).SetString(tokenId, 10)
		if !ok {
			return nil, fmt.Errorf("failed to parse big int: %s", tokenId)
		}
		res, ids = append(res, t), append(ids, t.Id)
	}
	statuses, err := p.getTransferStatuses(ctx, tx, ids)
	if err != nil {
		return nil, err
	}
	for _, t := range res {
		t.Statuses = statuses[t.Id]
	}
	return res, nil
}

func (p *postgres) GetOutgoingTransfersByAddress(ctx context.Context, tx pgx.Tx,
	address common.Address) ([]*domain.Transfer, error) {
	// language=PostgreSQL
	rows, err := tx.Query(ctx, `SELECT id,collection_address,token_id,
       from_address,to_address,fraud_approved FROM transfers WHERE from_address=$1 ORDER BY id DESC`,
		strings.ToLower(address.String()))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var (
		res []*domain.Transfer
		ids []int64
	)
	for rows.Next() {
		var collectionAddress, tokenId, from, to string
		t := &domain.Transfer{}
		if err := rows.Scan(&t.Id, &collectionAddress, &tokenId, &from, &to, &t.FraudApproved); err != nil {
			return nil, err
		}
		t.CollectionAddress, t.FromAddress, t.ToAddress = common.HexToAddress(collectionAddress),
			common.HexToAddress(from), common.HexToAddress(to)
		var ok bool
		t.TokenId, ok = big.NewInt(0).SetString(tokenId, 10)
		if !ok {
			return nil, fmt.Errorf("failed to parse big int: %s", tokenId)
		}
		res, ids = append(res, t), append(ids, t.Id)
	}
	statuses, err := p.getTransferStatuses(ctx, tx, ids)
	if err != nil {
		return nil, err
	}
	for _, t := range res {
		t.Statuses = statuses[t.Id]
	}
	return res, nil
}

func (p *postgres) getTransferStatuses(ctx context.Context, tx pgx.Tx,
	ids []int64) (map[int64][]*domain.TransferStatus, error) {
	// language=PostgreSQL
	rows, err := tx.Query(ctx, `SELECT transfer_id,timestamp,status,tx_id FROM transfer_statuses 
                                          WHERE transfer_id=ANY($1) ORDER BY transfer_id,timestamp DESC`, ids)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	res := make(map[int64][]*domain.TransferStatus, len(ids))
	for rows.Next() {
		var (
			transferId int64
			txId       string
		)
		s := &domain.TransferStatus{}
		if err := rows.Scan(&transferId, &s.Timestamp, &s.Status, &txId); err != nil {
			return nil, err
		}
		s.TxId = common.HexToHash(txId)
		res[transferId] = append(res[transferId], s)
	}
	return res, nil
}

func (p *postgres) GetTransfer(ctx context.Context, tx pgx.Tx, id int64) (*domain.Transfer, error) {
	// language=PostgreSQL
	row := tx.QueryRow(ctx, `SELECT id,collection_address,token_id,
       from_address,to_address,fraud_approved FROM transfers WHERE id=$1`, id)
	var collectionAddress, tokenId, from, to string
	t := &domain.Transfer{}
	if err := row.Scan(&t.Id, &collectionAddress, &tokenId, &from, &to, &t.FraudApproved); err != nil {
		return nil, err
	}
	t.CollectionAddress, t.FromAddress, t.ToAddress = common.HexToAddress(collectionAddress),
		common.HexToAddress(from), common.HexToAddress(to)
	var ok bool
	t.TokenId, ok = big.NewInt(0).SetString(tokenId, 10)
	if !ok {
		return nil, fmt.Errorf("failed to parse big int: %s", tokenId)
	}
	statuses, err := p.getTransferStatuses(ctx, tx, []int64{t.Id})
	if err != nil {
		return nil, err
	}
	t.Statuses = statuses[t.Id]
	return t, nil
}

func (p *postgres) GetActiveTransfer(ctx context.Context, tx pgx.Tx,
	contractAddress common.Address, tokenId *big.Int) (*domain.Transfer, error) {
	// language=PostgreSQL
	row := tx.QueryRow(ctx, `SELECT id,from_address,to_address,fraud_approved FROM transfers AS t
        WHERE collection_address=$1 AND token_id=$2 AND
              NOT (SELECT ts.status FROM transfer_statuses AS ts WHERE ts.transfer_id=t.id AND 
                ts.timestamp=(SELECT MAX(ts2.timestamp) FROM transfer_statuses AS ts2 WHERE ts2.transfer_id=t.id))=
                    ANY('{Finished,Cancelled}')`, strings.ToLower(contractAddress.String()), tokenId.String())
	var from, to string
	t := &domain.Transfer{
		CollectionAddress: contractAddress,
		TokenId:           tokenId,
	}
	if err := row.Scan(&t.Id, &from, &to, &t.FraudApproved); err != nil {
		return nil, err
	}
	t.FromAddress, t.ToAddress = common.HexToAddress(from), common.HexToAddress(to)
	statuses, err := p.getTransferStatuses(ctx, tx, []int64{t.Id})
	if err != nil {
		return nil, err
	}
	t.Statuses = statuses[t.Id]
	return t, nil
}

func (p *postgres) InsertTransfer(ctx context.Context, tx pgx.Tx, transfer *domain.Transfer) (int64, error) {
	// language=PostgreSQL
	row := tx.QueryRow(ctx, `INSERT INTO transfers VALUES (DEFAULT,$1,$2,$3,$4,$5) RETURNING id`,
		strings.ToLower(transfer.CollectionAddress.String()), transfer.TokenId.String(),
		strings.ToLower(transfer.FromAddress.String()), strings.ToLower(transfer.ToAddress.String()),
		transfer.FraudApproved)
	var id int64
	if err := row.Scan(&id); err != nil {
		return 0, err
	}
	return id, nil
}

func (p *postgres) UpdateTransfer(ctx context.Context, tx pgx.Tx, transfer *domain.Transfer) error {
	// language=PostgreSQL
	if _, err := tx.Exec(ctx, `UPDATE transfers SET fraud_approved=$1 WHERE id=$2`,
		transfer.FraudApproved, transfer.Id); err != nil {
		return err
	}
	return nil
}

func (p *postgres) InsertTransferStatus(ctx context.Context, tx pgx.Tx, transferId int64,
	status *domain.TransferStatus) error {
	// language=PostgreSQL
	if _, err := tx.Exec(ctx, `INSERT INTO transfer_statuses VALUES ($1,$2,$3,$4)`,
		transferId, status.Timestamp, status.Status, status.TxId.String()); err != nil {
		return err
	}
	return nil
}
