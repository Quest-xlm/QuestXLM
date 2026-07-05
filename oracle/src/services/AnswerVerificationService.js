/**
 * Answer Verification Service
 * 
 * Handles secure verification of quiz answers using cryptographic proofs
 * and anti-cheat mechanisms. Implements zero-knowledge verification patterns.
 */

import crypto from 'crypto';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'answer-verification' },
});

export class AnswerVerificationService {
  constructor(contractService, cacheService) {
    this.contractService = contractService;
    this.cacheService = cacheService;
    this.logger = logger;
  }

  /**
   * Verify and approve an answer submission
   * 
   * @param {Object} submission - Answer submission data
   * @param {number} submission.moduleId - Module ID
   * @param {string} submission.answerText - User's answer
   * @param {string} submission.learnerAddress - Stellar address of learner
   * @param {number} submission.timestamp - Submission timestamp
   * @param {string} submission.nonce - Random nonce for uniqueness
   */
  async verifyAnswer(submission) {
    try {
      this.logger.info('Processing answer verification', {
        moduleId: submission.moduleId,
        learnerAddress: submission.learnerAddress,
        timestamp: submission.timestamp
      });

      // 1. Validate input parameters
      this.validateSubmission(submission);

      // 2. Get module data and correct answer
      const module = await this.getModuleData(submission.moduleId);
      if (!module) {
        throw new Error(`Module ${submission.moduleId} not found`);
      }

      // 3. Check if answer is correct
      const isCorrect = await this.checkAnswer(
        submission.answerText, 
        module.correctAnswers
      );

      if (!isCorrect) {
        this.logger.warn('Incorrect answer submitted', {
          moduleId: submission.moduleId,
          learnerAddress: submission.learnerAddress
        });
        return {
          success: false,
          error: 'INCORRECT_ANSWER',
          message: 'The provided answer is incorrect'
        };
      }

      // 4. Generate answer hash for on-chain verification
      const answerHash = this.generateAnswerHash(
        submission.answerText,
        submission.learnerAddress,
        submission.moduleId,
        submission.nonce
      );

      // 5. Check for duplicate submissions
      const isDuplicate = await this.checkDuplicateSubmission(answerHash);
      if (isDuplicate) {
        return {
          success: false,
          error: 'DUPLICATE_SUBMISSION',
          message: 'This answer has already been submitted'
        };
      }

      // 6. Pre-approve the answer hash on the contract
      const approvalResult = await this.approveAnswerOnContract(
        submission.moduleId,
        answerHash,
        submission.learnerAddress
      );

      if (!approvalResult.success) {
        throw new Error(`Failed to approve answer on contract: ${approvalResult.error}`);
      }

      // 7. Cache the verification for rate limiting
      await this.cacheVerification(answerHash, submission);

      this.logger.info('Answer verification successful', {
        moduleId: submission.moduleId,
        learnerAddress: submission.learnerAddress,
        answerHash: answerHash
      });

      return {
        success: true,
        answerHash: answerHash,
        expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutes
        message: 'Answer verified and approved for submission'
      };

    } catch (error) {
      this.logger.error('Answer verification failed', {
        error: error.message,
        stack: error.stack,
        moduleId: submission.moduleId,
        learnerAddress: submission.learnerAddress
      });

      return {
        success: false,
        error: 'VERIFICATION_FAILED',
        message: 'Failed to verify answer'
      };
    }
  }

  /**
   * Validate submission data
   */
  validateSubmission(submission) {
    const required = ['moduleId', 'answerText', 'learnerAddress', 'timestamp', 'nonce'];
    
    for (const field of required) {
      if (!submission[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate Stellar address format
    if (!this.isValidStellarAddress(submission.learnerAddress)) {
      throw new Error('Invalid Stellar address format');
    }

    // Validate timestamp (not too old, not in future)
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes
    
    if (submission.timestamp < now - maxAge || submission.timestamp > now + 60000) {
      throw new Error('Invalid timestamp');
    }

    // Validate answer length
    if (submission.answerText.length > 1000) {
      throw new Error('Answer text too long');
    }
  }

  /**
   * Get module data including correct answers
   */
  async getModuleData(moduleId) {
    try {
      // First check cache
      const cached = await this.cacheService.get(`module_${moduleId}`);
      if (cached) {
        return cached;
      }

      // Fetch from contract or database
      const module = await this.contractService.getModule(moduleId);
      
      if (module) {
        // Cache for 1 hour
        await this.cacheService.set(`module_${moduleId}`, module, 3600);
      }

      return module;
    } catch (error) {
      this.logger.error('Failed to get module data', {
        moduleId,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Check if provided answer matches correct answer(s)
   */
  async checkAnswer(providedAnswer, correctAnswers) {
    if (!Array.isArray(correctAnswers)) {
      correctAnswers = [correctAnswers];
    }

    // Normalize answer for comparison
    const normalizedProvided = this.normalizeAnswer(providedAnswer);

    return correctAnswers.some(correct => 
      this.normalizeAnswer(correct) === normalizedProvided
    );
  }

  /**
   * Normalize answer text for comparison
   */
  normalizeAnswer(answer) {
    return answer
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, ''); // Remove special characters
  }

  /**
   * Generate cryptographic hash for answer
   */
  generateAnswerHash(answerText, learnerAddress, moduleId, nonce) {
    const message = `${answerText}${learnerAddress}${moduleId}${nonce}`;
    return crypto.createHash('sha256').update(message).digest('hex');
  }

  /**
   * Check for duplicate submissions
   */
  async checkDuplicateSubmission(answerHash) {
    try {
      const exists = await this.cacheService.get(`submitted_${answerHash}`);
      return !!exists;
    } catch (error) {
      this.logger.error('Failed to check duplicate submission', {
        answerHash,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Approve answer hash on the smart contract
   */
  async approveAnswerOnContract(moduleId, answerHash, learnerAddress) {
    try {
      const expirationTime = Math.floor(Date.now() / 1000) + 300; // 5 minutes from now
      
      const result = await this.contractService.approveAnswer(
        moduleId,
        answerHash,
        expirationTime
      );

      return {
        success: true,
        transactionHash: result.hash
      };
    } catch (error) {
      this.logger.error('Failed to approve answer on contract', {
        moduleId,
        answerHash,
        learnerAddress,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cache verification for rate limiting and audit
   */
  async cacheVerification(answerHash, submission) {
    try {
      // Mark as submitted to prevent duplicates
      await this.cacheService.set(`submitted_${answerHash}`, true, 3600);

      // Store verification details for audit
      const auditData = {
        answerHash,
        moduleId: submission.moduleId,
        learnerAddress: submission.learnerAddress,
        timestamp: Date.now(),
        nonce: submission.nonce
      };

      await this.cacheService.set(`audit_${answerHash}`, auditData, 86400); // 24 hours
    } catch (error) {
      this.logger.error('Failed to cache verification', {
        answerHash,
        error: error.message
      });
    }
  }

  /**
   * Validate Stellar address format
   */
  isValidStellarAddress(address) {
    // Basic Stellar address validation
    return /^G[A-Z2-7]{55}$/.test(address);
  }

  /**
   * Get verification statistics
   */
  async getVerificationStats() {
    try {
      const stats = await this.cacheService.get('verification_stats');
      return stats || {
        totalVerifications: 0,
        successfulVerifications: 0,
        failedVerifications: 0,
        duplicateAttempts: 0
      };
    } catch (error) {
      this.logger.error('Failed to get verification stats', {
        error: error.message
      });
      return null;
    }
  }

  /**
   * Update verification statistics
   */
  async updateVerificationStats(outcome) {
    try {
      let stats = await this.getVerificationStats() || {
        totalVerifications: 0,
        successfulVerifications: 0,
        failedVerifications: 0,
        duplicateAttempts: 0
      };

      stats.totalVerifications++;

      switch (outcome) {
        case 'success':
          stats.successfulVerifications++;
          break;
        case 'failed':
          stats.failedVerifications++;
          break;
        case 'duplicate':
          stats.duplicateAttempts++;
          break;
      }

      await this.cacheService.set('verification_stats', stats, 86400);
    } catch (error) {
      this.logger.error('Failed to update verification stats', {
        error: error.message
      });
    }
  }
}