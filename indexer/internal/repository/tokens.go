package repository

import (
	"context"
	"errors"
	"fmt"
	"log"
	"math/big"
	"strings"

	"github.com/ethereum/go-ethereum/common"
	"github.com/jackc/pgx/v4"
	"github.com/mark3d-xyz/mark3d/indexer/internal/domain"
)

func (p *postgres) GetCollectionTokens(
	ctx context.Context,
	tx pgx.Tx,
	collectionAddress common.Address,
	lastTokenId *big.Int,
	limit int,
) ([]*domain.Token, error) {
	// language=PostgreSQL
	query := `
		SELECT 
		    t.token_id, t.owner, t.meta_uri, t.creator, t.royalty, t.mint_transaction_timestamp, t.mint_transaction_hash,
		    c.name
		FROM tokens t
		INNER JOIN collections c ON c.address = t.collection_address
		WHERE t.collection_address=$1 AND t.token_id > $2
		ORDER BY t.token_id
		LIMIT $3
	`
	var res []*domain.Token
	lastTokenIdStr := ""
	if lastTokenId != nil && lastTokenId.Cmp(big.NewInt(0)) != 0 {
		lastTokenIdStr = lastTokenId.String()
	}
	if limit == 0 {
		limit = 10000
	}

	err := func(res *[]*domain.Token, query string) error {
		rows, err := tx.Query(ctx, query,
			strings.ToLower(collectionAddress.String()),
			lastTokenIdStr,
			limit,
		)
		if err != nil {
			return err
		}
		defer rows.Close()

		for rows.Next() {
			var tokenId, owner, creator, mintTxHash string
			t := &domain.Token{}

			if err := rows.Scan(
				&tokenId,
				&owner,
				&t.MetaUri,
				&creator,
				&t.Royalty,
				&t.MintTxTimestamp,
				&mintTxHash,
				&t.CollectionName,
			); err != nil {
				return err
			}

			t.CollectionAddress = collectionAddress
			t.Owner = common.HexToAddress(owner)
			t.Creator = common.HexToAddress(creator)
			t.MintTxHash = common.HexToHash(mintTxHash)

			var ok bool
			t.TokenId, ok = big.NewInt(0).SetString(tokenId, 10)
			if !ok {
				return fmt.Errorf("failed to parse big int: %s", tokenId)
			}

			*res = append(*res, t)
		}
		return rows.Err()
	}(&res, query)
	if err != nil {
		return nil, err
	}

	for _, r := range res {
		metadata, err := p.GetMetadata(ctx, tx, r.CollectionAddress, r.TokenId)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				log.Printf("couldn't get metadata for token with collection address: %s, tokenId: %s", r.CollectionAddress, r.TokenId.String())
				metadata = domain.NewPlaceholderMetadata()
			}
			return nil, err
		}
		r.Metadata = metadata
	}
	return res, nil
}

func (p *postgres) GetCollectionTokensTotal(
	ctx context.Context,
	tx pgx.Tx,
	collectionAddress common.Address,
) (uint64, error) {
	// language=PostgreSQL
	query := `
		SELECT COUNT(*) as total
		FROM tokens t
		INNER JOIN collections c ON c.address = t.collection_address
		WHERE t.collection_address=$1
	`
	var total uint64
	row := tx.QueryRow(ctx, query, strings.ToLower(collectionAddress.String()))
	if err := row.Scan(&total); err != nil {
		return 0, err
	}

	return total, nil
}

func (p *postgres) GetTokensByAddress(
	ctx context.Context,
	tx pgx.Tx,
	ownerAddress common.Address,
	lastCollectionAddress *common.Address,
	lastTokenId *big.Int,
	limit int,
) ([]*domain.Token, error) {
	// language=PostgreSQL
	query := `
		SELECT 
		    t.collection_address, t.token_id, t.meta_uri, t.creator, t.royalty, 
		    t.mint_transaction_timestamp, t.mint_transaction_hash,
		    c.name
		FROM tokens t
		INNER JOIN collections c ON c.address = t.collection_address
		WHERE t.owner=$1 AND (t.collection_address, t.token_id) > ($2, $3)
		ORDER BY t.collection_address, t.token_id
		LIMIT $4
	`
	var res []*domain.Token

	lastCollectionAddressStr := ""
	if lastCollectionAddress != nil {
		lastCollectionAddressStr = strings.ToLower(lastCollectionAddress.String())
	}

	lastTokenIdStr := ""
	if lastTokenId != nil && lastTokenId.Cmp(big.NewInt(0)) != 0 {
		lastTokenIdStr = lastTokenId.String()
	}

	if limit == 0 {
		limit = 10000
	}

	err := func(res *[]*domain.Token, query string) error {
		rows, err := tx.Query(ctx, query,
			strings.ToLower(ownerAddress.String()),
			lastCollectionAddressStr,
			lastTokenIdStr,
			limit,
		)
		if err != nil {
			return err
		}
		defer rows.Close()

		for rows.Next() {
			var collectionAddress, tokenId, creator, mintTxHash string
			t := &domain.Token{}

			if err := rows.Scan(
				&collectionAddress,
				&tokenId,
				&t.MetaUri,
				&creator,
				&t.Royalty,
				&t.MintTxTimestamp,
				&mintTxHash,
				&t.CollectionName,
			); err != nil {
				return err
			}

			t.Owner = ownerAddress
			t.CollectionAddress = common.HexToAddress(collectionAddress)
			t.Creator = common.HexToAddress(creator)
			t.MintTxHash = common.HexToHash(mintTxHash)

			var ok bool
			t.TokenId, ok = big.NewInt(0).SetString(tokenId, 10)
			if !ok {
				return fmt.Errorf("failed to parse big int: %s", tokenId)
			}

			*res = append(*res, t)
		}
		return rows.Err()
	}(&res, query)
	if err != nil {
		return nil, err
	}

	for _, r := range res {
		metadata, err := p.GetMetadata(ctx, tx, r.CollectionAddress, r.TokenId)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				log.Printf("couldn't get metadata for token with collection address: %s, tokenId: %s", r.CollectionAddress, r.TokenId.String())
				metadata = domain.NewPlaceholderMetadata()
			}
			return nil, err
		}
		r.Metadata = metadata
	}
	return res, nil
}

func (p *postgres) GetTokensByAddressTotal(
	ctx context.Context,
	tx pgx.Tx,
	ownerAddress common.Address,
) (uint64, error) {
	// language=PostgreSQL
	query := `
		SELECT COUNT(*) AS total
		FROM tokens t
		INNER JOIN collections c ON c.address = t.collection_address
		WHERE t.owner=$1
	`
	var total uint64
	row := tx.QueryRow(ctx, query, strings.ToLower(ownerAddress.String()))
	if err := row.Scan(&total); err != nil {
		return 0, err
	}

	return total, nil
}

func (p *postgres) GetToken(
	ctx context.Context,
	tx pgx.Tx,
	contractAddress common.Address,
	tokenId *big.Int,
) (*domain.Token, error) {
	// language=PostgreSQL
	query := `
		SELECT 
		    t.owner, t.meta_uri, t.creator, t.royalty, t.mint_transaction_timestamp, t.mint_transaction_hash,
		    c.name
		FROM tokens t
		INNER JOIN collections c ON t.collection_address = c.address
		WHERE t.collection_address=$1 
		  AND t.token_id=$2
		`
	row := tx.QueryRow(ctx, query,
		strings.ToLower(contractAddress.String()),
		tokenId.String(),
	)

	t := &domain.Token{}
	var owner, creator, mintTxHash string

	err := row.Scan(
		&owner,
		&t.MetaUri,
		&creator,
		&t.Royalty,
		&t.MintTxTimestamp,
		&mintTxHash,
		&t.CollectionName,
	)
	if err != nil {
		return nil, err
	}

	t.CollectionAddress = contractAddress
	t.TokenId = tokenId
	t.Owner = common.HexToAddress(owner)
	t.Creator = common.HexToAddress(creator)
	t.MintTxHash = common.HexToHash(mintTxHash)

	metadata, err := p.GetMetadata(ctx, tx, t.CollectionAddress, t.TokenId)
	if err != nil {
		return nil, err
	}
	t.Metadata = metadata

	return t, nil
}

func (p *postgres) InsertToken(ctx context.Context, tx pgx.Tx, token *domain.Token) error {
	// language=PostgreSQL
	query := `
		INSERT INTO tokens (
		    collection_address, token_id, owner, meta_uri, creator, royalty, mint_transaction_timestamp, mint_transaction_hash
		)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8) 
		ON CONFLICT ON CONSTRAINT tokens_pkey DO NOTHING
	`
	_, err := tx.Exec(ctx, query,
		strings.ToLower(token.CollectionAddress.String()),
		token.TokenId.String(),
		strings.ToLower(token.Owner.String()),
		token.MetaUri,
		strings.ToLower(token.Creator.String()),
		token.Royalty,
		token.MintTxTimestamp,
		strings.ToLower(token.MintTxHash.Hex()),
	)
	if err != nil {
		return err
	}

	if err := p.InsertMetadata(ctx, tx, token.Metadata, token.CollectionAddress, token.TokenId); err != nil {
		return err
	}

	return nil
}

func (p *postgres) UpdateToken(ctx context.Context, tx pgx.Tx, token *domain.Token) error {
	// language=PostgreSQL
	if _, err := tx.Exec(ctx, `UPDATE tokens SET owner=$1,meta_uri=$2 WHERE collection_address=$3 AND token_id=$4`,
		strings.ToLower(token.Owner.String()), token.MetaUri,
		strings.ToLower(token.CollectionAddress.String()), token.TokenId.String()); err != nil {
		return err
	}
	return nil
}

func (p *postgres) GetMetadata(
	ctx context.Context,
	tx pgx.Tx,
	contractAddress common.Address,
	tokenId *big.Int,
) (*domain.TokenMetadata, error) {
	metadataQuery := `
		SELECT 
		    tm.id, tm.name, tm.description, tm.image, tm.external_link, tm.hidden_file, tm.license, tm.license_url,
			hfm.name, hfm.type, hfm.size
		FROM token_metadata tm
		LEFT JOIN hidden_file_metadata hfm 
		    ON tm.collection_address = hfm.collection_address AND tm.token_id = hfm.token_id
		WHERE tm.collection_address=$1 AND tm.token_id=$2
	`
	var md domain.TokenMetadata
	var hf domain.HiddenFileMetadata
	err := tx.QueryRow(ctx, metadataQuery,
		strings.ToLower(contractAddress.String()),
		tokenId.String(),
	).Scan(
		&md.Id,
		&md.Name,
		&md.Description,
		&md.Image,
		&md.ExternalLink,
		&md.HiddenFile,
		&md.License,
		&md.LicenseUrl,
		&hf.Name,
		&hf.Type,
		&hf.Size,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to query metadata: %w", err)
	}

	md.HiddenFileMeta = &hf

	propertiesQuery := `
		SELECT trait_type, display_type, value, max_value, min_value, property_type
		FROM token_metadata_properties
		WHERE metadata_id=$1
	`
	err = func(md *domain.TokenMetadata, query string) error {
		rows, err := tx.Query(ctx, query, md.Id)
		if err != nil {
			return fmt.Errorf("failed to query properties: %w", err)
		}
		defer rows.Close()

		for rows.Next() {
			var prop domain.MetadataProperty
			var propType string

			if err := rows.Scan(
				&prop.TraitType,
				&prop.DisplayType,
				&prop.Value,
				&prop.MaxValue,
				&prop.MinValue,
				&propType,
			); err != nil {
				return err
			}

			switch propType {
			case "property":
				md.Properties = append(md.Properties, &prop)
			case "ranking":
				md.Rankings = append(md.Rankings, &prop)
			case "stat":
				md.Stats = append(md.Stats, &prop)
			}
		}
		return rows.Err()
	}(&md, propertiesQuery)
	if err != nil {
		return nil, err
	}

	// Getting Trait counts
	for _, prop := range md.Properties {
		traitCountByValue, traitTotal, err := p.GetTraitCount(ctx, tx, prop.TraitType, prop.Value)
		if err != nil {
			return nil, err
		}
		prop.TraitTotal = traitTotal
		prop.TraitValueCount = traitCountByValue
	}

	tagsQuery := `
		SELECT tag
		FROM token_metadata_tags
		WHERE metadata_id=$1
	`
	err = func(md *domain.TokenMetadata, query string) error {
		rows, err := tx.Query(ctx, tagsQuery, md.Id)
		if err != nil {
			return err
		}
		defer rows.Close()

		for rows.Next() {
			var tag string
			if err := rows.Scan(&tag); err != nil {
				return err
			}
			md.Tags = append(md.Tags, tag)
		}

		return rows.Err()
	}(&md, tagsQuery)
	if err != nil {
		return nil, err
	}

	categoriesQuery := `
		SELECT category
		FROM token_metadata_categories
		WHERE metadata_id=$1
	`
	err = func(md *domain.TokenMetadata, query string) error {
		rows, err := tx.Query(ctx, categoriesQuery, md.Id)
		if err != nil {
			return err
		}
		defer rows.Close()

		for rows.Next() {
			var category string
			if err := rows.Scan(&category); err != nil {
				return err
			}
			md.Categories = append(md.Categories, category)
		}
		return rows.Err()
	}(&md, categoriesQuery)
	if err != nil {
		return nil, err
	}

	subcategoriesQuery := `
		SELECT subcategory
		FROM token_metadata_subcategories
		WHERE metadata_id=$1
	`
	err = func(md *domain.TokenMetadata, query string) error {
		rows, err := tx.Query(ctx, subcategoriesQuery, md.Id)
		if err != nil {
			return err
		}
		defer rows.Close()

		for rows.Next() {
			var subcategory string
			if err := rows.Scan(&subcategory); err != nil {
				return err
			}
			md.Subcategories = append(md.Subcategories, subcategory)
		}
		return rows.Err()
	}(&md, subcategoriesQuery)
	if err != nil {
		return nil, err
	}

	return &md, nil
}

func (p *postgres) InsertMetadata(
	ctx context.Context,
	tx pgx.Tx,
	metadata *domain.TokenMetadata,
	collectionAddress common.Address,
	tokenId *big.Int,
) error {
	if metadata == nil {
		return errors.New("metadata is nil")
	}

	if metadata.HiddenFileMeta == nil {
		return errors.New("hiddenFileMeta is nil")
	}

	// FIXME: too many separate INSERT statements. Use query builder later
	tokenQuery := `
		INSERT INTO token_metadata (
			id, collection_address, token_id, name, description, 
		    image, hidden_file, license, license_url, external_link
		)
		VALUES (DEFAULT,$1,$2,$3,$4,$5,$6,$7,$8,$9)  
		ON CONFLICT ON CONSTRAINT token_metadata_pkey DO NOTHING 
		RETURNING id
	`

	var metadataId int64
	err := tx.QueryRow(ctx, tokenQuery,
		strings.ToLower(collectionAddress.String()),
		tokenId.String(),
		metadata.Name,
		metadata.Description,
		metadata.Image,
		metadata.HiddenFile,
		metadata.License,
		metadata.LicenseUrl,
		metadata.ExternalLink,
	).Scan(&metadataId)
	if err != nil {
		return err
	}

	hiddenFileMetadataQuery := `
		INSERT INTO hidden_file_metadata (
			collection_address, token_id, name, type, size
		)
		VALUES ($1,$2,$3,$4,$5)  
	`
	_, err = tx.Exec(ctx, hiddenFileMetadataQuery,
		strings.ToLower(collectionAddress.String()),
		tokenId.String(),
		metadata.HiddenFileMeta.Name,
		metadata.HiddenFileMeta.Type,
		metadata.HiddenFileMeta.Size,
	)
	if err != nil {
		return err
	}

	propertiesQuery := `
		INSERT INTO token_metadata_properties (
		    metadata_id, trait_type, display_type, value, max_value, min_value, property_type
		)
		VALUES ($1,$2,$3,$4,$5,$6,$7)  
	`
	for _, attr := range metadata.Properties {
		_, err := tx.Exec(ctx, propertiesQuery,
			metadataId,
			attr.TraitType,
			attr.DisplayType,
			attr.Value,
			"",
			"",
			"property",
		)
		if err != nil {
			return err
		}
	}

	for _, stat := range metadata.Stats {
		_, err := tx.Exec(ctx, propertiesQuery,
			metadataId,
			stat.TraitType,
			stat.DisplayType,
			stat.Value,
			stat.MaxValue,
			stat.MinValue,
			"stat",
		)
		if err != nil {
			return err
		}
	}

	for _, ranking := range metadata.Rankings {
		_, err := tx.Exec(ctx, propertiesQuery,
			metadataId,
			ranking.TraitType,
			ranking.DisplayType,
			ranking.Value,
			ranking.MaxValue,
			ranking.MinValue,
			"ranking",
		)
		if err != nil {
			return err
		}
	}

	tagsQuery := `
		INSERT INTO token_metadata_tags (metadata_id, tag)
		VALUES ($1, $2)
	`
	for _, tag := range metadata.Tags {
		_, err := tx.Exec(ctx, tagsQuery, metadataId, tag)
		if err != nil {
			return err
		}
	}

	categoriesQuery := `
		INSERT INTO token_metadata_categories (metadata_id, category)
		VALUES ($1, $2)
	`
	for _, category := range metadata.Categories {
		_, err := tx.Exec(ctx, categoriesQuery, metadataId, category)
		if err != nil {
			return err
		}
	}

	subcategoriesQuery := `
		INSERT INTO token_metadata_subcategories (metadata_id, subcategory)
		VALUES ($1, $2)
	`
	for _, subcategory := range metadata.Subcategories {
		_, err := tx.Exec(ctx, subcategoriesQuery, metadataId, subcategory)
		if err != nil {
			return err
		}
	}

	return nil
}

// GetTraitCount works on trigger `trigger_update_metadata_trait_count`.
// See migration `20230502210950_metadata_trait_count.sql`.
func (p *postgres) GetTraitCount(
	ctx context.Context,
	tx pgx.Tx,
	traitType string,
	value string,
) (int64, int64, error) {
	query := `
		SELECT
			t1.count,
			t2.total_count
		FROM public.metadata_trait_count t1
		JOIN (SELECT
				 trait_type,
				 SUM(count) AS total_count
			 FROM public.metadata_trait_count
			 WHERE trait_type = $1
			 GROUP BY trait_type
			 ) t2 ON t1.trait_type = t2.trait_type
		WHERE t1.trait_type=$1 AND t1.value=$2
	`
	row := tx.QueryRow(ctx, query, traitType, value)

	var countByValue, total int64
	if err := row.Scan(&countByValue, &total); err != nil {
		return 0, 0, err
	}

	return countByValue, total, nil
}
