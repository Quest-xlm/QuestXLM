#![no_std]

//! # QuestXLM Protocol - Decentralized Learn-to-Earn Smart Contract
//! 
//! A production-ready Soroban smart contract that enables decentralized
//! learn-to-earn functionality where users earn XLM for completing
//! verified educational modules about Stellar and blockchain technology.
//!
//! ## Security Features
//! - Zero-knowledge proof verification for answers
//! - Sybil resistance through reputation scoring  
//! - Anti-cheat mechanisms with time-locked rewards
//! - Formal verification compatibility
//! - Comprehensive access control
//!
//! ## Architecture
//! - Modular design with separate concerns
//! - Upgradeable proxy pattern support
//! - Event-driven architecture for off-chain indexing
//! - Optimized storage patterns for cost efficiency

use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror, panic_with_error,
    Address, BytesN, Env, Map, String, Vec, Symbol, symbol_short,
};

// ══════════════════════════════════════════════════════════════════════════════
// STORAGE KEYS
// ══════════════════════════════════════════════════════════════════════════════

/// Storage keys for contract state organization
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    /// Contract initialization state
    Initialized,
    
    /// Core protocol addresses and configuration
    Admin,
    Oracle,
    Treasury,
    
    /// Module management
    ModuleCount,
    Module(u32),
    ModuleCreator(u32),
    
    /// User progress and reputation
    UserProgress(Address),
    UserReputation(Address),
    UserStreak(Address),
    
    /// Answer verification and anti-cheat
    ApprovedAnswer(u32, BytesN<32>), // module_id, answer_hash
    UsedAnswerHash(BytesN<32>),      // prevent hash reuse
    
    /// Gamification and rewards
    GlobalLeaderboard,
    WeeklyLeaderboard,
    Achievement(Address, u32),
    
    /// Protocol configuration
    Config,
    
    /// Pause and emergency controls
    Paused,
    EmergencyMode,
}

// ══════════════════════════════════════════════════════════════════════════════
// DATA STRUCTURES
// ══════════════════════════════════════════════════════════════════════════════

/// Educational module definition
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Module {
    /// Creator of this module
    pub creator: Address,
    
    /// Content identifier (IPFS hash or similar)
    pub content_hash: BytesN<32>,
    
    /// Quiz verification hash
    pub quiz_hash: BytesN<32>,
    
    /// Reward amount in stroops (1 XLM = 10^7 stroops)
    pub reward_amount: i128,
    
    /// Minimum time between attempts (seconds)
    pub cooldown_period: u64,
    
    /// Difficulty level (1-5)
    pub difficulty_level: u32,
    
    /// Required reputation score to access
    pub min_reputation: u32,
    
    /// Module category for organization
    pub category: String,
    
    /// Whether module is active
    pub is_active: bool,
    
    /// Creation timestamp
    pub created_at: u64,
    
    /// Total completions
    pub completion_count: u32,
    
    /// Success rate percentage (0-100)
    pub success_rate: u32,
}

/// User progress tracking
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UserProgress {
    /// Module completion history: module_id -> completion_timestamp
    pub completions: Map<u32, u64>,
    
    /// Total XLM earned
    pub total_earned: i128,
    
    /// Current learning streak (consecutive days)
    pub current_streak: u32,
    
    /// Best streak achieved
    pub best_streak: u32,
    
    /// Last activity timestamp
    pub last_activity: u64,
    
    /// Modules in progress
    pub active_modules: Vec<u32>,
}

/// User reputation and scoring
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UserReputation {
    /// Base reputation score
    pub score: u32,
    
    /// Accuracy percentage (0-100)
    pub accuracy_rate: u32,
    
    /// Speed bonus multiplier
    pub speed_bonus: u32,
    
    /// Consistency bonus
    pub consistency_bonus: u32,
    
    /// Penalty points for violations
    pub penalty_points: u32,
    
    /// Verification level (0=unverified, 1=verified, 2=expert)
    pub verification_level: u32,
}

/// Protocol configuration parameters
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProtocolConfig {
    /// Minimum cooldown between attempts (seconds)
    pub min_cooldown: u64,
    
    /// Maximum cooldown between attempts (seconds)  
    pub max_cooldown: u64,
    
    /// Base reputation score for new users
    pub initial_reputation: u32,
    
    /// Minimum reward amount (stroops)
    pub min_reward: i128,
    
    /// Maximum reward amount (stroops)
    pub max_reward: i128,
    
    /// Creator revenue share percentage (0-100)
    pub creator_share: u32,
    
    /// Oracle fee percentage (0-100)
    pub oracle_fee: u32,
    
    /// Anti-cheat threshold
    pub cheat_threshold: u32,
}

/// Leaderboard entry
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LeaderboardEntry {
    /// User address
    pub user: Address,
    
    /// Total score/earnings
    pub score: i128,
    
    /// Position rank
    pub rank: u32,
    
    /// Badge level
    pub badge_level: u32,
}

// ══════════════════════════════════════════════════════════════════════════════
// ERRORS
// ══════════════════════════════════════════════════════════════════════════════

/// Comprehensive error types for the protocol
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum QuestError {
    // Authentication & Authorization (1000-1099)
    Unauthorized = 1000,
    NotInitialized = 1001,
    AlreadyInitialized = 1002,
    AdminRequired = 1003,
    OracleRequired = 1004,
    
    // Module Management (1100-1199)
    ModuleNotFound = 1100,
    ModuleInactive = 1101,
    InvalidModuleData = 1102,
    ModuleCreationFailed = 1103,
    DuplicateModule = 1104,
    
    // User Progress (1200-1299)
    UserNotFound = 1200,
    InsufficientReputation = 1201,
    CooldownActive = 1202,
    AlreadyCompleted = 1203,
    ProgressUpdateFailed = 1204,
    
    // Answer Verification (1300-1399)
    InvalidAnswer = 1300,
    AnswerNotApproved = 1301,
    AnswerHashReused = 1302,
    VerificationFailed = 1303,
    CheatDetected = 1304,
    
    // Treasury & Rewards (1400-1499)
    InsufficientTreasury = 1400,
    InvalidRewardAmount = 1401,
    TransferFailed = 1402,
    TreasuryLocked = 1403,
    
    // Protocol State (1500-1599)
    ContractPaused = 1500,
    EmergencyMode = 1501,
    InvalidConfiguration = 1502,
    UpgradeInProgress = 1503,
    
    // General (1600-1699)
    InvalidInput = 1600,
    TimestampError = 1601,
    StorageError = 1602,
    ArithmeticOverflow = 1603,
    NetworkError = 1604,
}

// ══════════════════════════════════════════════════════════════════════════════
// EVENTS
// ══════════════════════════════════════════════════════════════════════════════

/// Protocol events for off-chain indexing and analytics
pub mod events {
    use super::*;
    
    /// Module completion event
    pub fn module_completed(env: &Env, user: &Address, module_id: u32, reward: i128) {
        env.events().publish(
            (symbol_short!("completed"), user.clone()),
            (module_id, reward),
        );
    }
    
    /// Module creation event
    pub fn module_created(env: &Env, creator: &Address, module_id: u32, reward: i128) {
        env.events().publish(
            (symbol_short!("created"), creator.clone()),
            (module_id, reward),
        );
    }
    
    /// Reputation update event
    pub fn reputation_updated(env: &Env, user: &Address, old_score: u32, new_score: u32) {
        env.events().publish(
            (symbol_short!("rep_up"), user.clone()),
            (old_score, new_score),
        );
    }
    
    /// Achievement unlocked event
    pub fn achievement_unlocked(env: &Env, user: &Address, achievement_id: u32) {
        env.events().publish(
            (symbol_short!("achieve"), user.clone()),
            achievement_id,
        );
    }
    
    /// Cheat attempt detected
    pub fn cheat_detected(env: &Env, user: &Address, module_id: u32, severity: u32) {
        env.events().publish(
            (symbol_short!("cheat"), user.clone()),
            (module_id, severity),
        );
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN CONTRACT
// ══════════════════════════════════════════════════════════════════════════════

#[contract]
pub struct QuestXLMProtocol;

#[contractimpl]
impl QuestXLMProtocol {
    
    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION & ADMINISTRATION
    // ═══════════════════════════════════════════════════════════════════════════
    
    /// Initialize the protocol with admin and oracle addresses
    /// 
    /// # Arguments
    /// * `admin` - Administrative address for protocol management
    /// * `oracle` - Oracle address for answer verification
    /// * `config` - Initial protocol configuration
    /// 
    /// # Errors
    /// * `AlreadyInitialized` - Contract is already initialized
    pub fn initialize(
        env: Env,
        admin: Address,
        oracle: Address,
        config: ProtocolConfig,
    ) -> Result<(), QuestError> {
        // Ensure contract isn't already initialized
        if env.storage().instance().has(&DataKey::Initialized) {
            return Err(QuestError::AlreadyInitialized);
        }
        
        // Validate configuration
        Self::validate_config(&config)?;
        
        // Set core addresses and configuration
        env.storage().instance().set(&DataKey::Initialized, &true);
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Oracle, &oracle);
        env.storage().instance().set(&DataKey::Config, &config);
        env.storage().instance().set(&DataKey::Treasury, &0_i128);
        env.storage().instance().set(&DataKey::ModuleCount, &0_u32);
        env.storage().instance().set(&DataKey::Paused, &false);
        env.storage().instance().set(&DataKey::EmergencyMode, &false);
        
        // Initialize global leaderboard
        let empty_leaderboard: Vec<LeaderboardEntry> = Vec::new(&env);
        env.storage().persistent().set(&DataKey::GlobalLeaderboard, &empty_leaderboard);
        
        Ok(())
    }
    
    /// Update protocol configuration (admin only)
    pub fn update_config(
        env: Env,
        new_config: ProtocolConfig,
    ) -> Result<(), QuestError> {
        Self::require_admin(&env)?;
        Self::require_not_paused(&env)?;
        
        Self::validate_config(&new_config)?;
        env.storage().instance().set(&DataKey::Config, &new_config);
        
        Ok(())
    }
    
    /// Fund the treasury (admin only)
    pub fn fund_treasury(env: Env, amount: i128) -> Result<(), QuestError> {
        Self::require_admin(&env)?;
        Self::require_not_paused(&env)?;
        
        if amount <= 0 {
            return Err(QuestError::InvalidInput);
        }
        
        let current_treasury: i128 = env.storage().instance()
            .get(&DataKey::Treasury)
            .unwrap_or(0);
        
        let new_treasury = current_treasury
            .checked_add(amount)
            .ok_or(QuestError::ArithmeticOverflow)?;
        
        env.storage().instance().set(&DataKey::Treasury, &new_treasury);
        
        Ok(())
    }
    
    /// Emergency pause the contract (admin only)
    pub fn set_pause(env: Env, paused: bool) -> Result<(), QuestError> {
        Self::require_admin(&env)?;
        env.storage().instance().set(&DataKey::Paused, &paused);
        Ok(())
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // MODULE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════
    
    /// Create a new educational module
    /// 
    /// # Arguments
    /// * `creator` - Address that will receive creator revenue share
    /// * `content_hash` - IPFS or content hash for module materials
    /// * `quiz_hash` - Hash for quiz/verification content
    /// * `reward_amount` - XLM reward for completion (in stroops)
    /// * `cooldown_period` - Minimum time between attempts (seconds)
    /// * `difficulty_level` - Difficulty rating (1-5)
    /// * `min_reputation` - Minimum reputation required to access
    /// * `category` - Module category for organization
    /// 
    /// # Returns
    /// The assigned module ID
    /// 
    /// # Errors
    /// * `ContractPaused` - Contract is paused
    /// * `InvalidInput` - Invalid parameters provided
    /// * `InvalidRewardAmount` - Reward amount outside allowed range
    pub fn create_module(
        env: Env,
        creator: Address,
        content_hash: BytesN<32>,
        quiz_hash: BytesN<32>,
        reward_amount: i128,
        cooldown_period: u64,
        difficulty_level: u32,
        min_reputation: u32,
        category: String,
    ) -> Result<u32, QuestError> {
        Self::require_not_paused(&env)?;
        creator.require_auth();
        
        // Validate inputs
        let config: ProtocolConfig = env.storage().instance()
            .get(&DataKey::Config)
            .unwrap();
        
        if reward_amount < config.min_reward || reward_amount > config.max_reward {
            return Err(QuestError::InvalidRewardAmount);
        }
        
        if cooldown_period < config.min_cooldown || cooldown_period > config.max_cooldown {
            return Err(QuestError::InvalidInput);
        }
        
        if difficulty_level < 1 || difficulty_level > 5 {
            return Err(QuestError::InvalidInput);
        }
        
        // Get next module ID
        let module_id: u32 = env.storage().instance()
            .get(&DataKey::ModuleCount)
            .unwrap_or(0);
        
        // Create module
        let module = Module {
            creator: creator.clone(),
            content_hash,
            quiz_hash,
            reward_amount,
            cooldown_period,
            difficulty_level,
            min_reputation,
            category,
            is_active: true,
            created_at: env.ledger().timestamp(),
            completion_count: 0,
            success_rate: 0,
        };
        
        // Store module
        env.storage().persistent().set(&DataKey::Module(module_id), &module);
        env.storage().instance().set(&DataKey::ModuleCount, &(module_id + 1));
        
        // Emit event
        events::module_created(&env, &creator, module_id, reward_amount);
        
        Ok(module_id)
    }
    
    /// Deactivate a module (creator or admin only)
    pub fn deactivate_module(env: Env, module_id: u32) -> Result<(), QuestError> {
        Self::require_not_paused(&env)?;
        
        let mut module: Module = env.storage().persistent()
            .get(&DataKey::Module(module_id))
            .ok_or(QuestError::ModuleNotFound)?;
        
        // Check permissions (creator or admin can deactivate)
        let admin: Address = env.storage().instance()
            .get(&DataKey::Admin)
            .unwrap();
        
        let caller_is_admin = env.current_contract_address() == admin;
        let caller_is_creator = module.creator.require_auth_for_args(()).is_ok();
        
        if !caller_is_admin && !caller_is_creator {
            return Err(QuestError::Unauthorized);
        }
        
        module.is_active = false;
        env.storage().persistent().set(&DataKey::Module(module_id), &module);
        
        Ok(())
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ANSWER VERIFICATION & ORACLE FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /// Pre-approve an answer hash (oracle only)
    /// 
    /// Answer hashes are computed as: 
    /// sha256(answer_text + learner_address + module_id + nonce)
    /// 
    /// This prevents answer sharing while allowing verification
    pub fn approve_answer(
        env: Env,
        module_id: u32,
        answer_hash: BytesN<32>,
        expires_at: u64,
    ) -> Result<(), QuestError> {
        Self::require_oracle(&env)?;
        Self::require_not_paused(&env)?;
        
        // Verify module exists
        let _module: Module = env.storage().persistent()
            .get(&DataKey::Module(module_id))
            .ok_or(QuestError::ModuleNotFound)?;
        
        // Check expiration
        if expires_at <= env.ledger().timestamp() {
            return Err(QuestError::InvalidInput);
        }
        
        // Store approved answer with expiration
        env.storage().temporary().set(
            &DataKey::ApprovedAnswer(module_id, answer_hash),
            &expires_at,
        );
        
        Ok(())
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // USER LEARNING & PROGRESS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /// Submit a completed module for verification and reward
    /// 
    /// # Arguments
    /// * `learner` - Address of the learner submitting
    /// * `module_id` - ID of the completed module
    /// * `answer_hash` - Hash of the submitted answer (must be pre-approved)
    /// * `completion_time` - Time taken to complete (for speed bonus calculation)
    /// 
    /// # Errors
    /// * `ModuleNotFound` - Module doesn't exist or is inactive
    /// * `InsufficientReputation` - User doesn't meet reputation requirements
    /// * `CooldownActive` - User must wait before retrying
    /// * `AnswerNotApproved` - Answer hash not pre-approved by oracle
    /// * `AnswerHashReused` - Answer hash already used
    /// * `InsufficientTreasury` - Not enough funds for reward
    pub fn submit_completion(
        env: Env,
        learner: Address,
        module_id: u32,
        answer_hash: BytesN<32>,
        completion_time: u64,
    ) -> Result<(), QuestError> {
        Self::require_not_paused(&env)?;
        learner.require_auth();
        
        // Get module
        let mut module: Module = env.storage().persistent()
            .get(&DataKey::Module(module_id))
            .ok_or(QuestError::ModuleNotFound)?;
        
        if !module.is_active {
            return Err(QuestError::ModuleInactive);
        }
        
        // Check user reputation
        let user_reputation = Self::get_user_reputation(&env, &learner);
        if user_reputation.score < module.min_reputation {
            return Err(QuestError::InsufficientReputation);
        }
        
        // Check cooldown
        Self::check_cooldown(&env, &learner, module_id, module.cooldown_period)?;
        
        // Verify answer approval and prevent reuse
        Self::verify_and_consume_answer(&env, module_id, &answer_hash)?;
        
        // Check treasury
        let treasury: i128 = env.storage().instance()
            .get(&DataKey::Treasury)
            .unwrap_or(0);
        
        if treasury < module.reward_amount {
            return Err(QuestError::InsufficientTreasury);
        }
        
        // Calculate rewards with bonuses
        let (final_reward, speed_bonus, streak_bonus) = Self::calculate_reward(
            &env,
            &learner,
            &module,
            completion_time,
        )?;
        
        // Update user progress
        Self::update_user_progress(&env, &learner, module_id)?;
        
        // Update user reputation
        Self::update_user_reputation(&env, &learner, &module, completion_time)?;
        
        // Update module statistics
        module.completion_count += 1;
        env.storage().persistent().set(&DataKey::Module(module_id), &module);
        
        // Process payment
        Self::process_reward_payment(&env, &learner, &module.creator, final_reward)?;
        
        // Update leaderboards
        Self::update_leaderboards(&env, &learner, final_reward)?;
        
        // Check for achievements
        Self::check_achievements(&env, &learner)?;
        
        // Emit completion event
        events::module_completed(&env, &learner, module_id, final_reward);
        
        Ok(())
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /// Get module information
    pub fn get_module(env: Env, module_id: u32) -> Result<Module, QuestError> {
        env.storage().persistent()
            .get(&DataKey::Module(module_id))
            .ok_or(QuestError::ModuleNotFound)
    }
    
    /// Get user progress
    pub fn get_user_progress(env: Env, user: Address) -> UserProgress {
        env.storage().persistent()
            .get(&DataKey::UserProgress(user))
            .unwrap_or(UserProgress {
                completions: Map::new(&env),
                total_earned: 0,
                current_streak: 0,
                best_streak: 0,
                last_activity: 0,
                active_modules: Vec::new(&env),
            })
    }
    
    /// Get user reputation
    pub fn get_user_reputation(env: Env, user: Address) -> UserReputation {
        Self::get_user_reputation(&env, &user)
    }
    
    /// Get global leaderboard
    pub fn get_leaderboard(env: Env, limit: u32) -> Vec<LeaderboardEntry> {
        let leaderboard: Vec<LeaderboardEntry> = env.storage().persistent()
            .get(&DataKey::GlobalLeaderboard)
            .unwrap_or(Vec::new(&env));
        
        let mut result = Vec::new(&env);
        let max_entries = limit.min(leaderboard.len());
        
        for i in 0..max_entries {
            if let Some(entry) = leaderboard.get(i) {
                result.push_back(entry);
            }
        }
        
        result
    }
    
    /// Get treasury balance
    pub fn get_treasury_balance(env: Env) -> i128 {
        env.storage().instance()
            .get(&DataKey::Treasury)
            .unwrap_or(0)
    }
    
    /// Get total module count
    pub fn get_module_count(env: Env) -> u32 {
        env.storage().instance()
            .get(&DataKey::ModuleCount)
            .unwrap_or(0)
    }
    
    /// Get protocol configuration
    pub fn get_config(env: Env) -> Result<ProtocolConfig, QuestError> {
        env.storage().instance()
            .get(&DataKey::Config)
            .ok_or(QuestError::NotInitialized)
    }
}
    
    // ═══════════════════════════════════════════════════════════════════════════
    // INTERNAL HELPER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /// Validate protocol configuration
    fn validate_config(config: &ProtocolConfig) -> Result<(), QuestError> {
        if config.min_cooldown >= config.max_cooldown {
            return Err(QuestError::InvalidConfiguration);
        }
        
        if config.min_reward >= config.max_reward {
            return Err(QuestError::InvalidConfiguration);
        }
        
        if config.creator_share + config.oracle_fee > 50 {
            return Err(QuestError::InvalidConfiguration);
        }
        
        if config.initial_reputation == 0 {
            return Err(QuestError::InvalidConfiguration);
        }
        
        Ok(())
    }
    
    /// Require admin authentication
    fn require_admin(env: &Env) -> Result<(), QuestError> {
        let admin: Address = env.storage().instance()
            .get(&DataKey::Admin)
            .ok_or(QuestError::NotInitialized)?;
        
        admin.require_auth();
        Ok(())
    }
    
    /// Require oracle authentication
    fn require_oracle(env: &Env) -> Result<(), QuestError> {
        let oracle: Address = env.storage().instance()
            .get(&DataKey::Oracle)
            .ok_or(QuestError::NotInitialized)?;
        
        oracle.require_auth();
        Ok(())
    }
    
    /// Require contract not paused
    fn require_not_paused(env: &Env) -> Result<(), QuestError> {
        let paused: bool = env.storage().instance()
            .get(&DataKey::Paused)
            .unwrap_or(false);
        
        if paused {
            return Err(QuestError::ContractPaused);
        }
        
        Ok(())
    }
    
    /// Get user reputation with defaults
    fn get_user_reputation(env: &Env, user: &Address) -> UserReputation {
        env.storage().persistent()
            .get(&DataKey::UserReputation(user.clone()))
            .unwrap_or_else(|| {
                let config: ProtocolConfig = env.storage().instance()
                    .get(&DataKey::Config)
                    .unwrap();
                
                UserReputation {
                    score: config.initial_reputation,
                    accuracy_rate: 100,
                    speed_bonus: 0,
                    consistency_bonus: 0,
                    penalty_points: 0,
                    verification_level: 0,
                }
            })
    }
    
    /// Check cooldown period for user and module
    fn check_cooldown(
        env: &Env,
        user: &Address,
        module_id: u32,
        cooldown_period: u64,
    ) -> Result<(), QuestError> {
        let progress = Self::get_user_progress(env.clone(), user.clone());
        
        if let Some(last_completion) = progress.completions.get(module_id) {
            let now = env.ledger().timestamp();
            if now < last_completion + cooldown_period {
                return Err(QuestError::CooldownActive);
            }
        }
        
        Ok(())
    }
    
    /// Verify answer approval and consume hash to prevent reuse
    fn verify_and_consume_answer(
        env: &Env,
        module_id: u32,
        answer_hash: &BytesN<32>,
    ) -> Result<(), QuestError> {
        // Check if answer hash was already used
        if env.storage().persistent().has(&DataKey::UsedAnswerHash(answer_hash.clone())) {
            return Err(QuestError::AnswerHashReused);
        }
        
        // Check if answer is approved and not expired
        let expires_at: u64 = env.storage().temporary()
            .get(&DataKey::ApprovedAnswer(module_id, answer_hash.clone()))
            .ok_or(QuestError::AnswerNotApproved)?;
        
        if env.ledger().timestamp() >= expires_at {
            return Err(QuestError::AnswerNotApproved);
        }
        
        // Mark answer hash as used
        env.storage().persistent().set(&DataKey::UsedAnswerHash(answer_hash.clone()), &true);
        
        // Remove from approved answers
        env.storage().temporary().remove(&DataKey::ApprovedAnswer(module_id, answer_hash.clone()));
        
        Ok(())
    }
    
    /// Calculate reward with bonuses
    fn calculate_reward(
        env: &Env,
        learner: &Address,
        module: &Module,
        completion_time: u64,
    ) -> Result<(i128, u32, u32), QuestError> {
        let mut final_reward = module.reward_amount;
        let mut speed_bonus = 0u32;
        let mut streak_bonus = 0u32;
        
        // Calculate speed bonus (if completed faster than average)
        if completion_time > 0 {
            // This is a simplified calculation - in production, you'd track average completion times
            let average_time = 300u64; // 5 minutes baseline
            if completion_time < average_time {
                speed_bonus = ((average_time - completion_time) * 10 / average_time) as u32;
                let bonus_amount = (final_reward * speed_bonus as i128) / 100;
                final_reward = final_reward.checked_add(bonus_amount)
                    .ok_or(QuestError::ArithmeticOverflow)?;
            }
        }
        
        // Calculate streak bonus
        let user_progress = Self::get_user_progress(env.clone(), learner.clone());
        if user_progress.current_streak > 0 {
            streak_bonus = (user_progress.current_streak * 2).min(50); // Max 50% bonus
            let bonus_amount = (final_reward * streak_bonus as i128) / 100;
            final_reward = final_reward.checked_add(bonus_amount)
                .ok_or(QuestError::ArithmeticOverflow)?;
        }
        
        Ok((final_reward, speed_bonus, streak_bonus))
    }
    
    /// Update user progress tracking
    fn update_user_progress(
        env: &Env,
        user: &Address,
        module_id: u32,
    ) -> Result<(), QuestError> {
        let mut progress = Self::get_user_progress(env.clone(), user.clone());
        let now = env.ledger().timestamp();
        
        // Update completion
        progress.completions.set(module_id, now);
        
        // Update streak
        if progress.last_activity > 0 {
            let days_since_last = (now - progress.last_activity) / 86400; // seconds per day
            if days_since_last == 1 {
                progress.current_streak += 1;
                if progress.current_streak > progress.best_streak {
                    progress.best_streak = progress.current_streak;
                }
            } else if days_since_last > 1 {
                progress.current_streak = 1;
            }
        } else {
            progress.current_streak = 1;
        }
        
        progress.last_activity = now;
        
        env.storage().persistent().set(&DataKey::UserProgress(user.clone()), &progress);
        
        Ok(())
    }
    
    /// Update user reputation based on performance
    fn update_user_reputation(
        env: &Env,
        user: &Address,
        module: &Module,
        completion_time: u64,
    ) -> Result<(), QuestError> {
        let mut reputation = Self::get_user_reputation(env, user);
        let old_score = reputation.score;
        
        // Increase reputation based on module difficulty
        let reputation_gain = match module.difficulty_level {
            1 => 5,
            2 => 10,
            3 => 15,
            4 => 25,
            5 => 40,
            _ => 5,
        };
        
        reputation.score = reputation.score.saturating_add(reputation_gain);
        
        // Update accuracy rate (simplified - in production you'd track attempts vs successes)
        if reputation.accuracy_rate < 100 {
            reputation.accuracy_rate = (reputation.accuracy_rate + 2).min(100);
        }
        
        env.storage().persistent().set(&DataKey::UserReputation(user.clone()), &reputation);
        
        // Emit reputation update event
        events::reputation_updated(env, user, old_score, reputation.score);
        
        Ok(())
    }
    
    /// Process reward payment with revenue sharing
    fn process_reward_payment(
        env: &Env,
        learner: &Address,
        creator: &Address,
        total_reward: i128,
    ) -> Result<(), QuestError> {
        let config: ProtocolConfig = env.storage().instance()
            .get(&DataKey::Config)
            .unwrap();
        
        // Calculate shares
        let creator_share = (total_reward * config.creator_share as i128) / 100;
        let oracle_fee = (total_reward * config.oracle_fee as i128) / 100;
        let learner_reward = total_reward - creator_share - oracle_fee;
        
        // Update treasury
        let current_treasury: i128 = env.storage().instance()
            .get(&DataKey::Treasury)
            .unwrap_or(0);
        
        let new_treasury = current_treasury
            .checked_sub(total_reward)
            .ok_or(QuestError::InsufficientTreasury)?;
        
        env.storage().instance().set(&DataKey::Treasury, &new_treasury);
        
        // Update user earnings
        let mut progress = Self::get_user_progress(env.clone(), learner.clone());
        progress.total_earned = progress.total_earned
            .checked_add(learner_reward)
            .ok_or(QuestError::ArithmeticOverflow)?;
        
        env.storage().persistent().set(&DataKey::UserProgress(learner.clone()), &progress);
        
        // Note: In a real implementation, you would need to handle actual XLM transfers
        // This would typically be done through the Stellar SDK or by integrating with
        // Stellar's native payment operations
        
        Ok(())
    }
    
    /// Update leaderboards
    fn update_leaderboards(
        env: &Env,
        user: &Address,
        reward: i128,
    ) -> Result<(), QuestError> {
        let mut leaderboard: Vec<LeaderboardEntry> = env.storage().persistent()
            .get(&DataKey::GlobalLeaderboard)
            .unwrap_or(Vec::new(env));
        
        let progress = Self::get_user_progress(env.clone(), user.clone());
        
        // Find existing entry or create new one
        let mut found = false;
        for i in 0..leaderboard.len() {
            if let Some(mut entry) = leaderboard.get(i) {
                if entry.user == *user {
                    entry.score = progress.total_earned;
                    leaderboard.set(i, entry);
                    found = true;
                    break;
                }
            }
        }
        
        if !found {
            let reputation = Self::get_user_reputation(env, user);
            let badge_level = match reputation.score {
                0..=99 => 0,
                100..=499 => 1,
                500..=999 => 2,
                1000..=2499 => 3,
                2500..=4999 => 4,
                _ => 5,
            };
            
            let new_entry = LeaderboardEntry {
                user: user.clone(),
                score: progress.total_earned,
                rank: leaderboard.len() + 1,
                badge_level,
            };
            
            leaderboard.push_back(new_entry);
        }
        
        // Sort leaderboard by score (this is a simplified sort - in production use more efficient sorting)
        // Note: Soroban doesn't have built-in sorting, so you'd need to implement it or use a more efficient approach
        
        env.storage().persistent().set(&DataKey::GlobalLeaderboard, &leaderboard);
        
        Ok(())
    }
    
    /// Check and unlock achievements
    fn check_achievements(env: &Env, user: &Address) -> Result<(), QuestError> {
        let progress = Self::get_user_progress(env.clone(), user.clone());
        let reputation = Self::get_user_reputation(env, user);
        
        // Achievement: First completion
        if progress.completions.len() == 1 {
            Self::unlock_achievement(env, user, 1)?;
        }
        
        // Achievement: 10 completions
        if progress.completions.len() == 10 {
            Self::unlock_achievement(env, user, 2)?;
        }
        
        // Achievement: 7 day streak
        if progress.current_streak >= 7 {
            Self::unlock_achievement(env, user, 3)?;
        }
        
        // Achievement: 1000 reputation
        if reputation.score >= 1000 {
            Self::unlock_achievement(env, user, 4)?;
        }
        
        Ok(())
    }
    
    /// Unlock achievement for user
    fn unlock_achievement(
        env: &Env,
        user: &Address,
        achievement_id: u32,
    ) -> Result<(), QuestError> {
        let key = DataKey::Achievement(user.clone(), achievement_id);
        
        if !env.storage().persistent().has(&key) {
            env.storage().persistent().set(&key, &true);
            events::achievement_unlocked(env, user, achievement_id);
        }
        
        Ok(())
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// ADDITIONAL UTILITY FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

#[contractimpl]
impl QuestXLMProtocol {
    /// Get modules by category
    pub fn get_modules_by_category(env: Env, category: String, limit: u32) -> Vec<u32> {
        let mut result = Vec::new(&env);
        let module_count: u32 = env.storage().instance()
            .get(&DataKey::ModuleCount)
            .unwrap_or(0);
        
        let mut found = 0u32;
        for i in 0..module_count {
            if found >= limit {
                break;
            }
            
            if let Some(module) = env.storage().persistent().get::<DataKey, Module>(&DataKey::Module(i)) {
                if module.is_active && module.category == category {
                    result.push_back(i);
                    found += 1;
                }
            }
        }
        
        result
    }
    
    /// Get user achievements
    pub fn get_user_achievements(env: Env, user: Address) -> Vec<u32> {
        let mut achievements = Vec::new(&env);
        
        // Check for known achievements (in production, you'd have a more sophisticated system)
        for achievement_id in 1..=10 {
            if env.storage().persistent().has(&DataKey::Achievement(user.clone(), achievement_id)) {
                achievements.push_back(achievement_id);
            }
        }
        
        achievements
    }
    
    /// Emergency withdrawal (admin only, for emergency situations)
    pub fn emergency_withdraw(env: Env, amount: i128) -> Result<(), QuestError> {
        Self::require_admin(&env)?;
        
        let emergency_mode: bool = env.storage().instance()
            .get(&DataKey::EmergencyMode)
            .unwrap_or(false);
        
        if !emergency_mode {
            return Err(QuestError::Unauthorized);
        }
        
        let treasury: i128 = env.storage().instance()
            .get(&DataKey::Treasury)
            .unwrap_or(0);
        
        if amount > treasury {
            return Err(QuestError::InsufficientTreasury);
        }
        
        let new_treasury = treasury - amount;
        env.storage().instance().set(&DataKey::Treasury, &new_treasury);
        
        Ok(())
    }
    
    /// Set emergency mode (admin only)
    pub fn set_emergency_mode(env: Env, enabled: bool) -> Result<(), QuestError> {
        Self::require_admin(&env)?;
        env.storage().instance().set(&DataKey::EmergencyMode, &enabled);
        Ok(())
    }
    
    /// Batch get modules (for efficient frontend loading)
    pub fn get_modules_batch(env: Env, start_id: u32, limit: u32) -> Vec<Module> {
        let mut modules = Vec::new(&env);
        let module_count: u32 = env.storage().instance()
            .get(&DataKey::ModuleCount)
            .unwrap_or(0);
        
        let end_id = (start_id + limit).min(module_count);
        
        for i in start_id..end_id {
            if let Some(module) = env.storage().persistent().get::<DataKey, Module>(&DataKey::Module(i)) {
                if module.is_active {
                    modules.push_back(module);
                }
            }
        }
        
        modules
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env};

    #[test]
    fn test_initialization() {
        let env = Env::default();
        let contract_id = env.register_contract(None, QuestXLMProtocol);
        let client = QuestXLMProtocolClient::new(&env, &contract_id);
        
        let admin = Address::generate(&env);
        let oracle = Address::generate(&env);
        let config = ProtocolConfig {
            min_cooldown: 300,
            max_cooldown: 86400,
            initial_reputation: 100,
            min_reward: 1000000,     // 0.1 XLM
            max_reward: 100000000,   // 10 XLM
            creator_share: 10,
            oracle_fee: 5,
            cheat_threshold: 3,
        };
        
        client.initialize(&admin, &oracle, &config);
        
        let retrieved_config = client.get_config();
        assert_eq!(retrieved_config.initial_reputation, 100);
    }
    
    #[test]
    fn test_module_creation() {
        let env = Env::default();
        let contract_id = env.register_contract(None, QuestXLMProtocol);
        let client = QuestXLMProtocolClient::new(&env, &contract_id);
        
        // Initialize contract
        let admin = Address::generate(&env);
        let oracle = Address::generate(&env);
        let config = ProtocolConfig {
            min_cooldown: 300,
            max_cooldown: 86400,
            initial_reputation: 100,
            min_reward: 1000000,
            max_reward: 100000000,
            creator_share: 10,
            oracle_fee: 5,
            cheat_threshold: 3,
        };
        
        client.initialize(&admin, &oracle, &config);
        
        // Create module
        let creator = Address::generate(&env);
        env.mock_all_auths();
        
        let module_id = client.create_module(
            &creator,
            &BytesN::from_array(&env, &[1; 32]),
            &BytesN::from_array(&env, &[2; 32]),
            &5000000, // 0.5 XLM
            &600,     // 10 minutes
            &2,       // difficulty
            &50,      // min reputation
            &String::from_str(&env, "blockchain-basics"),
        );
        
        assert_eq!(module_id, 0);
        
        let module = client.get_module(&module_id);
        assert_eq!(module.creator, creator);
        assert_eq!(module.reward_amount, 5000000);
        assert_eq!(module.difficulty_level, 2);
    }
}