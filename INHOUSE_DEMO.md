# In-House Demo Testing Guide

Use this setup when users are on the same office network or connected to the same company VPN/LAN.

The demo runs on one computer/server. Users open the Angular app from their own computers using the server IP address.

## What Users Open

Example server IP:

```text
192.168.1.50
```

Users open:

```text
http://192.168.1.50:4200
```

They do not need to open the backend URL directly.

## Start The Demo

Open two terminals in the project folder.

Terminal 1, start the backend:

```bash
npm run start:api
```

Terminal 2, start the frontend for network access:

```bash
npm start
```

`npm start` runs Angular with:

```text
--host 0.0.0.0 --proxy-config proxy.conf.json
```

That means users can open the frontend from another computer, and the frontend can call the backend through `/api`.

## Firewall

On the server computer, allow inbound access to:

```text
4200
5000
```

If Windows asks to allow Node.js, allow it on the company/private network.

## Demo Accounts

```text
requester@test.com / password123
endorser@test.com / password123
approver@test.com / password123
finance@test.com / password123
admin@test.com / password123
super@test.com / password123
```

## Test Flow

1. Login as Requester.
2. Create and submit a request.
3. Login as Endorser.
4. Endorse or return the request.
5. Login as Approver.
6. Approve the request.
7. Login as Finance.
8. Go to Disbursement > Finance Queue.
9. Start Processing.
10. Mark Processed.
11. Close Request.
12. Login as Requester and confirm the request is Closed.

## Demo Limitations

- Data resets when the backend restarts.
- Uploaded files are stored on the server computer only.
- This is not connected to SQL Server yet.
- Do not use real company data yet.
