package repository

import (
	"context"
	"errors"
	"github.com/ethereum/go-ethereum/common"
	"github.com/jackc/pgx/v4"
	"github.com/mark3d-xyz/mark3d/authserver/internal/domain"
	"strings"
	"time"
)

var (
	ErrProfileNotUniqueEmail    = Error{"email is not unique"}
	ErrProfileNotUniqueDiscord  = Error{"discord is not unique"}
	ErrProfileNotUniqueTwitter  = Error{"twitter is not unique"}
	ErrProfileNotUniqueUsername = Error{"username is not unique"}
	ErrProfileNotUniqueProfile  = Error{"profile for this address already exists"}
)

func (p *postgres) GetUserProfile(ctx context.Context, tx pgx.Tx, address common.Address) (*domain.UserProfile, error) {
	// language=PostgreSQL
	query := `
		SELECT name, username, bio, website_url, twitter, email, discord, avatar_url, banner_url,
		       is_email_notifications_enabled, is_push_notifications_enabled
		FROM user_profiles
		WHERE address = $1
	`

	profile := domain.UserProfile{
		Address: address,
	}

	var email, twitter, discord *string
	if err := tx.QueryRow(ctx, query,
		strings.ToLower(address.String()),
	).Scan(
		&profile.Name,
		&profile.Username,
		&profile.Bio,
		&profile.WebsiteURL,
		&twitter,
		&email,
		&discord,
		&profile.AvatarURL,
		&profile.BannerURL,
		&profile.IsEmailNotificationsEnabled,
		&profile.IsPushNotificationsEnabled,
	); err != nil {
		return nil, err
	}

	if email != nil {
		profile.Email = *email
	}
	if twitter != nil {
		profile.Twitter = *twitter
	}
	if discord != nil {
		profile.Discord = *discord
	}

	return &profile, nil
}

func (p *postgres) GetUserProfileByUsername(ctx context.Context, tx pgx.Tx, username string) (*domain.UserProfile, error) {
	// language=PostgreSQL
	query := `
		SELECT address, name, username, bio, website_url, twitter, discord, email, avatar_url, banner_url, 
		       is_email_notifications_enabled, is_push_notifications_enabled
		FROM user_profiles
		WHERE username = $1
	`

	var profile domain.UserProfile
	var address string
	var email, twitter, discord *string
	if err := tx.QueryRow(ctx, query,
		strings.ToLower(username),
	).Scan(
		&address,
		&profile.Name,
		&profile.Username,
		&profile.Bio,
		&profile.WebsiteURL,
		&twitter,
		&discord,
		&email,
		&profile.AvatarURL,
		&profile.BannerURL,
		&profile.IsEmailNotificationsEnabled,
		&profile.IsPushNotificationsEnabled,
	); err != nil {
		return nil, err
	}

	profile.Address = common.HexToAddress(address)

	if email != nil {
		profile.Email = *email
	}
	if twitter != nil {
		profile.Twitter = *twitter
	}
	if discord != nil {
		profile.Discord = *discord
	}

	return &profile, nil
}

func (p *postgres) InsertUserProfile(ctx context.Context, tx pgx.Tx, profile *domain.UserProfile) error {
	// language=PostgreSQL
	query := `
		INSERT INTO user_profiles(
			address, name, username, bio, website_url, avatar_url, banner_url, email, twitter, discord,
		    is_email_notifications_enabled, is_push_notifications_enabled)
		VALUES ($1,$2,$3,$4,$5,$6,$7,NULL,NULL,NULL,$8,$9)
	`
	if _, err := tx.Exec(ctx, query,
		strings.ToLower(profile.Address.String()),
		profile.Name,
		strings.ToLower(profile.Username),
		profile.Bio,
		profile.WebsiteURL,
		profile.AvatarURL,
		profile.BannerURL,
		profile.IsEmailNotificationsEnabled,
		profile.IsPushNotificationsEnabled,
	); err != nil {
		return resolveUserProfileDBErr(err)
	}

	return nil
}

func (p *postgres) UpdateUserProfile(ctx context.Context, tx pgx.Tx, profile *domain.UserProfile) error {
	// language=PostgreSQL
	query := `
		UPDATE user_profiles 
		SET name=$1, username=$2, bio=$3, website_url=$4, avatar_url=$5, banner_url=$6, 
		    is_email_notifications_enabled=$7, is_push_notifications_enabled=$8
		WHERE address=$9
	`
	if _, err := tx.Exec(ctx, query,
		profile.Name,
		strings.ToLower(profile.Username),
		profile.Bio,
		profile.WebsiteURL,
		profile.AvatarURL,
		profile.BannerURL,
		profile.IsEmailNotificationsEnabled,
		profile.IsPushNotificationsEnabled,
		strings.ToLower(profile.Address.String()),
	); err != nil {
		return resolveUserProfileDBErr(err)
	}

	return nil
}

func (p *postgres) UpdateUserProfileEmail(ctx context.Context, tx pgx.Tx, email string, address common.Address) error {
	// language=PostgreSQL
	query := `
		UPDATE user_profiles 
		SET email=$1
		WHERE address=$2
	`
	if _, err := tx.Exec(ctx, query,
		strings.ToLower(email),
		strings.ToLower(address.String()),
	); err != nil {
		return resolveUserProfileDBErr(err)
	}

	return nil
}

func (p *postgres) UpdateUserProfileTwitter(ctx context.Context, tx pgx.Tx, twitter string, address common.Address) error {
	// language=PostgreSQL
	query := `
		UPDATE user_profiles 
		SET twitter=$1
		WHERE address=$2
	`
	if _, err := tx.Exec(ctx, query,
		twitter,
		strings.ToLower(address.String()),
	); err != nil {
		return resolveUserProfileDBErr(err)
	}

	return nil
}

func (p *postgres) GetEmailVerificationToken(
	ctx context.Context,
	tx pgx.Tx,
	token string,
) (*domain.EmailVerificationToken, error) {
	// language=PostgreSQL
	query := `
		SELECT address, email, token, created_at
		FROM email_verification_tokens
		WHERE token=$1
	`
	var verificationToken domain.EmailVerificationToken
	var address string
	var createdAt int64
	if err := tx.QueryRow(ctx, query,
		token,
	).Scan(
		&address,
		&verificationToken.Email,
		&verificationToken.Token,
		&createdAt,
	); err != nil {
		return nil, err
	}

	verificationToken.Address = common.HexToAddress(address)
	verificationToken.CreatedAt = time.UnixMilli(createdAt)
	return &verificationToken, nil
}

func (p *postgres) InsertEmailVerificationToken(
	ctx context.Context,
	tx pgx.Tx,
	token *domain.EmailVerificationToken,
) error {
	// language=PostgreSQL
	query := `
		INSERT INTO email_verification_tokens(address, email, token, created_at)
		VALUES ($1,$2,$3,$4)
	`
	_, err := tx.Exec(ctx, query,
		strings.ToLower(token.Address.String()),
		strings.ToLower(token.Email),
		token.Token,
		token.CreatedAt.UnixMilli(),
	)

	return err
}

func (p *postgres) DeleteAllEmailVerificationTokens(
	ctx context.Context,
	tx pgx.Tx,
	address common.Address,
) error {
	// language=PostgreSQL
	query := `
		DELETE FROM email_verification_tokens
		WHERE address=$1
	`
	_, err := tx.Exec(ctx, query,
		strings.ToLower(address.String()),
	)

	return err
}

func resolveUserProfileDBErr(err error) error {
	if err == nil {
		return nil
	}

	if strings.Contains(err.Error(), "user_profiles_email_key") {
		return ErrProfileNotUniqueEmail
	} else if strings.Contains(err.Error(), "user_profiles_username_key") {
		return ErrProfileNotUniqueUsername
	} else if strings.Contains(err.Error(), "user_profiles_twitter_key") {
		return ErrProfileNotUniqueTwitter
	} else if strings.Contains(err.Error(), "user_profiles_discord_key") {
		return ErrProfileNotUniqueDiscord
	} else if strings.Contains(err.Error(), "user_profiles_pkey") {
		return ErrProfileNotUniqueProfile
	} else if errors.Is(err, pgx.ErrNoRows) {
		return ErrNoRows
	}

	return err
}