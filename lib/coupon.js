/**
 * Phase 5: Coupon Management
 * Functions to generate and save coupons in Supabase
 */

import { supabase } from './supabaseClient';

/**
 * Generates a random coupon code in the format BANALATAXXXX
 */
export const generateCouponCode = () => {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
  return `BANALATA${randomSuffix}`;
};

/**
 * Saves a new coupon to the Supabase database
 * @param {string} userId - The UUID of the logged-in user (null = unassigned pool)
 * @param {string} code - The generated coupon code
 * @param {string} source - Where the coupon came from ('game', 'review', or 'manual')
 * @param {string} [screenshotUrl] - Optional link to the proof image
 * @param {string} [expiresAt] - Optional expiration date
 */
export const saveCoupon = async (userId, code, source, screenshotUrl = null, expiresAt = null, rewardText = null) => {
  const { data, error } = await supabase
    .from('coupons')
    .insert([
      {
        user_id: userId,
        coupon_code: code,
        source: source,
        screenshot_url: screenshotUrl,
        is_redeemed: false,
        expires_at: expiresAt,
        reward_text: rewardText
      }
    ])
    .select();

  if (error) {
    console.error('Error saving coupon:', error.message);
    throw error;
  }

  return data[0];
};

/**
 * Claims a random unassigned coupon from the pool for a source (game/review).
 * Templates are cloned so the pool NEVER runs out.
 * @param {string} userId - The UUID of the logged-in user claiming the reward
 * @param {string} source - The source category ('game' or 'review')
 * @param {string} [screenshotUrl] - Optional link for proof
 */
export const claimRandomCouponFromPool = async (userId, source, screenshotUrl = null) => {
  // 1. Fetch all templates for this source (user_id is null)
  const { data: templates, error } = await supabase
    .from('coupons')
    .select('*')
    .is('user_id', null)
    .eq('source', source);

  if (error) {
     console.error('Pool lookup error:', error.message);
  }

  let codeToGive;
  let rewardTextToGive = null;

  if (templates && templates.length > 0) {
     // 2. Pick a random template from the ones the admin created
     const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
     codeToGive = randomTemplate.coupon_code || generateCouponCode();
     rewardTextToGive = randomTemplate.reward_text;
  } else {
     // 3. If admin hasn't created any templates, DO NOT generate a random coupon
     console.log(`No templates found for source: ${source}. Claim failed.`);
     return null;
  }

  // Set expiration to 7 days from now ONLY for game rewards
  let expiryDateIso = null;
  if (source.startsWith('game')) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    expiryDateIso = expiryDate.toISOString();
  }

  // 4. Create a NEW coupon entry for this specific user
  const { data: newClaim, error: claimError } = await supabase
    .from('coupons')
    .insert([{
       user_id: userId,
       coupon_code: codeToGive,
       source: source,
       screenshot_url: screenshotUrl,
       is_redeemed: false,
       expires_at: expiryDateIso,
       reward_text: rewardTextToGive
    }])
    .select();

  if (claimError) {
    console.error('Claim creation error:', claimError.message);
    throw claimError;
  }

  return newClaim[0];
};

/**
 * Fetches all coupons for a specific user
 * @param {string} userId - The UUID of the logged-in user
 */
export const fetchUserCoupons = async (userId) => {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching coupons:', error.message);
    throw error;
  }

  return data;
};
