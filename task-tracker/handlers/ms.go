package handlers

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"regexp"
	"strconv"
	"strings"
	"taskTracker/sheets"
	"time"
)

var (
	ErrInvalidFormat           = errors.New("invalid format")
	MSHandlerErrWrongArguments = errors.New("wrong number of arguments")
)

type (
	CmdHandler interface {
		GetCmd() string
		Handle(...string) error
	}

	MSHandler struct {
		cmd      string
		db       *sql.DB
		sheets   *sheets.Service
		urlRegex *regexp.Regexp
	}

	MSArgs struct {
		sheetId           string
		sheetName         string
		readColumnLetter  string
		writeColumnLetter string
	}
)

// NewMSHandler
// Day, Month, Year - are used for result idempotence (if someone try to use same sheet twice, second
// time result will not be all "no's"). We check addresses where date in sheet name is smaller than the presented one.
// Day and month comes from sheet name (ex. "25.11"), year was added so 1.1 is not smaller, then 25.11;
func NewMSHandler(ctx context.Context, cmd string, db *sql.DB, credentialsFile string) *MSHandler {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS addresses (
			address TEXT PRIMARY KEY,
			day SMALLINT,
			month SMALLINT,
			year SMALLINT
		);
`)
	if err != nil {
		log.Fatal(err)
	}

	service, err := sheets.New(ctx, credentialsFile)
	if err != nil {
		log.Fatalf("Unable to retrieve Sheets client: %v", err)
	}

	return &MSHandler{
		cmd:      cmd,
		db:       db,
		sheets:   service,
		urlRegex: regexp.MustCompile(`https://docs.google.com/spreadsheets/d/[^\s]+`),
	}
}

func (h *MSHandler) Handle(args ...string) error {
	msArgs, err := h.validateArgs(args...)
	if err != nil {
		return err
	}

	column, err := h.sheets.GetColumn(msArgs.sheetId, msArgs.sheetName, msArgs.readColumnLetter)
	if err != nil {
		return fmt.Errorf("unable to retrieve data from sheet: %v", err)
	}

	addressSlice := make([]string, 0, len(column.Rows))
	addressMap := make(map[string]int)
	for _, r := range column.Rows {
		val := strings.ToLower(r.Val)
		addressMap[val] = r.Num
		addressSlice = append(addressSlice, val)
	}

	sheetNameParts := strings.Split(msArgs.sheetName, ".")
	if len(sheetNameParts) != 2 {
		return fmt.Errorf("wrong sheet name format: %s", msArgs.sheetName)
	}
	day64, err := strconv.ParseInt(sheetNameParts[0], 10, 64)
	if err != nil {
		return fmt.Errorf("failed to parse day: %s", msArgs.sheetName)
	}
	month64, err := strconv.ParseInt(sheetNameParts[1], 10, 64)
	if err != nil {
		return fmt.Errorf("failed to parse month: %s", msArgs.sheetName)
	}
	day := int(day64)
	month := int(month64)
	year := time.Now().Year()
	if month == 12 && time.Now().Month() == 1 {
		year -= 1
	}

	dbAddresses, err := h.findAddressesDifference(addressSlice, day, month, year)
	if err != nil {
		return fmt.Errorf("failed to find addresses: %w", err)
	}

	// Update sheet
	updateValues := make([][]any, len(column.Rows))
	for _, addr := range dbAddresses {
		updateValues[addressMap[addr]] = []any{"yes"}
	}

	for i := range updateValues {
		if updateValues[i] == nil {
			updateValues[i] = []any{"no"}
		}
	}

	vRange := fmt.Sprintf("%s2:%s%d", msArgs.writeColumnLetter, msArgs.writeColumnLetter, len(updateValues)+1)
	err = h.sheets.UpdateRows(msArgs.sheetId, msArgs.sheetName, vRange, updateValues)
	if err != nil {
		return fmt.Errorf("failed to update values: %w", err)
	}

	// Insert new addresses
	if err := h.insertAddresses(dbAddresses, day, month, year); err != nil {
		return err
	}

	return nil
}

func (h *MSHandler) GetCmd() string {
	return h.cmd
}

// link name A E
func (h *MSHandler) validateArgs(args ...string) (*MSArgs, error) {
	if len(args) != 4 {
		return nil, MSHandlerErrWrongArguments
	}

	link := args[0]
	if !h.urlRegex.MatchString(link) {
		return nil, ErrInvalidFormat
	}

	linkWithoutPrefix := strings.TrimPrefix(link, "https://docs.google.com/spreadsheets/d/")
	linkSplit := strings.Split(linkWithoutPrefix, "/")
	if len(linkSplit) < 0 {
		return nil, fmt.Errorf("invalid link format: %s", link)
	}

	sheetName := args[1]
	readLetter := args[2]
	writeLetter := args[3]
	if len(readLetter) != 1 || len(writeLetter) != 1 {
		return nil, ErrInvalidFormat
	}
	if (readLetter[0] < 'A' && readLetter[0] > 'Z') ||
		(writeLetter[0] < 'A' && writeLetter[0] > 'Z') {
		return nil, ErrInvalidFormat
	}

	return &MSArgs{
		sheetId:           linkSplit[0],
		sheetName:         sheetName,
		readColumnLetter:  readLetter,
		writeColumnLetter: writeLetter,
	}, nil
}

func (h *MSHandler) findAddressesDifference(addresses []string, day, month, year int) ([]string, error) {
	placeholders := strings.Repeat("(?),", len(addresses))
	placeholders = strings.TrimSuffix(placeholders, ",")
	fakeTimestamp := day + month*31 + year*365
	queryTemplate := `
		WITH input_addresses(arg_addr) AS (
			VALUES
				%s
		)
		SELECT arg_addr
		FROM input_addresses
		WHERE arg_addr NOT IN (
			SELECT address
			FROM addresses
			WHERE day + month * 31 + year * 365 < ?
		)
	`
	query := fmt.Sprintf(queryTemplate, placeholders)

	args := make([]interface{}, len(addresses)+1)
	for i, addr := range addresses {
		args[i] = addr
	}
	args[len(addresses)] = fakeTimestamp

	rows, err := h.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var newAddresses []string
	for rows.Next() {
		var addr string
		if err := rows.Scan(&addr); err != nil {
			return nil, err
		}
		newAddresses = append(newAddresses, addr)
	}

	return newAddresses, nil
}

func (h *MSHandler) insertAddresses(addresses []string, day, month, year int) error {
	tx, err := h.db.Begin()
	if err != nil {
		return err
	}

	stmt, err := tx.Prepare("INSERT OR IGNORE INTO addresses (address, day, month, year) VALUES (?, ?, ?, ?)")
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, addr := range addresses {
		_, err = stmt.Exec(addr, day, month, year)
		if err != nil {
			tx.Rollback()
			return err
		}
	}

	return tx.Commit()
}
