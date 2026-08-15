pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = 'finops'
        DEPLOY_DIR = '/home/ubuntu/aws-finops'
    }

    options {
        timeout(time: 15, unit: 'MINUTES')
        disableConcurrentBuilds()
        timestamps()
    }

    stages {
        // ==================== STAGE 1: Checkout ====================
        stage('📥 Checkout') {
            steps {
                echo '🔄 Pulling latest code from GitHub...'
                checkout scm
            }
        }

        // ==================== STAGE 2: Prepare Deployment Directory ====================
        stage('📁 Prepare Deploy Directory') {
            steps {
                echo '📂 Syncing code to deployment directory...'
                sh """
                    # Create deploy directory if it doesn't exist
                    mkdir -p ${DEPLOY_DIR}

                    # Sync the workspace to the deployment directory
                    rsync -av --delete \
                        --exclude '.git' \
                        --exclude 'node_modules' \
                        --exclude '.env' \
                        ${WORKSPACE}/ ${DEPLOY_DIR}/
                """
            }
        }

        // ==================== STAGE 3: Inject Environment Variables ====================
        stage('🔐 Inject Secrets') {
            steps {
                echo '🔑 Injecting production environment variables...'
                withCredentials([
                    string(credentialsId: 'MONGO_URI', variable: 'MONGO_URI'),
                    string(credentialsId: 'JWT_SECRET', variable: 'JWT_SECRET'),
                    string(credentialsId: 'ENCRYPTION_KEY', variable: 'ENCRYPTION_KEY')
                ]) {
                    sh """
                        cat > ${DEPLOY_DIR}/backend/.env.production << 'ENVEOF'
PORT=5000
MONGO_URI=${MONGO_URI}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d
ENCRYPTION_KEY=${ENCRYPTION_KEY}
ENVEOF
                    """
                }
            }
        }

        // ==================== STAGE 4: Build Docker Images ====================
        stage('🐳 Build Docker Images') {
            steps {
                echo '🔨 Building Docker images...'
                dir("${DEPLOY_DIR}") {
                    sh 'docker compose build --no-cache'
                }
            }
        }

        // ==================== STAGE 5: Deploy ====================
        stage('🚀 Deploy') {
            steps {
                echo '🚀 Deploying with Docker Compose...'
                dir("${DEPLOY_DIR}") {
                    sh """
                        # Stop existing containers (if any)
                        docker compose down --remove-orphans || true

                        # Start fresh containers in detached mode
                        docker compose up -d

                        # Wait for services to be healthy
                        echo '⏳ Waiting for services to start...'
                        sleep 15
                    """
                }
            }
        }

        // ==================== STAGE 6: Health Check ====================
        stage('✅ Health Check') {
            steps {
                echo '🏥 Running health checks...'
                sh """
                    # Check if all containers are running
                    echo '--- Container Status ---'
                    docker compose -f ${DEPLOY_DIR}/docker-compose.yml ps

                    # Test backend API
                    echo '--- Backend Health ---'
                    curl -sf http://localhost:5000/api/auth || echo '⚠️ Backend not responding yet (may still be starting)'

                    # Test frontend
                    echo '--- Frontend Health ---'
                    curl -sf http://localhost:80 || echo '⚠️ Frontend not responding yet'
                """
            }
        }

        // ==================== STAGE 7: Cleanup ====================
        stage('🧹 Cleanup') {
            steps {
                echo '🧹 Cleaning up unused Docker resources...'
                sh """
                    # Remove dangling images to save disk space
                    docker image prune -f || true
                """
            }
        }
    }

    post {
        success {
            echo """
            ✅ ═══════════════════════════════════════════
            ✅  DEPLOYMENT SUCCESSFUL!
            ✅  Frontend: http://<YOUR_ELASTIC_IP>
            ✅  Backend:  http://<YOUR_ELASTIC_IP>:5000
            ✅ ═══════════════════════════════════════════
            """
        }
        failure {
            echo """
            ❌ ═══════════════════════════════════════════
            ❌  DEPLOYMENT FAILED!
            ❌  Check the logs above for errors.
            ❌ ═══════════════════════════════════════════
            """
            // Optional: rollback to previous version
            sh """
                cd ${DEPLOY_DIR} && docker compose down || true
                cd ${DEPLOY_DIR} && docker compose up -d || true
            """
        }
        always {
            // Clean workspace
            cleanWs()
        }
    }.
}