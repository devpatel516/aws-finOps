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
        // ==================== STAGE 1: Prepare Deployment Directory ====================
        stage('📁 Prepare Deploy Directory') {
            steps {
                echo '📂 Syncing code to deployment directory...'
                sh """
                    # Create deploy directory using sudo
                    sudo mkdir -p ${DEPLOY_DIR}
                    
                    # Fix folder ownership so jenkins can write files into it
                    sudo chown -R jenkins:jenkins ${DEPLOY_DIR}

                    # Sync the workspace to the deployment directory
                    rsync -av --delete \
                        --exclude '.git' \
                        --exclude 'node_modules' \
                        --exclude '.env' \
                        ${WORKSPACE}/ ${DEPLOY_DIR}/
                """
            }
        }

        // ==================== STAGE 2: Inject Environment Variables ====================
        stage('🔐 Inject Secrets') {
            steps {
                echo '🔑 Injecting production environment variables...'
                withCredentials([
                    string(credentialsId: 'MONGO_URI', variable: 'MONGO_URI'),
                    string(credentialsId: 'JWT_SECRET', variable: 'JWT_SECRET'),
                    string(credentialsId: 'ENCRYPTION_KEY', variable: 'ENCRYPTION_KEY')
                ]) {
                    sh """
                        # Create the configuration file with sudo
                        sudo tee ${DEPLOY_DIR}/backend/.env.production << 'ENVEOF' > /dev/null
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

        // ==================== STAGE 3: Build Docker Images ====================
        stage('🐳 Build Docker Images') {
            steps {
                echo '🔨 Building Docker images...'
                dir("${DEPLOY_DIR}") {
                    sh 'sudo docker compose build --no-cache'
                }
            }
        }

        // ==================== STAGE 4: Deploy ====================
        stage('🚀 Deploy') {
            steps {
                echo '🚀 Deploying with Docker Compose...'
                dir("${DEPLOY_DIR}") {
                    sh """
                        # Stop existing containers using sudo
                        sudo docker compose down --remove-orphans || true

                        # Start fresh containers
                        sudo docker compose up -d

                        # Wait for services to be healthy
                        echo '⏳ Waiting for services to start...'
                        sleep 15
                    """
                }
            }
        }

        // ==================== STAGE 5: Health Check ====================
        stage('✅ Health Check') {
            steps {
                echo '🏥 Running health checks...'
                sh """
                    echo '--- Container Status ---'
                    sudo docker compose -f ${DEPLOY_DIR}/docker-compose.yml ps

                    echo '--- Backend Health ---'
                    curl -sf http://localhost:5000/api/auth || echo '⚠️ Backend not responding yet'

                    echo '--- Frontend Health ---'
                    curl -sf http://localhost:80 || echo '⚠️ Frontend not responding yet'
                """
            }
        }

        // ==================== STAGE 6: Cleanup ====================
        stage('🧹 Cleanup') {
            steps {
                echo '🧹 Cleaning up unused Docker resources...'
                sh """
                    sudo docker image prune -f || true
                """
            }
        }
    }

    post {
        success {
            echo """
            ✅ ═══════════════════════════════════════════
            ✅  DEPLOYMENT SUCCESSFUL!
            ✅ ═══════════════════════════════════════════
            """
        }
        failure {
            echo """
            ❌ ═══════════════════════════════════════════
            ❌  DEPLOYMENT FAILED!
            ❌ ═══════════════════════════════════════════
            """
            sh """
                # Run cleanup/rollback tasks with sudo if directory exists
                if [ -d "${DEPLOY_DIR}" ]; then
                    cd ${DEPLOY_DIR} && sudo docker compose down || true
                    cd ${DEPLOY_DIR} && sudo docker compose up -d || true
                fi
            """
        }
        always {
            cleanWs()
        }
    }
}
