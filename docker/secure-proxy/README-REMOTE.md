# FlexIA Secure Proxy for Remote Endpoints

This configuration allows you to deploy the FlexIA Secure Docker Proxy on any remote Docker endpoint (like a remote server or a developer laptop) so the FlexIA Control Center can manage it securely over mTLS.

## Deployment Steps

1. **Generate Certificates (On Control Center or secure machine)**:
   ```bash
   # Set SAN_IP to the public/VPN IP of the remote endpoint
   export SAN_IP=192.168.1.50
   export SAN_DNS=remote.local
   ./generate-certs.sh my_secure_password
   ```

2. **Copy Files to Remote Endpoint**:
   Copy the `certs/` directory, `.env`, and `docker-compose.standalone.yml` to the target laptop/server.

3. **Start the Proxy**:
   ```bash
   docker compose -f docker-compose.standalone.yml up -d
   ```

4. **Connect from Control Center**:
   - Go to **Infrastructure > Compute Nodes** in the Control Center.
   - Add a new Node.
   - Select **Protocol: TCP (mTLS)**.
   - Host: `<SAN_IP>`
   - Port: `2376`
   - Upload the `client-cert.pem`, `client-key.pem`, and `ca.pem` from the `certs` folder.
