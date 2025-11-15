# FAIR Voting Platform - Setup Guide

## Overview

FAIR is a blockchain-backed anonymous voting platform for hackathons and team-based competitions. This guide will help you set up and run the platform.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (12+)
- Brevo account (for email sending)
- Avalanche C-Chain Fuji testnet wallet (for blockchain transactions)

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

1. Create a PostgreSQL database:
```bash
psql -U postgres -c "CREATE DATABASE fair_db;"
```

2. Configure database connection in `.env.local`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fair_db
DB_USER=postgres
DB_PASSWORD=your_password_here
```

3. Run database migrations:
```bash
npm run migrate
```

### 3. Environment Configuration

Copy `env.example` to `.env.local` and configure:

**Generate JWT Secret:**
```bash
npm run generate-jwt-secret
```

This will generate a cryptographically secure random string. Copy it and add to your `.env.local`:

```env
# JWT Authentication
JWT_SECRET=<paste_generated_secret_here>
JWT_EXPIRES_IN=24h

# Brevo Email Service
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=FAIR Voting Platform

# Avalanche Blockchain
AVALANCHE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
AVALANCHE_WALLET_PRIVATE_KEY=your_wallet_private_key
AVALANCHE_EXPLORER_URL=https://testnet.snowtrace.io/tx

# Super Admin (change after first login!)
SUPER_ADMIN_EMAIL=admin@fair-voting.com
SUPER_ADMIN_PASSWORD=change_this_password_immediately
```

### 4. Initialize Super Admin

```bash
npm run init-super-admin
```

This creates the first super admin account from environment variables.

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage Guide

### Admin Workflow

1. **Login**: Navigate to `/admin/login` and sign in with your admin credentials
2. **Create Poll**: 
   - Click "Create New Poll"
   - Set poll name, start/end times, and visibility options
   - Save the poll
3. **Add Teams**: 
   - Go to poll management page
   - Add teams manually or bulk import
4. **Register Voters**:
   - Upload voter emails with their team assignments
   - System generates tokens and sends emails via Brevo
5. **Monitor Results**:
   - View vote tallies in real-time
   - See blockchain transaction hashes
   - Export results if needed

### Voter Workflow

1. **Receive Email**: Voter receives email with voting token and link
2. **Access Portal**: Click link or navigate to `/vote` and enter token
3. **Verify Team**: Enter team name if required by poll settings
4. **Cast Vote**: Select one team to vote for (cannot vote own team)
5. **Confirmation**: Receive transaction hash and explorer link

### Super Admin Workflow

1. **Login**: Use super admin credentials at `/admin/login`
2. **Platform Dashboard**: View all polls, admins, and activities
3. **Admin Management**: Create and manage admin accounts
4. **Audit Logs**: Review all platform activities
5. **Analytics**: View platform-wide statistics

## API Endpoints

### Admin Endpoints

- `POST /api/v1/admin/auth/login` - Admin login
- `GET /api/v1/admin/polls` - List polls
- `POST /api/v1/admin/polls` - Create poll
- `GET /api/v1/admin/polls/[pollId]` - Get poll details
- `PATCH /api/v1/admin/polls/[pollId]` - Update poll
- `DELETE /api/v1/admin/polls/[pollId]` - Delete poll
- `GET /api/v1/admin/polls/[pollId]/teams` - List teams
- `POST /api/v1/admin/polls/[pollId]/teams` - Create teams
- `GET /api/v1/admin/polls/[pollId]/voters` - List voters/tokens
- `POST /api/v1/admin/polls/[pollId]/voters` - Register voters

### Voting Endpoints

- `POST /api/v1/vote/validate` - Validate token and get teams
- `POST /api/v1/vote/submit` - Submit vote

### Results Endpoints

- `GET /api/v1/results/[pollId]` - Get poll results (public if enabled)

### Super Admin Endpoints

- `GET /api/v1/super-admin/dashboard` - Platform dashboard
- `GET /api/v1/super-admin/admins` - List all admins
- `POST /api/v1/super-admin/admins` - Create admin
- `GET /api/v1/super-admin/audit-logs` - View audit logs

## Security Features

- JWT-based authentication with role-based access control
- Single-use voting tokens
- Self-vote exclusion (enforced at backend)
- Team name verification
- Audit logging for all actions
- Secure password hashing (bcrypt)
- Input validation (Zod schemas)

## Blockchain Integration

- Votes are submitted to Avalanche C-Chain Fuji testnet
- Each vote creates a blockchain transaction
- Transaction hashes are stored and linked to Avalanche Explorer
- No user wallet required - backend handles all transactions

## Email Service

- Uses Brevo (formerly Sendinblue) for email delivery
- HTML email templates with voting links
- Delivery status tracking
- Bounce handling

## Color Scheme

The UI uses a fairness-focused color scheme:
- **Primary Blue** (#1e40af): Trust, stability, integrity
- **Secondary Teal** (#0891b2): Transparency, clarity
- **Accent Green** (#059669): Success, fairness
- **Neutral Grays**: Balance, neutrality

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running
- Check database credentials in `.env.local`
- Ensure database exists: `psql -U postgres -l`

### Email Not Sending

- Verify Brevo API key is correct
- Check Brevo sender email is verified
- Review email delivery logs in admin dashboard

### Blockchain Transactions Failing

- Verify Avalanche RPC URL is correct
- Check wallet has testnet AVAX for gas
- Ensure private key is properly formatted (no 0x prefix)

### Migration Issues

- Check migration status: `npm run migrate:status`
- Rollback if needed: `npm run migrate:rollback`
- Verify database user has CREATE TABLE permissions

## Next Steps

- Set up production environment variables
- Configure production database
- Set up monitoring and logging
- Configure rate limiting for production
- Set up SSL/TLS certificates
- Configure backup strategy

## Support

For issues or questions, refer to the main documentation or contact the development team.

