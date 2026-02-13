const { Octokit } = require('@octokit/rest');
const config = require('../config');
const logger = require('../utils/logger');

class GitHubService {
  constructor(userToken = null) {
    this.octokit = new Octokit({
      auth: userToken || config.github.token,
      request: {
        timeout: 30000,
      },
    });
  }

  async getUser() {
    try {
      const { data } = await this.octokit.users.getAuthenticated();
      return data;
    } catch (error) {
      logger.error('GitHub getUser error:', error);
      throw error;
    }
  }

  async listRepositories(page = 1, perPage = 10) {
    try {
      const { data } = await this.octokit.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: perPage,
        page,
      });
      return data;
    } catch (error) {
      logger.error('GitHub listRepositories error:', error);
      throw error;
    }
  }

  async getRepository(owner, repo) {
    try {
      const { data } = await this.octokit.repos.get({ owner, repo });
      return data;
    } catch (error) {
      logger.error('GitHub getRepository error:', error);
      throw error;
    }
  }

  async createRepository(name, isPrivate = true) {
    try {
      const { data } = await this.octokit.repos.createForAuthenticatedUser({
        name,
        private: isPrivate,
        auto_init: true,
      });
      return data;
    } catch (error) {
      logger.error('GitHub createRepository error:', error);
      throw error;
    }
  }

  async deleteRepository(owner, repo) {
    try {
      await this.octokit.repos.delete({ owner, repo });
      return true;
    } catch (error) {
      logger.error('GitHub deleteRepository error:', error);
      throw error;
    }
  }

  async updateRepository(owner, repo, updates) {
    try {
      const { data } = await this.octokit.repos.update({
        owner,
        repo,
        ...updates,
      });
      return data;
    } catch (error) {
      logger.error('GitHub updateRepository error:', error);
      throw error;
    }
  }

  async uploadFiles(owner, repo, files) {
    try {
      // Get the latest commit SHA
      const { data: ref } = await this.octokit.git.getRef({
        owner,
        repo,
        ref: 'heads/main',
      }).catch(() => this.octokit.git.getRef({
        owner,
        repo,
        ref: 'heads/master',
      }));

      const commitSha = ref.object.sha;
      const { data: commit } = await this.octokit.git.getCommit({
        owner,
        repo,
        commit_sha: commitSha,
      });

      // Create blobs for all files
      const blobs = await Promise.all(
        files.map(async (file) => {
          const { data: blob } = await this.octokit.git.createBlob({
            owner,
            repo,
            content: file.content,
            encoding: 'base64',
          });
          return {
            path: file.path,
            mode: '100644',
            type: 'blob',
            sha: blob.sha,
          };
        })
      );

      // Create tree
      const { data: tree } = await this.octokit.git.createTree({
        owner,
        repo,
        base_tree: commit.tree.sha,
        tree: blobs,
      });

      // Create commit
      const { data: newCommit } = await this.octokit.git.createCommit({
        owner,
        repo,
        message: 'Upload via GitHub SaaS Platform',
        tree: tree.sha,
        parents: [commitSha],
      });

      // Update reference
      await this.octokit.git.updateRef({
        owner,
        repo,
        ref: 'heads/main',
        sha: newCommit.sha,
      }).catch(() => this.octokit.git.updateRef({
        owner,
        repo,
        ref: 'heads/master',
        sha: newCommit.sha,
      }));

      return newCommit;
    } catch (error) {
      logger.error('GitHub uploadFiles error:', error);
      throw error;
    }
  }

  async downloadRepository(owner, repo) {
    try {
      const { data } = await this.octokit.repos.downloadZipballArchive({
        owner,
        repo,
        ref: 'main',
      }).catch(() => this.octokit.repos.downloadZipballArchive({
        owner,
        repo,
        ref: 'master',
      }));
      return data;
    } catch (error) {
      logger.error('GitHub downloadRepository error:', error);
      throw error;
    }
  }

  async getStats() {
    try {
      const user = await this.getUser();
      const repos = await this.listRepositories(1, 100);
      
      const totalStars = repos.reduce((acc, repo) => acc + repo.stargazers_count, 0);
      const languages = {};
      
      repos.forEach(repo => {
        if (repo.language) {
          languages[repo.language] = (languages[repo.language] || 0) + 1;
        }
      });

      return {
        username: user.login,
        totalRepos: repos.length,
        publicRepos: user.public_repos,
        privateRepos: repos.length - user.public_repos,
        totalStars,
        followers: user.followers,
        following: user.following,
        languages,
      };
    } catch (error) {
      logger.error('GitHub getStats error:', error);
      throw error;
    }
  }

  async checkRateLimit() {
    try {
      const { data } = await this.octokit.rateLimit.get();
      return {
        limit: data.rate.limit,
        remaining: data.rate.remaining,
        reset: new Date(data.rate.reset * 1000),
      };
    } catch (error) {
      logger.error('GitHub checkRateLimit error:', error);
      throw error;
    }
  }
}

module.exports = GitHubService;
