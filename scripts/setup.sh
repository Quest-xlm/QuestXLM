#!/bin/bash

# QuestXLM Development Setup Script
# This script sets up the complete development environment for QuestXLM

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check version
check_version() {
    local cmd="$1"
    local min_version="$2"
    local current_version="$3"
    
    if [[ "$(printf '%s\n' "$min_version" "$current_version" | sort -V | head -n1)" == "$min_version" ]]; then
        return 0
    else
        return 1
    fi
}

print_status "Starting QuestXLM development environment setup..."
echo

# Check operating system
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    CYGWIN*)    MACHINE=Cygwin;;
    MINGW*)     MACHINE=MinGw;;
    *)          MACHINE="UNKNOWN:${OS}";;
esac

print_status "Detected operating system: $MACHINE"

# 1. Check Prerequisites
print_status "Checking prerequisites..."

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version | sed 's/v//')
    if check_version "18.0.0" "$NODE_VERSION"; then
        print_success "Node.js $NODE_VERSION found"
    else
        print_error "Node.js version $NODE_VERSION is too old. Please install Node.js 18.0.0 or later"
        exit 1
    fi
else
    print_error "Node.js not found. Please install Node.js 18.0.0 or later"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    if check_version "9.0.0" "$NPM_VERSION"; then
        print_success "npm $NPM_VERSION found"
    else
        print_warning "npm version $NPM_VERSION might be too old. Recommended: 9.0.0 or later"
    fi
else
    print_error "npm not found. Please install npm"
    exit 1
fi

# Check Rust and Cargo
if command_exists rustc; then
    RUST_VERSION=$(rustc --version | awk '{print $2}')
    print_success "Rust $RUST_VERSION found"
else
    print_error "Rust not found. Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
fi

if command_exists cargo; then
    CARGO_VERSION=$(cargo --version | awk '{print $2}')
    print_success "Cargo $CARGO_VERSION found"
else
    print_error "Cargo not found. Please install Rust toolchain"
    exit 1
fi

# Check if wasm32 target is installed
if rustup target list --installed | grep -q "wasm32-unknown-unknown"; then
    print_success "wasm32-unknown-unknown target found"
else
    print_status "Installing wasm32-unknown-unknown target..."
    rustup target add wasm32-unknown-unknown
    print_success "wasm32-unknown-unknown target installed"
fi

# Check Stellar CLI
if command_exists stellar; then
    STELLAR_VERSION=$(stellar --version | head -n1 | awk '{print $2}')
    print_success "Stellar CLI $STELLAR_VERSION found"
else
    print_warning "Stellar CLI not found. Installing..."
    case "${MACHINE}" in
        Linux)
            curl -L https://github.com/stellar/stellar-cli/releases/download/v21.0.0/stellar-cli-21.0.0-x86_64-unknown-linux-gnu.tar.gz | tar -xz
            sudo mv stellar-cli-21.0.0-x86_64-unknown-linux-gnu/stellar /usr/local/bin/
            ;;
        Mac)
            if command_exists brew; then
                brew install stellar/tap/stellar-cli
            else
                curl -L https://github.com/stellar/stellar-cli/releases/download/v21.0.0/stellar-cli-21.0.0-x86_64-apple-darwin.tar.gz | tar -xz
                sudo mv stellar-cli-21.0.0-x86_64-apple-darwin/stellar /usr/local/bin/
            fi
            ;;
        *)
            print_error "Please install Stellar CLI manually from https://github.com/stellar/stellar-cli/releases"
            exit 1
            ;;
    esac
    print_success "Stellar CLI installed"
fi

# Check Docker (optional but recommended)
if command_exists docker; then
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
    print_success "Docker $DOCKER_VERSION found"
else
    print_warning "Docker not found. Docker is optional but recommended for local development"
fi

echo

# 2. Install Project Dependencies
print_status "Installing project dependencies..."

# Install root dependencies
print_status "Installing root dependencies..."
npm install

# Install frontend dependencies
print_status "Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Install oracle dependencies
print_status "Installing oracle dependencies..."
cd oracle
npm install
cd ..

print_success "All dependencies installed"
echo

# 3. Build Smart Contracts
print_status "Building smart contracts..."
cd contract
cargo build --target wasm32-unknown-unknown --release
if [ $? -eq 0 ]; then
    print_success "Smart contracts built successfully"
else
    print_error "Failed to build smart contracts"
    exit 1
fi
cd ..
echo

# 4. Setup Environment Files
print_status "Setting up environment files..."

# Create frontend .env.local if it doesn't exist
if [ ! -f "frontend/.env.local" ]; then
    cat > frontend/.env.local << EOF
# QuestXLM Frontend Environment Variables
NEXT_PUBLIC_NETWORK=TESTNET
NEXT_PUBLIC_ORACLE_URL=http://localhost:3001

# Optional: Enable debug features
NEXT_PUBLIC_DEBUG=true
EOF
    print_success "Created frontend/.env.local"
else
    print_warning "frontend/.env.local already exists"
fi

# Create oracle .env if it doesn't exist
if [ ! -f "oracle/.env" ]; then
    cat > oracle/.env << EOF
# QuestXLM Oracle Environment Variables
NODE_ENV=development
PORT=3001
LOG_LEVEL=debug

# Network Configuration
NETWORK=testnet
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
HORIZON_URL=https://horizon-testnet.stellar.org

# Security
ALLOWED_ORIGINS=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Optional: Redis for caching
# REDIS_URL=redis://localhost:6379
EOF
    print_success "Created oracle/.env"
else
    print_warning "oracle/.env already exists"
fi

echo

# 5. Run Initial Tests
print_status "Running initial tests..."

# Test contract compilation
print_status "Testing contract compilation..."
cd contract
cargo test
if [ $? -eq 0 ]; then
    print_success "Contract tests passed"
else
    print_warning "Some contract tests failed"
fi
cd ..

echo

# 6. Setup Git Hooks (if in a git repository)
if [ -d ".git" ]; then
    print_status "Setting up Git hooks..."
    
    # Create pre-commit hook
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# QuestXLM pre-commit hook

echo "Running pre-commit checks..."

# Check for contract changes and run tests
if git diff --cached --name-only | grep -q "^contract/"; then
    echo "Contract changes detected, running tests..."
    cd contract && cargo test
    if [ $? -ne 0 ]; then
        echo "Contract tests failed. Please fix before committing."
        exit 1
    fi
    cd ..
fi

# Check for frontend changes and run linting
if git diff --cached --name-only | grep -q "^frontend/"; then
    echo "Frontend changes detected, running linter..."
    cd frontend && npm run lint
    if [ $? -ne 0 ]; then
        echo "Frontend linting failed. Please fix before committing."
        exit 1
    fi
    cd ..
fi

# Check for oracle changes and run linting
if git diff --cached --name-only | grep -q "^oracle/"; then
    echo "Oracle changes detected, running linter..."
    cd oracle && npm run lint
    if [ $? -ne 0 ]; then
        echo "Oracle linting failed. Please fix before committing."
        exit 1
    fi
    cd ..
fi

echo "Pre-commit checks passed!"
EOF

    chmod +x .git/hooks/pre-commit
    print_success "Git pre-commit hook installed"
fi

echo

# 7. Create Development Scripts
print_status "Creating development scripts..."

# Create start script
cat > start-dev.sh << 'EOF'
#!/bin/bash
# QuestXLM Development Startup Script

echo "Starting QuestXLM development environment..."

# Start frontend and oracle in parallel
npm run dev
EOF

chmod +x start-dev.sh
print_success "Created start-dev.sh script"

echo

# 8. Final Setup Summary
print_success "QuestXLM development environment setup complete!"
echo
echo "📋 Setup Summary:"
echo "✅ Prerequisites checked and installed"
echo "✅ Dependencies installed"
echo "✅ Smart contracts built"
echo "✅ Environment files created"
echo "✅ Initial tests run"
echo "✅ Development scripts created"
echo

echo "🚀 Next Steps:"
echo "1. Review and update environment files:"
echo "   - frontend/.env.local"
echo "   - oracle/.env"
echo
echo "2. Start the development environment:"
echo "   ./start-dev.sh"
echo "   or"
echo "   npm run dev"
echo
echo "3. Access the application:"
echo "   - Frontend: http://localhost:3000"
echo "   - Oracle: http://localhost:3001"
echo
echo "4. Deploy to testnet (optional):"
echo "   npm run deploy:testnet"
echo

print_status "For more information, see the README.md and CONTRIBUTING.md files"
print_success "Happy coding! 🎉"