package domain

import (
	"fmt"
	"github.com/ethereum/go-ethereum/common"
	"github.com/mark3d-xyz/mark3d/authserver/internal/utils"
	"github.com/mark3d-xyz/mark3d/authserver/pkg/validator"
	authserver_pb "github.com/mark3d-xyz/mark3d/authserver/proto"
	"strings"
)

type UserProfile struct {
	Address                     common.Address `json:"address"`
	AvatarURL                   string         `json:"avatarUrl"`
	BannerURL                   string         `json:"bannerUrl"`
	Bio                         string         `json:"bio"`
	Email                       string         `json:"email"`
	IsEmailConfirmed            bool           `json:"isEmailConfirmed"`
	IsEmailNotificationsEnabled bool           `json:"isEmailNotificationsEnabled"`
	IsPushNotificationsEnabled  bool           `json:"isPushNotificationsEnabled"`
	Name                        string         `json:"name"`
	Username                    string         `json:"username"`
	WebsiteURL                  string         `json:"websiteUrl"`
	Twitter                     *string        `json:"twitter"`
	Discord                     *string        `json:"discord"`
	Telegram                    *string        `json:"telegram"`
}

func (p *UserProfile) ToGRPC() *authserver_pb.UserProfile {
	if p == nil {
		return nil
	}

	return &authserver_pb.UserProfile{
		Address:                    strings.ToLower(p.Address.String()),
		AvatarURL:                  p.AvatarURL,
		BannerURL:                  p.BannerURL,
		Bio:                        p.Bio,
		Name:                       p.Name,
		Username:                   p.Username,
		WebsiteURL:                 p.WebsiteURL,
		Email:                      p.Email,
		IsEmailNotificationEnabled: p.IsEmailNotificationsEnabled,
		IsPushNotificationEnabled:  p.IsPushNotificationsEnabled,
		Twitter:                    utils.UnwrapString(p.Twitter),
		Discord:                    utils.UnwrapString(p.Discord),
		Telegram:                   utils.UnwrapString(p.Telegram),
	}
}

func (p *UserProfile) Validate() error {
	errs := make([]error, 0)

	if err := validator.ValidateUsername(&p.Username); err != nil {
		errs = append(errs, err)
	}

	if err := validator.ValidateLength(p.Name, 3, 32, "name"); err != nil {
		errs = append(errs, err)
	}

	if err := validator.ValidateIPFSUrl(p.BannerURL, "bannerUrl"); err != nil {
		errs = append(errs, err)
	}

	if err := validator.ValidateIPFSUrl(p.AvatarURL, "avatarUrl"); err != nil {
		errs = append(errs, err)
	}

	if err := validator.ValidateLength(p.Bio, 0, 1000, "bio"); err != nil {
		errs = append(errs, err)
	}

	if err := validator.ValidateUrl(p.WebsiteURL, "websiteUrl"); err != nil {
		errs = append(errs, err)
	}

	if len(errs) > 0 {
		return validator.CompositeError(errs...)
	}
	return nil
}

// ValidateForUpdate skips zero values
func (p *UserProfile) ValidateForUpdate() error {
	errs := make([]error, 0)

	err := validator.ValidateUsername(&p.Username)
	if p.Username != "" && err != nil {
		errs = append(errs, err)
	}

	err = validator.ValidateLength(p.Name, 3, 32, "name")
	if p.Name != "" && err != nil {
		errs = append(errs, err)
	}

	err = validator.ValidateIPFSUrl(p.BannerURL, "bannerUrl")
	if p.BannerURL != "" && err != nil {
		errs = append(errs, err)
	}

	err = validator.ValidateIPFSUrl(p.AvatarURL, "avatarUrl")
	if p.AvatarURL != "" && err != nil {
		errs = append(errs, err)
	}

	err = validator.ValidateLength(p.Bio, 0, 1000, "bio")
	if p.Bio != "" && err != nil {
		errs = append(errs, err)
	}

	err = validator.ValidateUrl(p.WebsiteURL, "websiteUrl")
	if p.WebsiteURL != "" && err != nil {
		errs = append(errs, err)
	}

	if len(errs) > 0 {
		return validator.CompositeError(errs...)
	}
	return nil
}

func (p *UserProfile) HidePrivateFields() {
	p.Email = ""
	p.IsPushNotificationsEnabled = false
	p.IsEmailNotificationsEnabled = false
	p.IsEmailConfirmed = false
}

func GetDefaultUserProfile(address common.Address) *UserProfile {
	addressStr := strings.ToLower(address.String())
	addressLen := len(addressStr)

	return &UserProfile{
		Address:                     address,
		AvatarURL:                   "",
		BannerURL:                   "",
		Bio:                         "",
		Email:                       "",
		IsEmailNotificationsEnabled: false,
		IsPushNotificationsEnabled:  false,
		Name:                        fmt.Sprintf("%s..%s", addressStr[:8], addressStr[addressLen-6:]),
		Username:                    fmt.Sprintf("user_%s", addressStr[2:addressLen-13]),
		WebsiteURL:                  "",
		Twitter:                     nil,
		Discord:                     nil,
		Telegram:                    nil,
	}
}

type SetEmailRequest struct {
	Email string `json:"email"`
}

func (r *SetEmailRequest) Validate() error {
	if err := validator.ValidateRequiredString(&r.Email, "email"); err != nil {
		return err
	}

	if err := validator.ValidateEmail(r.Email); err != nil {
		return err
	}

	return nil
}

type SetEmailResponse struct {
	Token   string       `json:"token"`
	Email   string       `json:"email"`
	Profile *UserProfile `json:"profile"`
}
