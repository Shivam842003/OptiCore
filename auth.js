// GitHub OAuth Configuration
const GITHUB_CLIENT_ID = 'your_github_client_id_here'; // Replace with your actual GitHub OAuth App Client ID
const GITHUB_CLIENT_SECRET = 'your_github_client_secret_here'; // Replace with your actual GitHub OAuth App Client Secret
const REDIRECT_URI = window.location.origin + '/auth/callback/github';

class GitHubAuth {
    constructor() {
        this.accessToken = localStorage.getItem('github_access_token');
        this.userInfo = JSON.parse(localStorage.getItem('github_user_info') || 'null');
    }

    // Generate a random state parameter for CSRF protection
    generateState() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Initiate GitHub OAuth flow
    login() {
        const state = this.generateState();
        localStorage.setItem('oauth_state', state);
        
        const params = new URLSearchParams({
            client_id: GITHUB_CLIENT_ID,
            redirect_uri: REDIRECT_URI,
            scope: 'user:email read:user',
            state: state,
            allow_signup: 'true'
        });

        window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
    }

    // Handle the OAuth callback
    async handleCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const storedState = localStorage.getItem('oauth_state');

        // Verify state parameter to prevent CSRF attacks
        if (!state || state !== storedState) {
            throw new Error('Invalid state parameter. Possible CSRF attack.');
        }

        if (!code) {
            throw new Error('No authorization code received from GitHub.');
        }

        try {
            // Exchange code for access token
            const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    client_id: GITHUB_CLIENT_ID,
                    client_secret: GITHUB_CLIENT_SECRET,
                    code: code,
                    redirect_uri: REDIRECT_URI
                })
            });

            const tokenData = await tokenResponse.json();

            if (tokenData.error) {
                throw new Error(`GitHub OAuth error: ${tokenData.error_description}`);
            }

            this.accessToken = tokenData.access_token;
            localStorage.setItem('github_access_token', this.accessToken);

            // Fetch user information
            const userResponse = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            const userData = await userResponse.json();
            this.userInfo = userData;
            localStorage.setItem('github_user_info', JSON.stringify(userData));

            // Clean up
            localStorage.removeItem('oauth_state');
            
            return userData;
        } catch (error) {
            console.error('OAuth callback error:', error);
            throw error;
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!(this.accessToken && this.userInfo);
    }

    // Get current user info
    getUserInfo() {
        return this.userInfo;
    }

    // Logout user
    logout() {
        this.accessToken = null;
        this.userInfo = null;
        localStorage.removeItem('github_access_token');
        localStorage.removeItem('github_user_info');
        localStorage.removeItem('oauth_state');
    }

    // Make authenticated API requests to GitHub
    async apiRequest(endpoint, options = {}) {
        if (!this.accessToken) {
            throw new Error('Not authenticated. Please login first.');
        }

        const response = await fetch(`https://api.github.com${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
                ...options.headers
            }
        });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }
}

// Initialize GitHub Auth
const githubAuth = new GitHubAuth();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GitHubAuth;
}