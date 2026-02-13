const express = require('express');
const router = express.Router();
const GitHubService = require('../services/GitHubService');
const UserService = require('../services/UserService');
const ActivityLogService = require('../services/ActivityLogService');
const { authMiddleware } = require('../middlewares/auth');

// Get all repositories
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { page = 1, perPage = 10 } = req.query;
    
    const github = new GitHubService();
    const repos = await github.listRepositories(parseInt(page), parseInt(perPage));
    
    await UserService.incrementUsage(req.user.id, 'apiCall');
    
    res.json({
      success: true,
      data: repos,
      pagination: {
        page: parseInt(page),
        perPage: parseInt(perPage),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get repository by name
router.get('/:name', authMiddleware, async (req, res, next) => {
  try {
    const { name } = req.params;
    
    const github = new GitHubService();
    const user = await github.getUser();
    const repo = await github.getRepository(user.login, name);
    
    await UserService.incrementUsage(req.user.id, 'apiCall');
    
    res.json({
      success: true,
      data: repo,
    });
  } catch (error) {
    next(error);
  }
});

// Create repository
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { name, isPrivate = true, description } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Repository name is required',
      });
    }

    if (!req.user.canPerformAction('createRepo')) {
      return res.status(403).json({
        success: false,
        message: 'Repository limit reached for your plan',
      });
    }

    const github = new GitHubService();
    const repo = await github.createRepository(name, isPrivate);
    
    if (description) {
      const user = await github.getUser();
      await github.updateRepository(user.login, name, { description });
    }

    await UserService.incrementUsage(req.user.id, 'repoCreated');
    await UserService.incrementUsage(req.user.id, 'apiCall');
    
    await ActivityLogService.createLog(
      req.user.id,
      'create_repo_api',
      'repository',
      name,
      'success'
    );

    res.status(201).json({
      success: true,
      data: repo,
    });
  } catch (error) {
    next(error);
  }
});

// Update repository
router.patch('/:name', authMiddleware, async (req, res, next) => {
  try {
    const { name } = req.params;
    const updates = req.body;
    
    const github = new GitHubService();
    const user = await github.getUser();
    const repo = await github.updateRepository(user.login, name, updates);
    
    await UserService.incrementUsage(req.user.id, 'apiCall');
    
    await ActivityLogService.createLog(
      req.user.id,
      'update_repo_api',
      'repository',
      name,
      'success'
    );

    res.json({
      success: true,
      data: repo,
    });
  } catch (error) {
    next(error);
  }
});

// Delete repository
router.delete('/:name', authMiddleware, async (req, res, next) => {
  try {
    const { name } = req.params;
    
    const github = new GitHubService();
    const user = await github.getUser();
    await github.deleteRepository(user.login, name);
    
    await UserService.incrementUsage(req.user.id, 'repoDeleted');
    await UserService.incrementUsage(req.user.id, 'apiCall');
    
    await ActivityLogService.createLog(
      req.user.id,
      'delete_repo_api',
      'repository',
      name,
      'success'
    );

    res.json({
      success: true,
      message: 'Repository deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
