/* eslint-disable no-undef */
import express from 'express';
import crypto from 'crypto';
import pool from '../db/pool.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

/**
 * GET /api/polls/active
 * Get the currently active poll question
 */
router.get('/active', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [polls] = await connection.execute(
      `SELECT id, question_text, options, published_at FROM poll_questions 
       WHERE status = 'active' LIMIT 1`
    );
    connection.release();

    if (polls.length === 0) {
      return res.json(null);
    }

    const poll = polls[0];
    res.json({
      id: poll.id,
      question: poll.question_text,
      options: JSON.parse(poll.options),
      published_at: poll.published_at,
    });
  } catch (error) {
    console.error('Get active poll error:', error);
    res.status(500).json({ error: 'Failed to get poll' });
  }
});

/**
 * POST /api/polls/:id/vote
 * Submit a vote for a poll
 */
router.post('/:id/vote', rateLimit(5, 60 * 1000), async (req, res) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;

    if (!answer) {
      return res.status(400).json({ error: 'Answer required' });
    }

    const ipAddress = req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
    const userAgent = req.headers['user-agent'] || '';

    // Hash for privacy
    const ipHash = crypto.createHash('sha256').update(ipAddress).digest('hex');
    const userAgentHash = crypto.createHash('sha256').update(userAgent).digest('hex');

    const connection = await pool.getConnection();

    // Check if user already voted in last 24 hours
    const [existing] = await connection.execute(
      `SELECT id FROM poll_votes 
       WHERE poll_question_id = ? 
       AND ip_hash = ? 
       AND user_agent_hash = ? 
       AND voted_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
       LIMIT 1`,
      [id, ipHash, userAgentHash]
    );

    if (existing.length > 0) {
      connection.release();
      return res.status(429).json({ 
        error: 'You have already voted on this poll within the last 24 hours' 
      });
    }

    // Get the poll to verify it exists and is active
    const [polls] = await connection.execute(
      'SELECT question_text, options FROM poll_questions WHERE id = ? AND status = ?',
      [id, 'active']
    );

    if (polls.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Poll not found or inactive' });
    }

    const poll = polls[0];
    const options = JSON.parse(poll.options);

    // Verify answer is valid
    if (!options.includes(answer)) {
      connection.release();
      return res.status(400).json({ error: 'Invalid answer option' });
    }

    // Insert vote
    const [result] = await connection.execute(
      `INSERT INTO poll_votes (poll_question_id, question_text, answer_text, ip_hash, user_agent_hash, votes, voted_at)
       VALUES (?, ?, ?, ?, ?, 1, NOW())`,
      [id, poll.question_text, answer, ipHash, userAgentHash]
    );

    connection.release();

    res.status(201).json({
      message: 'Vote recorded successfully',
      vote_id: result.insertId,
    });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

/**
 * GET /api/polls/:id/results
 * Get results for a specific poll
 */
router.get('/:id/results', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();

    const [questions] = await connection.execute(
      'SELECT question_text, options FROM poll_questions WHERE id = ?',
      [id]
    );

    if (questions.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Poll not found' });
    }

    const [votes] = await connection.execute(
      `SELECT answer_text, COUNT(*) as count
       FROM poll_votes
       WHERE poll_question_id = ?
       GROUP BY answer_text`,
      [id]
    );

    connection.release();

    const options = JSON.parse(questions[0].options);
    const results = {};
    options.forEach(opt => {
      results[opt] = 0;
    });

    votes.forEach(vote => {
      results[vote.answer_text] = vote.count;
    });

    res.json({
      question: questions[0].question_text,
      results,
      total_votes: Object.values(results).reduce((a, b) => a + b, 0),
    });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ error: 'Failed to get results' });
  }
});

export default router;
