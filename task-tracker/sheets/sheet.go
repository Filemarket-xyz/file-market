package sheets

import (
	"context"
	"fmt"
	"os"

	"golang.org/x/oauth2/google"
	"google.golang.org/api/option"
	"google.golang.org/api/sheets/v4"
)

type Row struct {
	Num int
	Val string
}

func (r *Row) String() string {
	return r.Val
}

type Column struct {
	Name string
	Rows []*Row
}

type Service struct {
	gApi *sheets.Service
}

func New(ctx context.Context, credFile string) (*Service, error) {
	data, err := os.ReadFile(credFile)
	if err != nil {
		return nil, err
	}
	config, err := google.JWTConfigFromJSON(data, sheets.SpreadsheetsScope)
	if err != nil {
		return nil, err
	}
	client := config.Client(ctx)
	srv, err := sheets.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return nil, err
	}

	return &Service{
		gApi: srv,
	}, nil
}

func (s *Service) GetColumn(sheetId, sheetName, columnLetter string) (*Column, error) {
	resp, err := s.gApi.Spreadsheets.Get(sheetId).Do()
	if err != nil {
		return nil, err
	}

	var column = &Column{
		Rows: make([]*Row, 0),
	}
	for _, sheet := range resp.Sheets {
		if sheet.Properties.Title == sheetName {
			readRange := fmt.Sprintf("%s!%s:%s", sheetName, columnLetter, columnLetter)
			resp, err := s.gApi.Spreadsheets.Values.Get(sheetId, readRange).Do()
			if err != nil {
				return nil, err
			}
			for i, row := range resp.Values {
				if len(row) > 0 {
					rowStr := row[0].(string)
					if i == 0 {
						column.Name = rowStr
						continue
					}
					column.Rows = append(column.Rows, &Row{
						Num: i - 1,
						Val: rowStr,
					})
				}
			}
			break
		}
	}

	return column, nil
}

func (s *Service) UpdateRows(sheetId, sheetName, vRange string, values [][]any) error {
	finalRange := fmt.Sprintf("%s!%s", sheetName, vRange)
	data := sheets.ValueRange{
		Range:  finalRange,
		Values: values,
	}

	updateCall := s.gApi.Spreadsheets.Values.Update(sheetId, finalRange, &data)
	updateCall.ValueInputOption("USER_ENTERED")

	if _, err := updateCall.Do(); err != nil {
		return err
	}

	return nil
}
