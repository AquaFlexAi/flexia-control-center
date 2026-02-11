#!/bin/bash
set -e

# FlexAI Secure Proxy Certificate Generator
# Usage: ./generate-certs.sh <PASSWORD>

PASSWORD=${1:-flexia_secure}
DAYS=3650

mkdir -p certs
cd certs

echo "Generating CA..."
openssl genrsa -aes256 -passout pass:$PASSWORD -out ca-key.pem 4096
openssl req -new -x509 -days $DAYS -passin pass:$PASSWORD -key ca-key.pem -sha256 -out ca.pem -subj "/CN=FlexAI-CA"

echo "Generating Server Keys..."
openssl genrsa -out server-key.pem 4096
openssl req -subj "/CN=docker-server" -sha256 -new -key server-key.pem -out server.csr

# Adjust for IP if needed, using localhost for now
echo "subjectAltName = DNS:localhost,IP:127.0.0.1" > extfile.cnf
openssl x509 -req -days $DAYS -sha256 -in server.csr -CA ca.pem -CAkey ca-key.pem \
  -passin pass:$PASSWORD -CAcreateserial -out server-cert.pem -extfile extfile.cnf

echo "Generating Client Keys..."
openssl genrsa -out client-key.pem 4096
openssl req -subj "/CN=flexia-control-center" -new -key client-key.pem -out client.csr
echo "extendedKeyUsage = clientAuth" > extfile-client.cnf
openssl x509 -req -days $DAYS -sha256 -in client.csr -CA ca.pem -CAkey ca-key.pem \
  -passin pass:$PASSWORD -CAcreateserial -out client-cert.pem -extfile extfile-client.cnf

rm -v server.csr client.csr extfile.cnf extfile-client.cnf

echo "Done! Certificates generated in docker/secure-proxy/certs/"
