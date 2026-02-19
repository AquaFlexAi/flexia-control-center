#!/bin/bash
set -e
export MSYS_NO_PATHCONV=1

# FlexAI Secure Proxy Certificate Generator
# Usage: ./generate-certs.sh <PASSWORD>

PASSWORD=${1:-flexia_secure}
DAYS=3650
CLIENT_CN=${CLIENT_CN:-flexia-control-center}

mkdir -p certs
cd certs

# Create minimal OpenSSL config to avoid "can't open config" errors on Windows
echo "[ req ]
distinguished_name = req_distinguished_name
x509_extensions = v3_ca
[ req_distinguished_name ]
[ v3_ca ]
basicConstraints = critical,CA:TRUE
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always,issuer
" > openssl.cnf
export OPENSSL_CONF="./openssl.cnf"

echo "Generating CA..."
openssl genrsa -aes256 -passout pass:$PASSWORD -out ca-key.pem 4096
# IMPORANT: Must use -extensions v3_ca to get Basic Constraints: CA:TRUE
openssl req -new -x509 -days $DAYS -passin pass:$PASSWORD -key ca-key.pem -sha256 -out ca.pem -subj "/CN=FlexAI-CA" -extensions v3_ca -config openssl.cnf

echo "Generating Server Keys..."
openssl genrsa -out server-key.pem 4096
openssl req -subj "/CN=docker-server" -sha256 -new -key server-key.pem -out server.csr

# Adjust for IP if needed, using localhost for now
SAN_IP=${SAN_IP:-192.168.11.222}
SAN_DNS=${SAN_DNS:-flshbm.org}
echo "subjectAltName = DNS:localhost,IP:127.0.0.1,IP:${SAN_IP},DNS:${SAN_DNS}" > extfile.cnf
openssl x509 -req -days $DAYS -sha256 -in server.csr -CA ca.pem -CAkey ca-key.pem \
  -passin pass:$PASSWORD -CAcreateserial -out server-cert.pem -extfile extfile.cnf

echo "Generating Client Keys..."
openssl genrsa -out client-key.pem 4096
openssl req -subj "/CN=${CLIENT_CN}" -new -key client-key.pem -out client.csr
echo "extendedKeyUsage = clientAuth" > extfile-client.cnf
openssl x509 -req -days $DAYS -sha256 -in client.csr -CA ca.pem -CAkey ca-key.pem \
  -passin pass:$PASSWORD -CAcreateserial -out client-cert.pem -extfile extfile-client.cnf

# Create copies for standard Docker CLI / Library expectations (cert.pem/key.pem)
cp client-cert.pem cert.pem
cp client-key.pem key.pem

rm -v server.csr client.csr extfile.cnf extfile-client.cnf

echo "Done! Certificates generated in docker/secure-proxy/certs/"
