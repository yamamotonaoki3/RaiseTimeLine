# Local development and CI only. Keep the existing MinIO release semantics.
# Upstream community source is unmaintained; this is not a security upgrade.
FROM golang:1.24.13-alpine3.22 AS build
RUN apk add --no-cache git ca-certificates
WORKDIR /src
# RELEASE.2025-04-22T22-12-26Z, pinned to the verified upstream commit.
RUN git init . \
 && git remote add origin https://github.com/minio/minio.git \
 && git fetch --depth=1 origin 0d7408fc9969caf07de6a8c3a84f9fbb10a6739e \
 && git checkout --detach FETCH_HEAD \
 && test "$(git rev-parse HEAD)" = "0d7408fc9969caf07de6a8c3a84f9fbb10a6739e"
ENV CGO_ENABLED=0 GOTOOLCHAIN=local GOPROXY=https://proxy.golang.org GOSUMDB=sum.golang.org
RUN go mod download && go mod verify \
 && go build -mod=readonly -trimpath -o /out/minio . \
 && /out/minio --version

FROM alpine:3.22.2
RUN apk add --no-cache ca-certificates
COPY --from=build /out/minio /usr/local/bin/minio
COPY --from=build /src/LICENSE /src/CREDITS /licenses/
EXPOSE 9000 9001
ENTRYPOINT ["minio"]
CMD ["server", "/data", "--console-address", ":9001"]
