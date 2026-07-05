//! Comprehensive test suite for QuestXLM Protocol
//! 
//! This module contains unit and integration tests covering all major
//! functionality of the learn-to-earn protocol including security,
//! edge cases, and error conditions.

#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, AuthorizedFunction, AuthorizedInvocation},
    Address, BytesN, Env, IntoVal, String,
};

// ══════════════════════════════════════════════════════════════════════════════
// TEST HELPERS
// ══════════════════════════════════════════════════════════════════════════════

/// Create a test environment with initialized contract
fn setup_contract() -> (Env, Address, QuestXLMProtocolClient<'static>) {
    let env = Env::default();
    let contract_id = env.register_contract(None, QuestXLMProtocol);
    let client = QuestXLMProtocolClient::new(&env, &contract_id);
    
    (env, contract_id, client)
}

/// Initialize contract with default test parameters
fn initialize_contract(
    client: &QuestXLMProtocolClient,
    admin: &Address,
    oracle: &Address,
) -> ProtocolConfig {
    let config = ProtocolConfig {
        min_cooldown: 300,      // 5 minutes
        max_cooldown: 86400,    // 24 hours  
        initial_reputation: 100,
        min_reward: 1000000,    // 0.1 XLM
        max_reward: 100000000,  // 10 XLM
        creator_share: 10,      // 10%
        oracle_fee: 5,          // 5%
        cheat_threshold: 3,
    };
    
    client.initialize(admin, oracle, &config);
    config
}

/// Create a test module
fn create_test_module(
    client: &QuestXLMProtocolClient,
    creator: &Address,
    reward_amount: i128,
    difficulty: u32,
) -> u32 {
    client.create_module(
        creator,
        &BytesN::from_array(&client.env, &[1; 32]), // content_hash
        &BytesN::from_array(&client.env, &[2; 32]), // quiz_hash
        &reward_amount,
        &600,  // 10 minute cooldown
        &difficulty,
        &50,   // min reputation
        &String::from_str(&client.env, "test-category"),
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// INITIALIZATION TESTS
// ══════════════════════════════════════════════════════════════════════════════

#[test]
fn test_initialization_success() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let oracle = Address::generate(&env);
    
    let config = initialize_contract(&client, &admin, &oracle);
    
    // Verify initialization
    let retrieved_config = client.get_config();
    assert_eq!(retrieved_config.initial_reputation, config.initial_reputation);
    assert_eq!(retrieved_config.min_cooldown, config.min_cooldown);
    assert_eq!(client.get_treasury_balance(), 0);
    assert_eq!(client.get_module_count(), 0);
}

#[test]
#[should_panic(expected = "AlreadyInitialized")]
fn test_double_initialization_fails() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let oracle = Address::generate(&env);
    
    initialize_contract(&client, &admin, &oracle);
    
    // Try to initialize again - should panic
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
}

#[test]
#[should_panic(expected = "InvalidConfiguration")]
fn test_invalid_config_initialization() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let oracle = Address::generate(&env);
    
    // Invalid config: min_cooldown >= max_cooldown
    let invalid_config = ProtocolConfig {
        min_cooldown: 86400,
        max_cooldown: 300,     // Invalid: smaller than min
        initial_reputation: 100,
        min_reward: 1000000,
        max_reward: 100000000,
        creator_share: 10,
        oracle_fee: 5,
        cheat_threshold: 3,
    };
    
    client.initialize(&admin, &oracle, &invalid_config);
}

// ══════════════════════════════════════════════════════════════════════════════
// TREASURY MANAGEMENT TESTS
// ══════════════════════════════════════════════════════════════════════════════

#[test]
fn test_fund_treasury() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let oracle = Address::generate(&env);
    
    initialize_contract(&client, &admin, &oracle);
    
    // Mock admin authentication
    env.mock_all_auths();
    
    // Fund treasury
    let amount = 50000000; // 5 XLM
    client.fund_treasury(&amount);
    
    assert_eq!(client.get_treasury_balance(), amount);
    
    // Fund again
    client.fund_treasury(&amount);
    assert_eq!(client.get_treasury_balance(), amount * 2);
}

#[test]
#[should_panic(expected = "Unauthorized")]
fn test_fund_treasury_unauthorized() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let oracle = Address::generate(&env);
    let unauthorized = Address::generate(&env);
    
    initialize_contract(&client, &admin, &oracle);
    
    // Try to fund treasury as unauthorized user
    env.mock_all_auths_allowing_non_root_auth();
    client.fund_treasury(&1000000);
}

// ══════════════════════════════════════════════════════════════════════════════
// MODULE MANAGEMENT TESTS
// ══════════════════════════════════════════════════════════════════════════════

#[test]
fn test_create_module() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let oracle = Address::generate(&env);
    let creator = Address::generate(&env);
    
    initialize_contract(&client, &admin, &oracle);
    env.mock_all_auths();
    
    let reward_amount = 5000000; // 0.5 XLM
    let module_id = create_test_module(&client, &creator, reward_amount, 2);
    
    assert_eq!(module_id, 0);
    assert_eq!(client.get_module_count(), 1);
    
    let module = client.get_module(&module_id);
    assert_eq!(module.creator, creator);
    assert_eq!(module.reward_amount, reward_amount);
    assert_eq!(module.difficulty_level, 2);
    assert_eq!(module.is_active, true);
    assert_eq!(module.completion_count, 0);
}

#[test]
fn test_create_multiple_modules() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let oracle = Address::generate(&env);
    let creator1 = Address::generate(&env);
    let creator2 = Address::generate(&env);
    
    initialize_contract(&client, &admin, &oracle);
    env.mock_all_auths();
    
    // Create first module
    let module_id_1 = create_test_module(&client, &creator1, 1000000, 1);
    
    // Create second module
    let module_id_2 = create_test_module(&client, &creator2, 5000000, 3);
    
    assert_eq!(module_id_1, 0);
    assert_eq!(module_id_2, 1);
    assert_eq!(client.get_module_count(), 2);
    
    let module1 = client.get_module(&module_id_1);
    let module2 = client.get_module(&module_id_2);
    
    assert_eq!(module1.creator, creator1);
    assert_eq!(module2.creator, creator2);
    assert_eq!(module1.difficulty_level, 1);
    assert_eq!(module2.difficulty_level, 3);
}

#[test]
#[should_panic(expected = "InvalidRewardAmount")]
fn test_create_module_invalid_reward() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let oracle = Address::generate(&env);
    let creator = Address::generate(&env);
    
    initialize_contract(&client, &admin, &oracle);
    env.mock_all_auths();
    
    // Try to create module with reward too high
    let invalid_reward = 200000000; // 20 XLM (above max of 10 XLM)
    create_test_module(&client, &creator, invalid_reward, 2);
}

#[test]
fn test_deactivate_module() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let oracle = Address::generate(&env);
    let creator = Address::generate(&env);
    
    initialize_contract(&client, &admin, &oracle);
    env.mock_all_auths();
    
    let module_id = create_test_module(&client, &creator, 5000000, 2);
    
    // Verify module is active
    let module = client.get_module(&module_id);
    assert_eq!(module.is_active, true);
    
    // Deactivate module (as creator)
    client.deactivate_module(&module_id);
    
    let updated_module = client.get_module(&module_id);
    assert_eq!(updated_module.is_active, false);
}

// ══════════════════════════════════════════════════════════════════════════════
// ANSWER VERIFICATION TESTS  
// ══════════════════════════════════════════════════════════════════════════════

#[test]
fn test_approve_answer() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let oracle = Address::generate(&env);
    
    initialize_contract(&client, &admin, &oracle);
    env.mock_all_auths();
    
    let module_id = 0u32;
    let answer_hash = BytesN::from_array(&env, &[3; 32]);
    let expires_at = env.ledger().timestamp() + 300; // 5 minutes from now
    
    client.approve_answer(&module_id, &answer_hash, &expires_at);
    
    // Verification happens inside submit_completion, so we can't directly test
    // the approval storage without exposing internal functions
}

#[test]
#[should_panic(expected = "Unauthorized")]
fn test_approve_answer_unauthorized() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let oracle = Address::generate(&env);
    let unauthorized = Address::generate(&env);
    
    initialize_contract(&client, &admin, &oracle);
    
    // Try to approve answer as unauthorized user
    env.mock_auths(&[]);
    
    let module_id = 0u32;
    let answer_hash = BytesN::from_array(&env, &[3; 32]);
    let expires_at = env.ledger().timestamp() + 300;
    
    client.approve_answer(&module_id, &answer_hash, &expires_at);
}

// ══════════════════════════════════════════════════════════════════════════════
// MODULE COMPLETION TESTS
// ══════════════════════════════════════════════════════════════════════════════

#[test]
fn test_submit_completion_success() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let oracle = Address::generate(&env);
    let creator = Address::generate(&env);
    let learner = Address::generate(&env);
    
    initialize_contract(&client, &admin, &oracle);
    env.mock_all_auths();
    
    // Fund treasury
    client.fund_treasury(&50000000);
    
    // Create module
    let module_id = create_test_module(&client, &creator, 5000000, 2);
    
    // Approve answer
    let answer_hash = BytesN::from_array(&env, &[3; 32]);
    let expires_at = env.ledger().timestamp() + 300;
    client.approve_answer(&module_id, &answer_hash, &expires_at);
    
    // Submit completion
    let completion_time = 180u64; // 3 minutes
    client.submit_completion(&learner, &module_id, &answer_hash, &completion_time);
    
    // Verify user progress
    let progress = client.get_user_progress(&learner);
    assert_eq!(progress.completions.len(), 1);
    assert!(progress.total_earned > 0);
    
    // Verify user reputation
    let reputation = client.get_user_reputation(&learner);
    assert!(reputation.score > 100); // Should be higher than initial
    
    // Verify module statistics
    let module = client.get_module(&module_id);
    assert_eq!(module.completion_count, 1);
}

#[test]
#[should_panic(expected = "ModuleNotFound")]
fn test_submit_completion_nonexistent_module() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let oracle = Address::generate(&env);
    let learner = Address::generate(&env);
    
    initialize_contract(&client, &admin, &oracle);
    env.mock_all_auths();
    
    let nonexistent_module_id = 999u32;
    let answer_hash = BytesN::from_array(&env, &[3; 32]);
    let completion_time = 180u64;
    
    client.submit_completion(&learner, &nonexistent_module_id, &answer_hash, &completion_time);
}

#[test]
#[should_panic(expected = "AnswerNotApproved")]
fn test_submit_completion_unapproved_answer() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let oracle = Address::generate(&env);
    let creator = Address::generate(&env);
    let learner = Address::generate(&env);
    
    initialize_contract(&client, &admin, &oracle);
    env.mock_all_auths();
    
    // Fund treasury
    client.fund_treasury(&50000000);
    
    // Create module
    let module_id = create_test_module(&client, &creator, 5000000, 2);
    
    // Submit completion with unapproved answer hash
    let unapproved_hash = BytesN::from_array(&env, &[4; 32]);
    let completion_time = 180u64;
    
    client.submit_completion(&learner, &module_id, &unapproved_hash, &completion_time);
}

#[test]
#[should_panic(expected = "InsufficientTreasury")]
fn test_submit_completion_insufficient_treasury() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let oracle = Address::generate(&env);
    let creator = Address::generate(&env);
    let learner = Address::generate(&env);
    
    initialize_contract(&client, &admin, &oracle);
    env.mock_all_auths();
    
    // Don't fund treasury - should have insufficient funds
    
    // Create module
    let module_id = create_test_module(&client, &creator, 5000000, 2);
    
    // Approve answer
    let answer_hash = BytesN::from_array(&env, &[3; 32]);
    let expires_at = env.ledger().timestamp() + 300;
    client.approve_answer(&module_id, &answer_hash, &expires_at);
    
    // Submit completion - should fail due to insufficient treasury
    let completion_time = 180u64;
    client.submit_completion(&learner, &module_id, &answer_hash, &completion_time);
}

#[test]  
#[should_panic(expected = "CooldownActive")]
fn test_submit_completion_cooldown_active() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let oracle = Address::generate(&env);
    let creator = Address::generate(&env);
    let learner = Address::generate(&env);
    
    initialize_contract(&client, &admin, &oracle);
    env.mock_all_auths();
    
    // Fund treasury
    client.fund_treasury(&50000000);
    
    // Create module
    let module_id = create_test_module(&client, &creator, 5000000, 2);
    
    // First completion
    let answer_hash_1 = BytesN::from_array(&env, &[3; 32]);
    let expires_at = env.ledger().timestamp() + 300;
    client.approve_answer(&module_id, &answer_hash_1, &expires_at);
    client.submit_completion(&learner, &module_id, &answer_hash_1, &180);
    
    // Try second completion immediately - should fail due to cooldown
    let answer_hash_2 = BytesN::from_array(&env, &[4; 32]);
    let expires_at_2 = env.ledger().timestamp() + 300;
    client.approve_answer(&module_id, &answer_hash_2, &expires_at_2);
    client.submit_completion(&learner, &module_id, &answer_hash_2, &180);
}

// ══════════════════════════════════════════════════════════════════════════════
// REPUTATION & PROGRESS TESTS
// ══════════════════════════════════════════════════════════════════════════════

#[test]
fn test_user_reputation_tracking() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let oracle = Address::generate(&env);
    let creator = Address::generate(&env);
    let learner = Address::generate(&env);
    
    initialize_contract(&client, &admin, &oracle);
    env.mock_all_auths();
    
    // Check initial reputation
    let initial_reputation = client.get_user_reputation(&learner);
    assert_eq!(initial_reputation.score, 100); // initial reputation from config
    
    // Fund treasury
    client.fund_treasury(&50000000);
    
    // Create and complete modules of different difficulties
    for difficulty in 1..=3 {
        let module_id = create_test_module(&client, &creator, 2000000, difficulty);
        
        let answer_hash = BytesN::from_array(&env, &[difficulty as u8; 32]);
        let expires_at = env.ledger().timestamp() + 300;
        client.approve_answer(&module_id, &answer_hash, &expires_at);
        
        client.submit_completion(&learner, &module_id, &answer_hash, &180);
        
        // Advance time to avoid cooldown
        env.ledger().set_timestamp(env.ledger().timestamp() + 700);
    }
    
    // Check updated reputation
    let final_reputation = client.get_user_reputation(&learner);
    assert!(final_reputation.score > initial_reputation.score);
}

#[test]
fn test_user_progress_tracking() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let oracle = Address::generate(&env);
    let creator = Address::generate(&env);
    let learner = Address::generate(&env);
    
    initialize_contract(&client, &admin, &oracle);
    env.mock_all_auths();
    
    // Fund treasury
    client.fund_treasury(&50000000);
    
    // Complete multiple modules
    for i in 0..3 {
        let module_id = create_test_module(&client, &creator, 1000000, 1);
        
        let answer_hash = BytesN::from_array(&env, &[i as u8 + 10; 32]);
        let expires_at = env.ledger().timestamp() + 300;
        client.approve_answer(&module_id, &answer_hash, &expires_at);
        
        client.submit_completion(&learner, &module_id, &answer_hash, &180);
        
        // Advance time
        env.ledger().set_timestamp(env.ledger().timestamp() + 86500); // Just over 24 hours for streak
    }
    
    let progress = client.get_user_progress(&learner);
    assert_eq!(progress.completions.len(), 3);
    assert!(progress.total_earned > 0);
    assert!(progress.current_streak >= 1);
}

// ══════════════════════════════════════════════════════════════════════════════
// LEADERBOARD TESTS
// ══════════════════════════════════════════════════════════════════════════════

#[test]
fn test_leaderboard_updates() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let oracle = Address::generate(&env);
    let creator = Address::generate(&env);
    let learner1 = Address::generate(&env);
    let learner2 = Address::generate(&env);
    
    initialize_contract(&client, &admin, &oracle);
    env.mock_all_auths();
    
    // Fund treasury
    client.fund_treasury(&100000000);
    
    // Create module
    let module_id = create_test_module(&client, &creator, 5000000, 2);
    
    // Complete module as learner1
    let answer_hash_1 = BytesN::from_array(&env, &[10; 32]);
    let expires_at = env.ledger().timestamp() + 300;
    client.approve_answer(&module_id, &answer_hash_1, &expires_at);
    client.submit_completion(&learner1, &module_id, &answer_hash_1, &180);
    
    // Advance time to avoid cooldown
    env.ledger().set_timestamp(env.ledger().timestamp() + 700);
    
    // Complete module as learner2  
    let answer_hash_2 = BytesN::from_array(&env, &[11; 32]);
    let expires_at_2 = env.ledger().timestamp() + 300;
    client.approve_answer(&module_id, &answer_hash_2, &expires_at_2);
    client.submit_completion(&learner2, &module_id, &answer_hash_2, &180);
    
    // Check leaderboard
    let leaderboard = client.get_leaderboard(&10);
    assert!(leaderboard.len() >= 2);
    
    // Both users should be on leaderboard
    let addresses: Vec<Address> = leaderboard.iter().map(|entry| entry.user.clone()).collect();
    assert!(addresses.contains(&learner1));
    assert!(addresses.contains(&learner2));
}

// ══════════════════════════════════════════════════════════════════════════════
// SECURITY & EDGE CASE TESTS
// ══════════════════════════════════════════════════════════════════════════════

#[test]
#[should_panic(expected = "AnswerHashReused")]  
fn test_answer_hash_reuse_prevention() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let oracle = Address::generate(&env);
    let creator = Address::generate(&env);
    let learner1 = Address::generate(&env);
    let learner2 = Address::generate(&env);
    
    initialize_contract(&client, &admin, &oracle);
    env.mock_all_auths();
    
    // Fund treasury  
    client.fund_treasury(&50000000);
    
    // Create module
    let module_id = create_test_module(&client, &creator, 5000000, 2);
    
    // Same answer hash for both learners
    let answer_hash = BytesN::from_array(&env, &[20; 32]);
    let expires_at = env.ledger().timestamp() + 300;
    client.approve_answer(&module_id, &answer_hash, &expires_at);
    
    // First learner completes successfully
    client.submit_completion(&learner1, &module_id, &answer_hash, &180);
    
    // Second learner tries to use same hash - should fail
    client.submit_completion(&learner2, &module_id, &answer_hash, &180);
}

#[test]
#[should_panic(expected = "ContractPaused")]
fn test_pause_functionality() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let oracle = Address::generate(&env);
    let creator = Address::generate(&env);
    let learner = Address::generate(&env);
    
    initialize_contract(&client, &admin, &oracle);
    env.mock_all_auths();
    
    // Pause the contract
    client.set_pause(&true);
    
    // Try to create module while paused - should fail
    create_test_module(&client, &creator, 5000000, 2);
}

#[test]
fn test_batch_operations() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let oracle = Address::generate(&env);
    let creator = Address::generate(&env);
    
    initialize_contract(&client, &admin, &oracle);
    env.mock_all_auths();
    
    // Create multiple modules
    for i in 0..5 {
        create_test_module(&client, &creator, 1000000 + (i as i128 * 500000), 1 + (i % 5));
    }
    
    // Test batch retrieval
    let modules = client.get_modules_batch(&0, &3);
    assert_eq!(modules.len(), 3);
    
    let modules_all = client.get_modules_batch(&0, &10);
    assert_eq!(modules_all.len(), 5);
}

#[test]
fn test_emergency_functions() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let oracle = Address::generate(&env);
    
    initialize_contract(&client, &admin, &oracle);
    env.mock_all_auths();
    
    // Fund treasury
    client.fund_treasury(&50000000);
    
    // Enable emergency mode
    client.set_emergency_mode(&true);
    
    // Emergency withdrawal
    let withdrawal_amount = 10000000;
    client.emergency_withdraw(&withdrawal_amount);
    
    let remaining_treasury = client.get_treasury_balance();
    assert_eq!(remaining_treasury, 50000000 - withdrawal_amount);
}

// ══════════════════════════════════════════════════════════════════════════════
// PERFORMANCE & STRESS TESTS
// ══════════════════════════════════════════════════════════════════════════════

#[test]
fn test_large_scale_operations() {
    let (env, _, client) = setup_contract();
    let admin = Address::generate(&env);
    let oracle = Address::generate(&env);
    
    initialize_contract(&client, &admin, &oracle);
    env.mock_all_auths();
    
    // Fund treasury with large amount
    client.fund_treasury(&1000000000); // 100 XLM
    
    // Create many modules
    let creators: Vec<Address> = (0..10).map(|_| Address::generate(&env)).collect();
    
    for (i, creator) in creators.iter().enumerate() {
        create_test_module(&client, creator, 1000000, (i % 5 + 1) as u32);
    }
    
    assert_eq!(client.get_module_count(), 10);
    
    // Simulate many users completing modules
    let learners: Vec<Address> = (0..20).map(|_| Address::generate(&env)).collect();
    
    for (i, learner) in learners.iter().enumerate() {
        let module_id = (i % 10) as u32;
        let answer_hash = BytesN::from_array(&env, &[(i + 50) as u8; 32]);
        let expires_at = env.ledger().timestamp() + 300;
        
        client.approve_answer(&module_id, &answer_hash, &expires_at);
        client.submit_completion(learner, &module_id, &answer_hash, &(180 + i as u64));
        
        // Small time advancement to avoid conflicts
        env.ledger().set_timestamp(env.ledger().timestamp() + 10);
    }
    
    // Verify all completions recorded
    let final_leaderboard = client.get_leaderboard(&25);
    assert!(final_leaderboard.len() >= 10); // Should have many entries
}