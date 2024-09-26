FROM golang:1.20
WORKDIR /app
COPY go.mod go.mod
COPY go.sum go.sum
RUN go mod download

COPY . .
RUN GOOS=linux GOARCH=amd64 CGO_ENABLED=1 go build -o main .
