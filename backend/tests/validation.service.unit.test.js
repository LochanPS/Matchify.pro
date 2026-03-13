/**
 * Unit Tests for Validation Service
 * Testing specific requirements for Task 2.1
 */

import { describe, it, expect } from '@jest/globals';
import validationService from '../src/services/validation.service.js';

describe('ValidationService - Unit Tests for Task 2.1', () => {
  describe('validateParticipantCount', () => {
    it('should reject N < 2 with clear error message', () => {
      const result = validationService.validateParticipantCount(1);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Tournament requires at least 2 participants');
    });

    it('should reject 0 participants', () => {
      const result = validationService.validateParticipantCount(0);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject negative participant counts', () => {
      const result = validationService.validateParticipantCount(-5);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should accept exactly 2 participants', () => {
      const result = validationService.validateParticipantCount(2);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should accept any N >= 2', () => {
      const testCases = [2, 3, 5, 8, 16, 32, 100];
      testCases.forEach(count => {
        const result = validationService.validateParticipantCount(count);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });
    });

    it('should reject non-numeric values', () => {
      const result = validationService.validateParticipantCount('invalid');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Participant count must be a valid number');
    });

    it('should reject NaN', () => {
      const result = validationService.validateParticipantCount(NaN);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Participant count must be a valid number');
    });
  });

  describe('validateQualifierCount', () => {
    it('should validate 1 ≤ Q ≤ N - accept valid range', () => {
      const result = validationService.validateQualifierCount(4, 8);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate 1 ≤ Q ≤ N - accept Q = 1', () => {
      const result = validationService.validateQualifierCount(1, 10);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate 1 ≤ Q ≤ N - accept Q = N', () => {
      const result = validationService.validateQualifierCount(8, 8);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate 1 ≤ Q ≤ N - reject Q < 1', () => {
      const result = validationService.validateQualifierCount(0, 8);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Must select at least 1 qualifier');
    });

    it('should validate 1 ≤ Q ≤ N - reject Q > N', () => {
      const result = validationService.validateQualifierCount(10, 8);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Cannot select 10 qualifiers from 8 participants');
    });

    it('should reject negative qualifier counts', () => {
      const result = validationService.validateQualifierCount(-1, 8);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should provide clear error message when Q > N', () => {
      const result = validationService.validateQualifierCount(5, 3);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toMatch(/Cannot select \d+ qualifiers from \d+ participants/);
    });

    it('should reject non-numeric qualifier count', () => {
      const result = validationService.validateQualifierCount('invalid', 8);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Qualifier count must be a valid number');
    });

    it('should reject non-numeric total participants', () => {
      const result = validationService.validateQualifierCount(4, 'invalid');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Total participants must be a valid number');
    });
  });

  describe('Requirements Validation', () => {
    it('should satisfy Requirement 13.1 - reject N < 2', () => {
      // WHEN a tournament is created with fewer than 2 participants,
      // THE Tournament_System SHALL reject the creation and return an error
      const result = validationService.validateParticipantCount(1);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should satisfy Requirement 3.1 - validate Q ≤ N', () => {
      // WHEN an organizer selects Q qualifiers from N round-robin participants,
      // THE Tournament_System SHALL validate that Q ≤ N
      const result = validationService.validateQualifierCount(10, 8);
      expect(result.isValid).toBe(false);
    });

    it('should satisfy Requirement 3.2 - reject when Q > N', () => {
      // IF Q > N, THEN THE Tournament_System SHALL reject the selection
      // and return an error message
      const result = validationService.validateQualifierCount(10, 8);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Cannot select');
    });
  });
});
